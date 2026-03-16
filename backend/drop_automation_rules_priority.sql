-- ============================================================
-- BioScope: Remove automation_rules.priority
-- Run this ONCE in Supabase SQL Editor.
-- ============================================================

ALTER TABLE public.automation_rules
  DROP COLUMN IF EXISTS priority;
