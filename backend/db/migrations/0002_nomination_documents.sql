-- Supporting evidence for nominations. Files stay on the existing WordPress site;
-- we only store their URLs. `source_id` is the id from the original dataset so imports
-- can be re-run safely.

ALTER TABLE nominations ADD COLUMN source_id uuid UNIQUE;

CREATE TABLE nomination_documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nomination_id uuid NOT NULL REFERENCES nominations (id) ON DELETE CASCADE,
  kind          text NOT NULL CHECK (kind IN ('image', 'document', 'video', 'external_link')),
  url           text NOT NULL,
  file_name     text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (nomination_id, url)
);
CREATE INDEX nomination_documents_nomination_idx ON nomination_documents (nomination_id);
