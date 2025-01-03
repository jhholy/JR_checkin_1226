-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add test_mark column to existing tables if they don't exist
DO $$ 
BEGIN
    -- Add test_mark to members if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'members' 
        AND column_name = 'test_mark'
    ) THEN
        ALTER TABLE members ADD COLUMN test_mark TEXT;
    END IF;

    -- Add test_mark to checkins if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'checkins' 
        AND column_name = 'test_mark'
    ) THEN
        ALTER TABLE checkins ADD COLUMN test_mark TEXT;
    END IF;
END $$;

-- Create indexes for test_mark columns
CREATE INDEX IF NOT EXISTS idx_members_test_mark ON members(test_mark);
CREATE INDEX IF NOT EXISTS idx_checkins_test_mark ON checkins(test_mark);

-- Create function to initialize test environment
CREATE OR REPLACE FUNCTION public.initialize_test_environment(jsonb DEFAULT '{"test_mark": "test"}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  test_mark text;
BEGIN
  test_mark := $1->>'test_mark';
  
  IF test_mark IS NULL THEN
    RAISE EXCEPTION 'test_mark parameter cannot be null';
  END IF;
  
  -- Clean up any existing test data for this mark
  DELETE FROM checkins WHERE test_mark = test_mark;
  DELETE FROM members WHERE test_mark = test_mark;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Test environment initialized successfully',
    'test_mark', test_mark
  );
END;
$$;

-- Create function to clean up test data
CREATE OR REPLACE FUNCTION public.cleanup_test_data(jsonb DEFAULT '{"test_mark": "test"}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  test_mark text;
BEGIN
  test_mark := $1->>'test_mark';
  
  IF test_mark IS NULL THEN
    RAISE EXCEPTION 'test_mark parameter cannot be null';
  END IF;
  
  -- Clean specific test data
  DELETE FROM checkins WHERE test_mark = test_mark;
  DELETE FROM members WHERE test_mark = test_mark;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Test data cleaned up successfully',
    'test_mark', test_mark
  );
END;
$$;

-- Create test user
DO $$
DECLARE
  test_user_id uuid;
BEGIN
  -- Insert test user into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'test@test.com',
    crypt('test123456', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO test_user_id;

  -- Insert test user into auth.identities
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    test_user_id,
    format('{"sub":"%s","email":"%s"}', test_user_id::text, 'test@test.com')::jsonb,
    'email',
    test_user_id::text,
    NOW(),
    NOW(),
    NOW()
  );
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, authenticated;

GRANT USAGE ON SCHEMA auth TO postgres, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO postgres, authenticated;

-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY test_members_policy ON members
  FOR ALL
  TO authenticated
  USING (test_mark IS NOT NULL);

CREATE POLICY test_checkins_policy ON checkins
  FOR ALL
  TO authenticated
  USING (test_mark IS NOT NULL);
