-- ============================================================
-- Canvas Affiliate Program — Database Schema
-- ============================================================
-- Model: Infinite funnel cascade (based on Orderly DEX affiliate model)
-- Engine: PostgreSQL (adapt for MySQL/SQLite as needed)
-- ============================================================

-- ─── Affiliates ──────────────────────────────────────────────────────────────

CREATE TABLE affiliates (
  id                    TEXT        PRIMARY KEY,         -- wallet address
  referral_code         TEXT        UNIQUE NOT NULL,     -- short shareable code (e.g. "X7KP2Q")
  referrer_id           TEXT        REFERENCES affiliates(id),  -- parent affiliate (NULL = direct Canvas invite)
  max_rate              NUMERIC(5,2) NOT NULL DEFAULT 5, -- max % this affiliate earns (set by parent/Canvas)
  downline_default_rate NUMERIC(5,2) NOT NULL DEFAULT 0, -- default % passed to their invitees
  total_earned          NUMERIC(18,6) NOT NULL DEFAULT 0,
  total_claimed         NUMERIC(18,6) NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_affiliates_referrer ON affiliates(referrer_id);
CREATE UNIQUE INDEX idx_affiliates_username ON affiliates(username) WHERE username IS NOT NULL;
CREATE INDEX idx_affiliates_code     ON affiliates(referral_code);

-- ─── Per-Downline Custom Rate Overrides ──────────────────────────────────────

CREATE TABLE affiliate_custom_rates (
  id            SERIAL      PRIMARY KEY,
  affiliate_id  TEXT        NOT NULL REFERENCES affiliates(id),  -- the parent setting the rate
  downline_id   TEXT        NOT NULL REFERENCES affiliates(id),  -- the specific downline
  custom_rate   NUMERIC(5,2) NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (affiliate_id, downline_id)
);

-- ─── Earnings Ledger ─────────────────────────────────────────────────────────
--
-- One row per (affiliate, purchase) event.
-- Created when a player makes a paint purchase and has a referral chain.

CREATE TABLE affiliate_earnings (
  id               TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  affiliate_id     TEXT        NOT NULL REFERENCES affiliates(id),
  player_id        TEXT        NOT NULL,     -- wallet of the player who purchased
  purchase_amount  NUMERIC(18,6) NOT NULL,   -- USDT amount of the purchase
  cascade_earning  NUMERIC(18,6) NOT NULL DEFAULT 0,  -- from cascade portion
  direct_bonus     NUMERIC(18,6) NOT NULL DEFAULT 0,  -- 5% direct bonus (non-zero only if immediate referrer)
  total_earning    NUMERIC(18,6) GENERATED ALWAYS AS (cascade_earning + direct_bonus) STORED,
  purchase_tx      TEXT,                     -- reference to the payment transaction
  week_bucket      TEXT        NOT NULL,     -- ISO week e.g. "2026-W15"
  claimed          BOOLEAN     NOT NULL DEFAULT FALSE,
  claimed_at       TIMESTAMPTZ,
  claim_tx         TEXT,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_earnings_affiliate     ON affiliate_earnings(affiliate_id);
CREATE INDEX idx_earnings_player        ON affiliate_earnings(player_id);
CREATE INDEX idx_earnings_unclaimed     ON affiliate_earnings(affiliate_id) WHERE NOT claimed;
CREATE INDEX idx_earnings_week          ON affiliate_earnings(affiliate_id, week_bucket);

-- ─── Claim Records ────────────────────────────────────────────────────────────

CREATE TABLE affiliate_claims (
  id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  affiliate_id  TEXT        NOT NULL REFERENCES affiliates(id),
  amount        NUMERIC(18,6) NOT NULL,
  week_buckets  TEXT[]      NOT NULL,        -- which week buckets were claimed
  claimed_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  tx_id         TEXT        NOT NULL         -- Fireblocks transaction ID
);

CREATE INDEX idx_claims_affiliate ON affiliate_claims(affiliate_id);

-- ─── Helper: Get ancestor chain for a player ────────────────────────────────
--
-- Returns the full ancestor chain up to MAX_DEPTH=15 for a given wallet.
-- Used in the commission calculation engine.

CREATE OR REPLACE FUNCTION get_affiliate_chain(player_wallet TEXT, max_depth INT DEFAULT 15)
RETURNS TABLE(affiliate_id TEXT, rate NUMERIC, depth INT, is_immediate_referrer BOOLEAN) AS $$
  WITH RECURSIVE chain AS (
    -- Base: immediate referrer
    SELECT
      a.id,
      a.max_rate,
      1 AS depth,
      TRUE AS is_immediate
    FROM affiliates a
    WHERE a.id = (
      SELECT referrer_id FROM affiliates WHERE id = player_wallet
    )

    UNION ALL

    SELECT
      parent.id,
      parent.max_rate,
      chain.depth + 1,
      FALSE
    FROM affiliates parent
    JOIN chain ON chain.id = (
      SELECT referrer_id FROM affiliates WHERE id = chain.id
    )
    WHERE chain.depth < max_depth
  )
  SELECT id, max_rate, depth, is_immediate FROM chain;
$$ LANGUAGE sql STABLE;

-- ─── Commission Constants ────────────────────────────────────────────────────
--
-- These match lib/affiliate.ts — keep in sync.
--
--   AFFILIATE_POOL  = 5%   (default max cascade pool for L1 affiliates)
--   DIRECT_BONUS    = 5%   (always paid to immediate referrer)
--   MAX_DEPTH       = 15
--
-- Canvas platform revenue per purchase:
--   Cascade pays out at most: 5% of purchase amount (spread across chain)
--   Direct bonus:             5% of purchase amount (to immediate referrer)
--   Canvas minimum keep:      90% of purchase amount
