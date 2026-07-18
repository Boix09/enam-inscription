const { Client } = require("pg");
const c = new Client({
  host: "aws-1-us-west-2.pooler.supabase.com", port: 5432,
  database: "postgres", user: "postgres.kvdtnodzxnmbejukalvj",
  password: "TEST2433119450", ssl: { rejectUnauthorized: false },
});
(async () => {
  await c.connect();
  await c.query(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY, value TEXT NOT NULL
  )`);
  await c.query("ALTER TABLE settings ENABLE ROW LEVEL SECURITY");
  await c.query("DROP POLICY IF EXISTS select_settings ON settings");
  await c.query("CREATE POLICY select_settings ON settings FOR SELECT USING (true)");
  await c.query("GRANT SELECT ON TABLE settings TO anon");
  // Insert default WhatsApp number
  await c.query("INSERT INTO settings (key, value) VALUES ('whatsapp', '+50938817140') ON CONFLICT (key) DO NOTHING");
  const { rows } = await c.query("SELECT * FROM settings");
  console.log("Settings:", rows);
  await c.end();
})().catch(e => console.error(e.message));
