-- Migration: Allow recovery of partial days and fix shield streak preservation
-- Changes:
-- 1. Redefines recover_day_with_powerup to allow recovering any day where completed_count < total_count.
--    Calculates growth atomically and proportionally (restoring +1% total target growth, adjusting for partial growth).
-- 2. Redefines finalize_missed_days to consume a shield and preserve streak for both fully missed and partial days.

CREATE OR REPLACE FUNCTION public.recover_day_with_powerup(
  p_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_stats user_stats;
  v_log daily_logs;
  v_recovery_growth double precision;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  SELECT * INTO v_stats FROM public.user_stats WHERE user_id = v_user_id FOR UPDATE;
  SELECT * INTO v_log FROM public.daily_logs WHERE user_id = v_user_id AND date = p_date FOR UPDATE;

  IF v_stats.power_ups < 1 THEN
    RETURN jsonb_build_object('success', false, 'message', 'No power-ups available');
  END IF;

  IF v_log.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'No log found for this date');
  END IF;

  IF v_log.is_recovered THEN
    RETURN jsonb_build_object('success', false, 'message', 'Day already recovered');
  END IF;

  -- Allow recovery if the day is not perfect
  IF v_log.completed_count >= v_log.total_count THEN
    RETURN jsonb_build_object('success', false, 'message', 'This day is already perfect');
  END IF;

  -- Calculate the recovery growth: we scale to +1% total target growth, adjusting for whatever partial growth they already earned
  v_recovery_growth := v_stats.current_growth * (1.01 / (1.0 + (COALESCE(v_log.completed_count, 0)::double precision / COALESCE(v_log.total_count, 1)::double precision * 0.01)));

  -- Mark the log as recovered
  UPDATE public.daily_logs
  SET
    is_recovered  = true,
    growth_after  = v_recovery_growth
  WHERE user_id = v_user_id AND date = p_date;

  -- Apply to user stats
  UPDATE public.user_stats
  SET
    power_ups      = power_ups - 1,
    current_growth = v_recovery_growth
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Day recovered');
END;
$$;

GRANT EXECUTE ON FUNCTION public.recover_day_with_powerup(date) TO authenticated;


CREATE OR REPLACE FUNCTION public.finalize_missed_days()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_yesterday date := current_date - 1;
  v_log daily_logs;
  v_stats user_stats;
  v_curr_date date;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  SELECT * INTO v_stats FROM public.user_stats WHERE user_id = v_user_id FOR UPDATE;

  -- Start from the user's start_date, or 30 days ago if they've been gone a long time
  v_curr_date := v_stats.start_date;
  IF v_curr_date < current_date - 30 THEN
    v_curr_date := current_date - 30;
  END IF;

  -- Walk forward day by day up to yesterday
  WHILE v_curr_date <= v_yesterday LOOP
    SELECT * INTO v_log FROM public.daily_logs
      WHERE user_id = v_user_id AND date = v_curr_date FOR UPDATE;

    -- A day is perfect (or preserved/recovered) if:
    -- 1. It is already marked as recovered (is_recovered = true)
    -- 2. It already had a shield used (shield_used = true)
    -- 3. It was completed perfectly (completed_count = total_count AND total_count > 0)
    IF v_log.id IS NOT NULL AND (v_log.is_recovered OR v_log.shield_used OR (v_log.completed_count = v_log.total_count AND v_log.total_count > 0)) THEN
      -- Keep our streak tracker in sync with historical truth
      v_stats.streak := COALESCE(v_log.streak_after, 0);
    ELSE
      -- Missed or Partial day that is not shielded or recovered
      IF v_stats.shields > 0 THEN
        IF v_log.id IS NULL THEN
          INSERT INTO public.daily_logs (
            user_id, date, completed_habits, completed_count, total_count,
            shield_used, streak_after, growth_before, growth_after, locked
          ) VALUES (
            v_user_id, v_curr_date, '[]', 0, 1,
            true, v_stats.streak, v_stats.current_growth, v_stats.current_growth, true
          );
        ELSE
          UPDATE public.daily_logs
          SET shield_used = true, locked = true, streak_after = v_stats.streak
          WHERE id = v_log.id;
        END IF;
        
        v_stats.shields := v_stats.shields - 1;
        -- v_stats.streak stays the same (preserved by shield)
      ELSE
        -- No shields left, streak resets
        v_stats.streak := 0;
        
        IF v_log.id IS NULL THEN
          INSERT INTO public.daily_logs (
            user_id, date, completed_habits, completed_count, total_count,
            shield_used, streak_after, growth_before, growth_after, locked
          ) VALUES (
            v_user_id, v_curr_date, '[]', 0, 1,
            false, 0, v_stats.current_growth, v_stats.current_growth, true
          );
        ELSE
          UPDATE public.daily_logs
          SET locked = true, streak_after = 0
          WHERE id = v_log.id;
        END IF;
      END IF;
    END IF;

    v_curr_date := v_curr_date + 1;
  END LOOP;

  -- Save final stats exactly as they resolved up to yesterday
  UPDATE public.user_stats
  SET shields = v_stats.shields, streak = v_stats.streak
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object('success', true, 'action', 'processed_missed_days');
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_missed_days() FROM public;
GRANT EXECUTE ON FUNCTION public.finalize_missed_days() TO authenticated;
