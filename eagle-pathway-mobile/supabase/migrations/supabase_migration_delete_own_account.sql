-- =========================================================================
-- SELF-SERVICE ACCOUNT DELETION
--
-- Google Play requires an in-app path to delete one's account and data.
-- The client (anon/authenticated key) cannot delete an auth user, so this
-- SECURITY DEFINER RPC does it: it deletes the caller's auth.users row, which
-- cascades to public.users (FK ON DELETE CASCADE) and from there to every
-- table that references users(id) ON DELETE CASCADE — applications, documents,
-- bookings, messages, payments, notifications, links, etc.
--
-- auth.uid() still resolves to the calling user even though the function runs
-- as its definer, so a user can only ever delete themselves.
-- =========================================================================

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.' USING ERRCODE = '42501';
  END IF;

  DELETE FROM auth.users WHERE id = v_uid;
END;
$$;

-- Only signed-in users may call it (and only ever delete themselves).
REVOKE EXECUTE ON FUNCTION public.delete_own_account() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_own_account() FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
