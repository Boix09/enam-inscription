const { Client } = require("pg");
const c = new Client({
  host: "aws-1-us-west-2.pooler.supabase.com", port: 5432,
  database: "postgres", user: "postgres.kvdtnodzxnmbejukalvj",
  password: "TEST2433119450", ssl: { rejectUnauthorized: false },
});
(async () => {
  await c.connect();
  const { rows: sansClasse } = await c.query("SELECT count(*)::int FROM students WHERE classe_id IS NULL");
  console.log(sansClasse[0].count, "eleves sans classe_id");

  const { rows: avecClasse } = await c.query("SELECT count(*)::int FROM students WHERE classe_id IS NOT NULL");
  console.log(avecClasse[0].count, "eleves avec classe_id");

  if (sansClasse[0].count > 0) {
    const { rows: classe } = await c.query("SELECT id FROM classes WHERE slug='1ere-annee' LIMIT 1");
    await c.query("UPDATE students SET classe_id=$1 WHERE classe_id IS NULL", [classe[0].id]);
    console.log("Migres vers 1ere annee");
  }

  const { rows: tous } = await c.query("SELECT nom, prenom, classe_id FROM students ORDER BY no");
  for (const r of tous) console.log(`  ${r.nom} ${r.prenom} -> classe_id: ${r.classe_id}`);

  await c.end();
})().catch(e => console.error(e.message));
