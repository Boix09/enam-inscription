const { Pool } = require("pg");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const pool = new Pool({
  connectionString: "postgresql://postgres.kvdtnodzxnmbejukalvj:TEST2433119450@44.252.246.120:6543/postgres",
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false },
});

pool
  .query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'settings')")
  .then((r) => {
    if (!r.rows[0].exists) {
      return pool.query(`
        CREATE TABLE IF NOT EXISTS settings (
          id SERIAL PRIMARY KEY,
          key TEXT UNIQUE NOT NULL,
          value TEXT NOT NULL
        );
        INSERT INTO settings (key, value) VALUES ('whatsapp', '+50938817140') ON CONFLICT (key) DO NOTHING;
        GRANT SELECT ON TABLE settings TO anon;
      `);
    }
  })
  .then(() => {
    console.log("Settings table OK");
    process.exit(0);
  })
  .catch((e) => {
    console.log(e.message);
    process.exit(1);
  });
