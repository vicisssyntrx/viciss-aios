-- Migration: Refund shield on recovery
-- Description: Redefines recover_day_with_powerup to refund the shield (increment user_stats.shields and set daily_logs.shield_used = false) if the day was shielded.

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

  -- Mark the log as recovered, and turn off shield_used if it was active
  UPDATE public.daily_logs
  SET
    is_recovered  = true,
    shield_used   = false,
    growth_after  = v_recovery_growth
  WHERE user_id = v_user_id AND date = p_date;

  -- Apply to user stats (refund shield if it was used)
  UPDATE public.user_stats
  SET
    power_ups      = power_ups - 1,
    shields        = CASE WHEN v_log.shield_used THEN shields + 1 ELSE shields END,
    current_growth = v_recovery_growth
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Day recovered');
END;
$$;

GRANT EXECUTE ON FUNCTION public.recover_day_with_powerup(date) TO authenticated;
