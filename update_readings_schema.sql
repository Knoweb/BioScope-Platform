-- ==============================================================================
-- BIOSCOPE READINGS & PRIORITY FIXES
-- ==============================================================================

-- 1. Ensure `priority_level` exists in the readings table
ALTER TABLE public.readings ADD COLUMN IF NOT EXISTS priority_level numeric;

-- 2. Drop the old foreign key constraint that references the legacy `devices` table
ALTER TABLE public.readings DROP CONSTRAINT IF EXISTS readings_device_id_fkey;

-- 3. Fix any existing legacy data in readings.
-- For demo data preservation, we map P1 readings to C1 and P2 readings to C2. 
UPDATE public.readings SET device_id = 'C1' WHERE device_id = 'P1';
UPDATE public.readings SET device_id = 'C2' WHERE device_id = 'P2';

-- Now assign the new priority_level values correctly 
UPDATE public.readings r
SET priority_level = c.priority
FROM public.child_units c
WHERE r.device_id = c.unit_id;

-- Wipe out any remaining readings that somehow do not belong to a valid child_unit, 
-- preventing the foreign key constraint from failing
DELETE FROM public.readings WHERE device_id NOT IN (SELECT unit_id FROM public.child_units);

-- 4. Add a NEW foreign key constraint pointing to the updated `child_units` table
-- This ensures future readings must have a valid child unit ID
ALTER TABLE public.readings
  ADD CONSTRAINT readings_device_id_child_fkey 
  FOREIGN KEY (device_id) 
  REFERENCES public.child_units (unit_id) 
  ON DELETE CASCADE;

-- 5. Create the Trigger Function to automatically fetch and insert priority from child_units 
CREATE OR REPLACE FUNCTION set_reading_priority()
RETURNS TRIGGER AS $$
DECLARE
  child_priority numeric;
BEGIN
  -- Attempt to select the priority from child_units based on the device_id
  SELECT priority INTO child_priority
  FROM public.child_units
  WHERE unit_id = NEW.device_id;
  
  -- If found, set it on the NEW record
  IF child_priority IS NOT NULL THEN
    NEW.priority_level := child_priority;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Drop existing trigger if any, and attach the new trigger to readings
DROP TRIGGER IF EXISTS trg_set_reading_priority ON public.readings;

CREATE TRIGGER trg_set_reading_priority
BEFORE INSERT OR UPDATE ON public.readings
FOR EACH ROW
EXECUTE FUNCTION set_reading_priority();
