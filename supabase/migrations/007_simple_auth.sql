-- Simple auth for hackathon
-- Add password to profiles table

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS password TEXT;

-- Make username NOT NULL if not already
ALTER TABLE profiles
ALTER COLUMN username SET NOT NULL;

-- Make full_name NOT NULL
ALTER TABLE profiles
ALTER COLUMN full_name SET NOT NULL;

-- Make phone_number NOT NULL
ALTER TABLE profiles
ALTER COLUMN phone_number SET NOT NULL;

-- Drop the auth.users foreign key constraint from profiles
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Make id a regular UUID that we generate
ALTER TABLE profiles
ALTER COLUMN id SET DEFAULT uuid_generate_v4();
