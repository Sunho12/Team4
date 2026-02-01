-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is agency staff
CREATE OR REPLACE FUNCTION is_agency_staff(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'agency_staff'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles RLS Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin(auth.uid()));

-- Customer Sessions RLS Policies
CREATE POLICY "Public can create sessions"
  ON customer_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can view own sessions"
  ON customer_sessions FOR SELECT
  USING (true);

CREATE POLICY "Agency staff can view assigned sessions"
  ON customer_sessions FOR SELECT
  USING (
    is_agency_staff(auth.uid()) AND
    id IN (
      SELECT customer_session_id FROM agency_assignments
      WHERE agency_staff_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all sessions"
  ON customer_sessions FOR SELECT
  USING (is_admin(auth.uid()));

-- Conversations RLS Policies
CREATE POLICY "Public can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can view conversations"
  ON conversations FOR SELECT
  USING (true);

CREATE POLICY "Public can update conversations"
  ON conversations FOR UPDATE
  USING (true);

CREATE POLICY "Agency staff can view assigned conversations"
  ON conversations FOR SELECT
  USING (
    is_agency_staff(auth.uid()) AND
    session_id IN (
      SELECT customer_session_id FROM agency_assignments
      WHERE agency_staff_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all conversations"
  ON conversations FOR ALL
  USING (is_admin(auth.uid()));

-- Messages RLS Policies
CREATE POLICY "Public can create messages"
  ON messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can view messages"
  ON messages FOR SELECT
  USING (true);

CREATE POLICY "Agency staff can view assigned messages"
  ON messages FOR SELECT
  USING (
    is_agency_staff(auth.uid()) AND
    conversation_id IN (
      SELECT c.id FROM conversations c
      INNER JOIN agency_assignments aa ON c.session_id = aa.customer_session_id
      WHERE aa.agency_staff_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all messages"
  ON messages FOR ALL
  USING (is_admin(auth.uid()));

-- Conversation Summaries RLS Policies
CREATE POLICY "Public can view summaries"
  ON conversation_summaries FOR SELECT
  USING (true);

CREATE POLICY "System can create summaries"
  ON conversation_summaries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Agency staff can view assigned summaries"
  ON conversation_summaries FOR SELECT
  USING (
    is_agency_staff(auth.uid()) AND
    conversation_id IN (
      SELECT c.id FROM conversations c
      INNER JOIN agency_assignments aa ON c.session_id = aa.customer_session_id
      WHERE aa.agency_staff_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all summaries"
  ON conversation_summaries FOR ALL
  USING (is_admin(auth.uid()));

-- Purchase Predictions RLS Policies
CREATE POLICY "System can create predictions"
  ON purchase_predictions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Agency staff can view assigned predictions"
  ON purchase_predictions FOR SELECT
  USING (
    is_agency_staff(auth.uid()) AND
    session_id IN (
      SELECT customer_session_id FROM agency_assignments
      WHERE agency_staff_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all predictions"
  ON purchase_predictions FOR ALL
  USING (is_admin(auth.uid()));

-- Agency Assignments RLS Policies
CREATE POLICY "Agency staff can view own assignments"
  ON agency_assignments FOR SELECT
  USING (
    is_agency_staff(auth.uid()) AND
    agency_staff_id = auth.uid()
  );

CREATE POLICY "Admins can manage assignments"
  ON agency_assignments FOR ALL
  USING (is_admin(auth.uid()));

-- Knowledge Base RLS Policies (read-only for all, write for admins)
CREATE POLICY "Anyone can read knowledge base"
  ON knowledge_base FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage knowledge base"
  ON knowledge_base FOR ALL
  USING (is_admin(auth.uid()));

-- Audit Logs RLS Policies
CREATE POLICY "System can create audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (is_admin(auth.uid()));
