-- ============================================================
-- BioScope Controls Schema Migration
-- Run this ONCE in your Supabase SQL Editor (Dashboard → SQL Editor)
-- These columns are required for automation and slot assignment to work.
-- ============================================================

-- 1. Make actuator_id nullable in control_actions
--    Automation evaluate actions are not tied to one physical actuator
ALTER TABLE public.control_actions
  ALTER COLUMN actuator_id DROP NOT NULL;

-- 2. Add logical device state columns to control_actions
--    These preserve the "last known state" for dead-band rule evaluation
ALTER TABLE public.control_actions
  ADD COLUMN IF NOT EXISTS fan_state    VARCHAR(3),
  ADD COLUMN IF NOT EXISTS heater_state VARCHAR(3),
  ADD COLUMN IF NOT EXISTS light_state  VARCHAR(3);

-- 3. Add priority column to automation_rules
--    Lower number = evaluated first. Default 10 = normal priority.
--    This column is ORDER BY'd in the automation engine — without it all rules are skipped.
ALTER TABLE public.automation_rules
  ADD COLUMN IF NOT EXISTS priority INT DEFAULT 10;

-- Backfill sensible priorities for existing rules based on action type
UPDATE public.automation_rules SET priority = 5  WHERE action LIKE 'fan:%';
UPDATE public.automation_rules SET priority = 6  WHERE action LIKE 'heater:%';
UPDATE public.automation_rules SET priority = 10 WHERE action LIKE 'light:%';

-- 4. Add slot assignment columns to device_settings
--    Stores which logical device (fan/heater/light) is physically plugged into each slot
ALTER TABLE public.device_settings
  ADD COLUMN IF NOT EXISTS slot_1_device VARCHAR(20) DEFAULT 'fan',
  ADD COLUMN IF NOT EXISTS slot_2_device VARCHAR(20) DEFAULT 'light';

-- Backfill defaults for existing device_settings rows
UPDATE public.device_settings
  SET slot_1_device = 'fan', slot_2_device = 'light'
  WHERE slot_1_device IS NULL OR slot_2_device IS NULL;
