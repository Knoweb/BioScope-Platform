-- Create the vw_active_alerts view which is referenced by the backend controller
CREATE OR REPLACE VIEW vw_active_alerts AS
SELECT 
  a.*,
  r.name as rule_name,
  r.condition as rule_condition
FROM alerts a
LEFT JOIN alert_rules r ON a.rule_id = r.rule_id
WHERE a.is_resolved = false;

-- Grant permissions to the view
GRANT SELECT ON vw_active_alerts TO authenticated;
