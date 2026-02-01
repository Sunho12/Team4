-- Sample data for testing

-- Insert test agency staff profile
-- Note: You'll need to create a user in Supabase Auth first, then use their ID here
-- This is just an example structure

-- Example: Insert agency staff (replace with actual auth.users ID)
-- INSERT INTO profiles (id, role, full_name, phone_number)
-- VALUES ('your-auth-user-id-here', 'agency_staff', 'Test Agent', '010-1234-5678');

-- Insert sample customer session
INSERT INTO customer_sessions (session_token, customer_phone, customer_name)
VALUES
  ('test-session-001', '010-9999-8888', '홍길동'),
  ('test-session-002', '010-8888-7777', '김철수');

-- Note: You can insert more test data here as needed
-- Make sure to run the knowledge base seeding script separately:
-- npx tsx scripts/seed-knowledge.ts
