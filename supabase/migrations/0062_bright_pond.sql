-- Drop existing function
DROP FUNCTION IF EXISTS find_member_for_checkin(text, text);

-- Create enhanced member search function
CREATE OR REPLACE FUNCTION find_member_for_checkin(
  p_name text,
  p_email text DEFAULT NULL
)
RETURNS TABLE (
  member_id uuid,
  is_new boolean,
  needs_email boolean
) AS $$
DECLARE
  v_member_count int;
  v_normalized_name text;
  v_normalized_email text;
BEGIN
  -- Input validation
  IF TRIM(p_name) = '' THEN
    RAISE EXCEPTION 'Name cannot be empty';
  END IF;

  -- Normalize inputs
  v_normalized_name := LOWER(TRIM(p_name));
  v_normalized_email := CASE WHEN p_email IS NOT NULL 
    THEN LOWER(TRIM(p_email)) 
    ELSE NULL 
  END;

  -- First try exact match with email if provided
  IF v_normalized_email IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      m.id,
      m.is_new_member,
      false
    FROM members m
    WHERE LOWER(m.email) = v_normalized_email;
    
    IF FOUND THEN
      RETURN;
    END IF;
  END IF;

  -- Count exact name matches
  SELECT COUNT(*) INTO v_member_count
  FROM members m
  WHERE LOWER(m.name) = v_normalized_name;

  -- Handle results
  IF v_member_count > 1 THEN
    -- Multiple matches - require email
    RETURN QUERY SELECT NULL::uuid, false, true;
  ELSIF v_member_count = 1 THEN
    -- Single match - return member
    RETURN QUERY
    SELECT 
      m.id,
      m.is_new_member,
      false
    FROM members m
    WHERE LOWER(m.name) = v_normalized_name;
  ELSE
    -- No exact match - try partial match
    SELECT COUNT(*) INTO v_member_count
    FROM members m
    WHERE LOWER(m.name) LIKE '%' || v_normalized_name || '%';

    IF v_member_count = 1 THEN
      -- Single partial match
      RETURN QUERY
      SELECT 
        m.id,
        m.is_new_member,
        false
      FROM members m
      WHERE LOWER(m.name) LIKE '%' || v_normalized_name || '%';
    ELSIF v_member_count > 1 THEN
      -- Multiple partial matches - require email
      RETURN QUERY SELECT NULL::uuid, false, true;
    ELSE
      -- No matches - new member
      RETURN QUERY SELECT NULL::uuid, true, false;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION find_member_for_checkin IS 
'Enhanced member search function that:
1. Handles exact and partial name matches
2. Supports email verification for duplicate names
3. Properly normalizes inputs for case-insensitive comparison
4. Returns appropriate flags for new members and email verification needs';