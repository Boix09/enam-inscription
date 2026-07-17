const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const client = new Client({
  host: "aws-1-us-west-2.pooler.supabase.com",
  port: 5432,
  database: "postgres",
  user: "postgres.kvdtnodzxnmbejukalvj",
  password: "TEST2433119450",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

async function main() {
  await client.connect();
  console.log("Connecte a Supabase Postgres");

  const sql = fs.readFileSync(
    path.join(__dirname, "..", "supabase", "schema.sql"),
    "utf-8"
  );

  await client.query(sql);
  console.log("Schema execute avec succes !");

  // Verifier que la table existe
  const { rows } = await client.query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public'"
  );
  console.log("Tables publiques :", rows.map((r) => r.tablename).join(", "));

  await client.end();
}

main().catch((err) => {
  console.error("Erreur :", err.message);
  process.exit(1);
});
