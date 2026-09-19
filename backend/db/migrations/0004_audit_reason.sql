-- Why a change was made. Required by the API for every audited admin action;
-- nullable here only because older entries (if any) have none.
ALTER TABLE audit_logs ADD COLUMN reason text;
