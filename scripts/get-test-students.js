const { Pool } = require("pg");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const pool = new Pool({
  connectionString: "postgresql://postgres.kvdtnodzxnmbejukalvj:TEST2433119450@44.252.246.120:6543/postgres",
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false },
});

pool
  .query("SELECT no, nom, prenom, registered FROM pre_enrolled WHERE classe_id = (SELECT id FROM classes WHERE slug = '1ere-annee' LIMIT 1) ORDER BY no")
  .then((r) => {
    console.log(JSON.stringify(r.rows, null, 2));
    process.exit(0);
  })
  .catch((e) => {
    console.log(e.message);
    process.exit(1);
  });
