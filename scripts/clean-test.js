const { Pool } = require("pg");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const pool = new Pool({
  connectionString: "postgresql://postgres.kvdtnodzxnmbejukalvj:TEST2433119450@44.252.246.120:6543/postgres",
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false },
});

pool
  .query("DELETE FROM students WHERE nom='TestLog' AND prenom='Test'; DELETE FROM submission_logs WHERE student_nom='TestLog' AND student_prenom='Test';")
  .then(() => {
    console.log("Cleaned up");
    process.exit(0);
  })
  .catch((e) => {
    console.log(e.message);
    process.exit(1);
  });
