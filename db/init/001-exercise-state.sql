CREATE TABLE exercise_state (
  id smallint PRIMARY KEY CHECK (id = 1),
  state jsonb NOT NULL,
  version bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
