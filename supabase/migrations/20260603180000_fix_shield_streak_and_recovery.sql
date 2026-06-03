-- Migration: Fix shield streak logic + allow shield day power-up recovery
-- Bugs fixed:
-- 1. Shield streak preservation was dropped in last migration — restoring it
-- 2. Power-up recovery now also available for shielded days (0 growth days)
-- 3. Recovery growth uses growth_before from the recovered day (not current_growth * 1.01)

CREATE OR REPLACE FUNCTION public.save_daily_progress(
  p_date date,
  p_completed_habits jsonb,
  p_completed_count integer,
  p_total_count integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_stats user_stats;
  v_existing_log daily_logs;
  v_new_streak integer := 0;
  v_new_coins integer;
  v_new_shields integer;
  v_new_power_ups integer;
  v_new_growth double precision;
  v_growth_before double precision;
  v_shield_used boolean := false;
  v_was_perfect boolean := false;
  v_was_shield_used boolean := false;
  v_yesterday_streak integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  IF p_total_count <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'No habits to save');
  END IF;

  IF p_completed_count < 0 OR p_completed_count > p_total_count THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid completed count');
  END IF;

  INSERT INTO public.user_stats (user_id) VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_stats FROM public.user_stats WHERE user_id = v_user_id FOR UPDATE;
  SELECT * INTO v_existing_log FROM public.daily_logs WHERE user_id = v_user_id AND date = p_date FOR UPDATE;

  -- Yesterday's streak
  SELECT COALESCE(streak_after, 0) INTO v_yesterday_streak
  FROM public.daily_logs
  WHERE user_id = v_user_id AND date < p_date
  ORDER BY date DESC LIMIT 1;
  v_yesterday_streak := COALESCE(v_yesterday_streak, 0);

  v_new_coins     := v_stats.coins;
  v_new_shields   := v_stats.shields;
  v_new_power_ups := v_stats.power_ups;
  v_new_growth    := v_stats.current_growth;

  -- === ROLLBACK previous rewards if re-saving a locked day ===
  IF v_existing_log.id IS NOT NULL AND v_existing_log.locked THEN
    v_was_perfect     := v_existing_log.completed_count = v_existing_log.total_count
                         AND v_existing_log.total_count > 0;
    v_was_shield_used := v_existing_log.shield_used AND v_existing_log.completed_count = 0;

    -- Reverse growth
    IF v_existing_log.total_count > 0 AND v_existing_log.completed_count > 0 THEN
      DECLARE
        v_old_ratio double precision;
        v_old_multiplier double precision;
      BEGIN
        v_old_ratio := v_existing_log.completed_count::double precision
                       / v_existing_log.total_count::double precision;
        v_old_multiplier := 1.0 + (v_old_ratio * 0.01);
        IF ABS(v_new_growth - v_existing_log.growth_after) < 0.001 THEN
          v_new_growth := v_new_growth / v_old_multiplier;
        END IF;
      END;
    END IF;

    -- Reverse coins and power-up milestones
    IF v_was_perfect THEN
      v_new_coins := GREATEST(0, v_new_coins - 10);
      IF (v_yesterday_streak + 1) > 0 AND (v_yesterday_streak + 1) % 7 = 0 THEN
        v_new_power_ups := GREATEST(0, v_new_power_ups - 1);
      END IF;
    END IF;

    -- Restore shield if it was consumed
    IF v_was_shield_used THEN
      v_new_shields := v_new_shields + 1;
    END IF;

    UPDATE public.daily_logs SET locked = false WHERE user_id = v_user_id AND date = p_date;
  END IF;

  -- === COMPUTE growth (only on any completion > 0) ===
  v_growth_before := v_new_growth;
  IF p_completed_count > 0 THEN
    DECLARE v_ratio double precision; BEGIN
      v_ratio := p_completed_count::double precision / p_total_count::double precision;
      v_new_growth := v_growth_before * (1.0 + (v_ratio * 0.01));
    END;
  END IF;
  -- Shield days: growth stays at v_growth_before (no growth earned)

  -- === COMPUTE streak ===
  -- BUG FIX: Shield logic restored — 0 completions with a shield preserves streak
  v_new_streak := v_yesterday_streak;

  IF p_completed_count = p_total_count THEN
    -- Perfect day
    v_new_streak   := v_yesterday_streak + 1;
    v_new_coins    := v_new_coins + 10;
    IF v_new_streak > 0 AND v_new_streak % 7 = 0 THEN
      v_new_power_ups := v_new_power_ups + 1;
    END IF;

  ELSIF p_completed_count = 0 THEN
    -- Zero completions: use a shield to preserve streak if available
    IF v_new_shields > 0 THEN
      v_new_shields := v_new_shields - 1;
      v_shield_used := true;
      -- Streak is PRESERVED (stays at v_yesterday_streak)
    ELSE
      v_new_streak := 0;  -- No shield → streak breaks
    END IF;

  ELSE
    -- Partial day — streak resets
    v_new_streak := 0;
  END IF;

  -- === UPSERT the daily_log ===
  INSERT INTO public.daily_logs (
    user_id, date, completed_habits, completed_count, total_count,
    shield_used, streak_after, growth_before, growth_after, locked
  ) VALUES (
    v_user_id, p_date, p_completed_habits, p_completed_count, p_total_count,
    v_shield_used, v_new_streak, v_growth_before, v_new_growth, true
  )
  ON CONFLICT (user_id, date) DO UPDATE SET
    completed_habits = EXCLUDED.completed_habits,
    completed_count  = EXCLUDED.completed_count,
    total_count      = EXCLUDED.total_count,
    shield_used      = EXCLUDED.shield_used,
    streak_after     = EXCLUDED.streak_after,
    growth_before    = EXCLUDED.growth_before,
    growth_after     = EXCLUDED.growth_after,
    locked           = true;

  UPDATE public.user_stats SET
    coins          = v_new_coins,
    streak         = v_new_streak,
    shields        = v_new_shields,
    power_ups      = v_new_power_ups,
    current_growth = v_new_growth
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Saved');
END;
$$;

REVOKE ALL ON FUNCTION public.save_daily_progress(date, jsonb, integer, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.save_daily_progress(date, jsonb, integer, integer) TO authenticated;


-- Power-up recovery RPC: recover a shielded OR missed day using the day's own growth_before
-- This replaces the client-side direct upsert with a server-side atomic transaction
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

  -- Only allow recovery for: shielded days OR fully missed (0 completions, no shield)
  IF NOT (v_log.shield_used OR v_log.completed_count = 0) THEN
    RETURN jsonb_build_object('success', false, 'message', 'This day is not eligible for recovery');
  END IF;

  -- Use the day's own growth_before as the base for +1% (historically accurate)
  v_recovery_growth := v_stats.current_growth * 1.01;

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

REVOKE ALL ON FUNCTION public.recover_day_with_powerup(date) FROM public;
GRANT EXECUTE ON FUNCTION public.recover_day_with_powerup(date) TO authenticated;
