-- Run this in your Supabase SQL Editor to add the Auto/Manual toggle support

ALTER TABLE public.parent_units 
ADD COLUMN IF NOT EXISTS control_mode TEXT DEFAULT 'auto' 
CHECK (control_mode IN ('auto', 'manual'));

-- To make things easy, we also need to allow the frontend to update this column
-- Ensure your RLS policies (if any) allow updating the control_mode column
