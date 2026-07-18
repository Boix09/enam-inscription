const { Pool } = require("pg");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const sql = `
CREATE TABLE IF NOT EXISTS submission_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_nom TEXT,
  student_prenom TEXT,
  classe_id UUID REFERENCES classes(id),
  ip_address TEXT,
  user_agent TEXT,
  screen_resolution TEXT,
  language TEXT,
  timezone TEXT,
  platform TEXT,
  device_type TEXT,
  referrer TEXT,
  page_url TEXT,
  success BOOLEAN DEFAULT false,
  reject_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'submission_logs' AND policyname = 'select_submission_logs') THEN
    ALTER TABLE submission_logs ENABLE ROW LEVEL SECURITY;
    CREATE POLICY select_submission_logs ON submission_logs FOR SELECT USING (true);
    CREATE POLICY insert_submission_logs ON submission_logs FOR INSERT WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_submission_logs_classe ON submission_logs (classe_id);
CREATE INDEX IF NOT EXISTS idx_submission_logs_created ON submission_logs (created_at DESC);
`;

const pool = new Pool({
  connectionString: "postgresql://postgres.kvdtnodzxnmbejukalvj:TEST2433119450@44.252.246.120:6543/postgres",
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false },
});

pool
  .query(sql)
  .then(() => {
    console.log("Submission logs table applied OK");
    process.exit(0);
  })
  .catch((e) => {
    console.error("Error:", e.message);
    process.exit(1);
  });
