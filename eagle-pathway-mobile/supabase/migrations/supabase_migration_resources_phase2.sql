-- =========================================================================
-- RESOURCES — Phase 2: publish notifications + download counts
-- =========================================================================

-- New notification kind for a freshly published resource. Safe inside a tx on
-- PG12+ because the value is not USED until the trigger fires post-migration.
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'new_resource';

-- --- Download / open counter --------------------------------------------------
ALTER TABLE resources ADD COLUMN IF NOT EXISTS download_count INTEGER NOT NULL DEFAULT 0;

-- Bump the counter for a published resource. SECURITY DEFINER so an ordinary
-- user (who only has SELECT on resources) can record an open without write
-- access. It can only ever increment one row's counter — no other effect.
CREATE OR REPLACE FUNCTION public.increment_resource_download(p_resource_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE resources SET download_count = download_count + 1
  WHERE id = p_resource_id AND is_published;
$$;

GRANT EXECUTE ON FUNCTION public.increment_resource_download(uuid) TO authenticated;

-- --- Notify the audience when a resource is published -------------------------
-- Fires on insert of a published resource, or when an existing one transitions
-- hidden -> published. Inserts one notification per user in the audience.
CREATE OR REPLACE FUNCTION public.notify_resource_published()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.is_published AND (TG_OP = 'INSERT' OR COALESCE(OLD.is_published, FALSE) = FALSE) THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    SELECT u.id,
           'new_resource',
           'New resource available 📚',
           NEW.title,
           jsonb_build_object('url', '/resources', 'resource_id', NEW.id)
    FROM users u
    WHERE NEW.audience = 'all' OR u.role::text = NEW.audience;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_resource_published ON resources;
CREATE TRIGGER trg_notify_resource_published
  AFTER INSERT OR UPDATE OF is_published ON resources
  FOR EACH ROW EXECUTE FUNCTION public.notify_resource_published();
