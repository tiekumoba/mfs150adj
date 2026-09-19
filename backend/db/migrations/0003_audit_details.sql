-- Richer audit trail: who, from where, what changed, and when (created_at).
ALTER TABLE audit_logs
  ADD COLUMN actor_email text,                 -- snapshot, survives user changes
  ADD COLUMN source      text NOT NULL DEFAULT 'web'
                         CHECK (source IN ('web', 'import', 'script')),
  ADD COLUMN ip_address  text,
  ADD COLUMN user_agent  text,
  ADD COLUMN changes     jsonb;                -- [{ "field": ..., "from": ..., "to": ... }]

CREATE INDEX audit_logs_created_idx ON audit_logs (created_at DESC);

-- The audit log is append-only: entries can be added but never edited or removed.
CREATE FUNCTION audit_logs_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_no_update_delete
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION audit_logs_immutable();
