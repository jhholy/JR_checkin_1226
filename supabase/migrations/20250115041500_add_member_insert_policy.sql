-- Add policy to allow public to register new members
BEGIN;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow public to register new members" ON members;

-- Create new policy
CREATE POLICY "Allow public to register new members"
ON members
FOR INSERT
TO public
WITH CHECK (
  is_new_member = true 
  AND membership IS NULL
);

COMMIT; 