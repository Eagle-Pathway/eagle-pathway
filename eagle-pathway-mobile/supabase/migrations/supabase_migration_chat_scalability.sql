-- CHAT SCALABILITY OPTIMIZATION (ISSUE-10)
-- This migration adds a specialized function to fetch conversation summaries
-- efficiently on the server, rather than processing all messages on the client.

CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id UUID)
RETURNS TABLE (
  other_user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  roles TEXT[],
  active_role TEXT,
  last_message TEXT,
  last_time TIMESTAMPTZ,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_messages AS (
    -- Get the most recent message for each unique pair of users
    SELECT DISTINCT ON (
      CASE WHEN sender_id < recipient_id THEN sender_id ELSE recipient_id END,
      CASE WHEN sender_id < recipient_id THEN recipient_id ELSE sender_id END
    )
      m.sender_id,
      m.recipient_id,
      m.content,
      m.created_at,
      m.is_read
    FROM public.messages m
    WHERE m.sender_id = p_user_id OR m.recipient_id = p_user_id
    ORDER BY 
      CASE WHEN sender_id < recipient_id THEN sender_id ELSE recipient_id END,
      CASE WHEN sender_id < recipient_id THEN recipient_id ELSE sender_id END,
      m.created_at DESC
  ),
  unread_counts AS (
    -- Count unread messages for each contact
    SELECT 
      m.sender_id as contact_id,
      COUNT(*) as count
    FROM public.messages m
    WHERE m.recipient_id = p_user_id AND m.is_read = false
    GROUP BY m.sender_id
  )
  SELECT 
    u.id as other_user_id,
    u.full_name,
    u.avatar_url,
    u.roles,
    u.active_role,
    lm.content as last_message,
    lm.created_at as last_time,
    COALESCE(uc.count, 0) as unread_count
  FROM latest_messages lm
  -- Determine which ID is the "other" user
  JOIN public.users u ON u.id = (CASE WHEN lm.sender_id = p_user_id THEN lm.recipient_id ELSE lm.sender_id END)
  LEFT JOIN unread_counts uc ON uc.contact_id = u.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_conversations(UUID) TO authenticated;
