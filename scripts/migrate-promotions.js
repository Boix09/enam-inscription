const { Client } = require("pg");
const c = new Client({
  host: "aws-1-us-west-2.pooler.supabase.com", port: 5432,
  database: "postgres", user: "postgres.kvdtnodzxnmbejukalvj",
  password: "TEST2433119450", ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
});
(async () => {
  await c.connect();
  console.log("Connecte");

  // Create new tables if not exist
  await c.query(`CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
    annee_debut INTEGER NOT NULL, annee_fin INTEGER NOT NULL,
    description TEXT, created_at TIMESTAMPTZ DEFAULT now()
  )`);
  await c.query(`CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    nom TEXT NOT NULL, slug TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(promotion_id, slug)
  )`);
  console.log("Tables promotions + classes OK");

  // Add classe_id to students if not exists
  try { await c.query("ALTER TABLE students ADD COLUMN classe_id UUID REFERENCES classes(id)"); console.log("colonne classe_id ajoutee a students"); } catch(e) { if (!e.message.includes("already exists")) throw e; }
  try { await c.query("ALTER TABLE pre_enrolled ADD COLUMN classe_id UUID REFERENCES classes(id)"); console.log("colonne classe_id ajoutee a pre_enrolled"); } catch(e) { if (!e.message.includes("already exists")) throw e; }

  // RLS + Grants for new tables
  await c.query("ALTER TABLE promotions ENABLE ROW LEVEL SECURITY");
  await c.query("ALTER TABLE classes ENABLE ROW LEVEL SECURITY");
  await c.query("DROP POLICY IF EXISTS select_promotions ON promotions");
  await c.query("CREATE POLICY select_promotions ON promotions FOR SELECT USING (true)");
  await c.query("DROP POLICY IF EXISTS select_classes ON classes");
  await c.query("CREATE POLICY select_classes ON classes FOR SELECT USING (true)");
  await c.query("GRANT SELECT ON TABLE promotions TO anon");
  await c.query("GRANT SELECT ON TABLE classes TO anon");
  console.log("RLS + Grants OK");

  // Create default promotion if not exists
  const { rows: existing } = await c.query("SELECT id FROM promotions WHERE slug='reseaux-informatique-2024-2027'");
  let promoId;
  if (existing.length === 0) {
    const { rows } = await c.query(
      "INSERT INTO promotions (nom,slug,annee_debut,annee_fin,description) VALUES ($1,$2,$3,$4,$5) RETURNING id",
      ["Réseaux Informatique", "reseaux-informatique-2024-2027", 2024, 2027, "Technique Réseaux Informatique"]
    );
    promoId = rows[0].id;
    console.log("Promotion creee");

    const classes = [
      ["1ère Année", "1ere-annee"],
      ["2ème Année", "2eme-annee"],
      ["3ème Année", "3eme-annee"],
    ];
    const classIds = {};
    for (const [nom, slug] of classes) {
      const { rows: r } = await c.query(
        "INSERT INTO classes (promotion_id,nom,slug) VALUES ($1,$2,$3) RETURNING id",
        [promoId, nom, slug]
      );
      classIds[slug] = r[0].id;
    }
    console.log("3 classes creees");

    await c.query("UPDATE pre_enrolled SET classe_id=$1 WHERE classe_id IS NULL", [classIds["1ere-annee"]]);
    await c.query("UPDATE students SET classe_id=$1 WHERE classe_id IS NULL", [classIds["1ere-annee"]]);
    console.log("Donnees existantes migrees -> 1ere annee");
  } else {
    promoId = existing[0].id;
    console.log("Promotion existe deja");
  }

  // Show stats
  const { rows: counts } = await c.query(
    `SELECT c.nom as classe, count(s.id) as eleves
     FROM classes c LEFT JOIN students s ON s.classe_id=c.id
     WHERE c.promotion_id=$1 GROUP BY c.nom ORDER BY c.nom`, [promoId]
  );
  for (const r of counts) console.log(`  ${r.classe}: ${r.eleves} eleves`);

  await c.end();
})().catch(e => console.error("ERREUR:", e.message));
