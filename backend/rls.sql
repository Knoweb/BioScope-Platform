-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE actuators ENABLE ROW LEVEL SECURITY;
ALTER TABLE controls (IF EXISTS) ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Deny all access to anonymous users
CREATE POLICY "Deny access to anonymous users on users" ON users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Deny access to anonymous users on devices" ON devices FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Deny access to anonymous users on sensors" ON sensors FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Deny access to anonymous users on readings" ON readings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Deny access to anonymous users on actuators" ON actuators FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Deny access to anonymous users on controls" ON controls FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Deny access to anonymous users on alerts" ON alerts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Deny access to anonymous users on alert_rules" ON alert_rules FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Deny access to anonymous users on automations" ON automations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Deny access to anonymous users on audit_logs" ON audit_logs FOR ALL USING (auth.role() = 'authenticated');

-- Grant full access to authenticated users
-- (Since BioScope doesn't have an explicit multi-tenant organization structure right now,
-- all authenticated users will have access to all data. In a real-world multi-tenant app,
-- this would include a `WHERE user_id = auth.uid()` constraint on the tables)
CREATE POLICY "Allow authenticated users access on users" ON users FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users access on devices" ON devices FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users access on sensors" ON sensors FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users access on readings" ON readings FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users access on actuators" ON actuators FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users access on controls" ON controls FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users access on alerts" ON alerts FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users access on alert_rules" ON alert_rules FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users access on automations" ON automations FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users access on audit_logs" ON audit_logs FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
