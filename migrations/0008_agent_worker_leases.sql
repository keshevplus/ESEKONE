-- Give agent requests a bounded execution lease and retry budget.
ALTER TABLE agent_requests
  ADD COLUMN attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN max_attempts integer NOT NULL DEFAULT 3;

ALTER TABLE agent_requests
  ADD CONSTRAINT agent_requests_attempt_count_check
    CHECK (attempt_count >= 0),
  ADD CONSTRAINT agent_requests_max_attempts_check
    CHECK (max_attempts BETWEEN 1 AND 10);

CREATE INDEX agent_requests_running_lease_idx
  ON agent_requests(started_at)
  WHERE status = 'running';
