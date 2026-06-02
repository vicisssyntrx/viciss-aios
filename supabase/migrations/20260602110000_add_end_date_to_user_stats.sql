-- Migration: Add end_date to public.user_stats
ALTER TABLE public.user_stats ADD COLUMN end_date date;

-- Migrate existing users to have end_date = start_date + 365 days
UPDATE public.user_stats SET end_date = (start_date + INTERVAL '365 days')::date WHERE end_date IS NULL;
