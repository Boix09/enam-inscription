const { Pool } = require("pg");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const pool = new Pool({
  connectionString: "postgresql://postgres.kvdtnodzxnmbejukalvj:TEST2433119450@44.252.246.120:6543/postgres",
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false },
});

pool
  .query("INSERT INTO settings (key, value) VALUES ('whatsapp', '+50938817140') ON CONFLICT (key) DO UPDATE SET value = '+50938817140'")
  .then(() => {
    console.log("WhatsApp setting saved");
    process.exit(0);
  })
  .catch((e) => {
    console.log(e.message);
    process.exit(1);
  });
