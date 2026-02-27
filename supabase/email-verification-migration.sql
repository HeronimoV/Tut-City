-- Email verification table
CREATE TABLE IF NOT EXISTS email_verifications (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow all access (auth handled server-side via service_role key)
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON email_verifications FOR ALL USING (true) WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
