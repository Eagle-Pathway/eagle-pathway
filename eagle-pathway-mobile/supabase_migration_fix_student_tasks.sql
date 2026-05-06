-- Add missing updated_at to student_tasks

ALTER TABLE student_tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update trigger if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_student_tasks_updated_at ON student_tasks;
CREATE TRIGGER update_student_tasks_updated_at
  BEFORE UPDATE ON student_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();