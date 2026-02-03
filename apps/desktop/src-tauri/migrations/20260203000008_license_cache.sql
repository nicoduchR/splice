-- License cache table for offline grace period support (Story 7.2)
-- Uses single-row pattern (id = 1) for license state storage

CREATE TABLE IF NOT EXISTS license_cache (
    id INTEGER PRIMARY KEY CHECK (id = 1),  -- Single row table constraint
    plan TEXT NOT NULL DEFAULT 'free',      -- 'free' | 'pro'
    last_verified_at INTEGER NOT NULL,      -- Unix timestamp (seconds)
    expires_at INTEGER,                      -- Unix timestamp (null for lifetime licenses)
    grace_period_ends_at INTEGER NOT NULL   -- Unix timestamp (last_verified_at + 7 days)
);

-- Insert default row with free plan, never verified (timestamp 0)
INSERT OR IGNORE INTO license_cache (id, plan, last_verified_at, grace_period_ends_at)
VALUES (1, 'free', 0, 0);
