const { Client } = require("pg");
const c = new Client({
  host: "aws-1-us-west-2.pooler.supabase.com", port: 5432,
  database: "postgres", user: "postgres.kvdtnodzxnmbejukalvj",
  password: "TEST2433119450", ssl: { rejectUnauthorized: false },
});
(async () => {
  await c.connect();
  await c.query("DELETE FROM students WHERE nom='Test' OR nom='TestPromo'");
  const { rows } = await c.query("SELECT count(*)::int FROM students");
  console.log(rows[0].count, "eleves restants");
  await c.end();
})().catch(e => console.error(e.message));
