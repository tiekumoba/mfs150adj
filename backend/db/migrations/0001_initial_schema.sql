-- Initial schema: Category -> Nominations -> Assignments -> Evaluations -> Evaluation Scores
-- gen_random_uuid() is built in to PostgreSQL 13+ (Neon supports it without extensions).

CREATE TABLE roles (
  id   smallint PRIMARY KEY,
  name text NOT NULL UNIQUE CHECK (name IN ('ADMIN', 'ADJUDICATOR'))
);

INSERT INTO roles (id, name) VALUES (1, 'ADMIN'), (2, 'ADJUDICATOR');

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text UNIQUE,                       -- set on first Clerk sign-in
  email         text NOT NULL UNIQUE,
  full_name     text NOT NULL,
  role_id       smallint NOT NULL REFERENCES roles (id),
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Scoring criteria belong to a category. `weight` is a placeholder; the scoring algorithm is TBD.
CREATE TABLE criteria (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  weight      numeric(6, 2) NOT NULL DEFAULT 1 CHECK (weight >= 0),
  sort_order  integer NOT NULL DEFAULT 0,
  UNIQUE (category_id, name)
);

CREATE TABLE nominations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id    uuid NOT NULL REFERENCES categories (id),
  nominee_name   text NOT NULL,
  nominee_email  text,
  nominator_name text,
  citation       text,
  status         text NOT NULL DEFAULT 'SUBMITTED'
                 CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'FINALISED')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX nominations_category_idx ON nominations (category_id);

CREATE TABLE assignments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nomination_id uuid NOT NULL REFERENCES nominations (id) ON DELETE CASCADE,
  adjudicator_id uuid NOT NULL REFERENCES users (id),
  status        text NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')),
  due_date      date,
  assigned_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (nomination_id, adjudicator_id)
);
CREATE INDEX assignments_adjudicator_idx ON assignments (adjudicator_id);

-- One evaluation per assignment.
CREATE TABLE evaluations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL UNIQUE REFERENCES assignments (id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED')),
  comments      text,
  submitted_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE evaluation_scores (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES evaluations (id) ON DELETE CASCADE,
  criterion_id  uuid NOT NULL REFERENCES criteria (id),
  score         smallint NOT NULL CHECK (score BETWEEN 1 AND 10),
  UNIQUE (evaluation_id, criterion_id)
);

CREATE TABLE audit_logs (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_user_id uuid REFERENCES users (id) ON DELETE SET NULL,
  action        text NOT NULL,                     -- e.g. 'evaluation.submitted'
  entity_type   text NOT NULL,
  entity_id     text,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_entity_idx ON audit_logs (entity_type, entity_id);
