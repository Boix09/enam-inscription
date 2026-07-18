const { Client } = require("pg");

const list = [
  [1, "Acuo", "Marc Arthur"], [2, "Alfred", "Saraide"],
  [3, "Andre", "Christopher Mc Andy Cliff"], [4, "Brice", "Luchini"],
  [5, "Cadet", "Basilio Leonardo"], [6, "Cheric", "Stanley"],
  [7, "Chery", "Sebastien Chrisnet"], [8, "Clement", "Loudianie"],
  [9, "Cleon", "Mike Guy-Marly"], [10, "Daniel", "Bioulla"],
  [11, "Dorilas", "Marie Midelene"], [12, "Dorvil", "Schmaika Scheeloveki"],
  [13, "Eustache", "Garvens"], [14, "Eximon", "Mike Stanley"],
  [15, "Fontus", "Michael Angelo"], [16, "Jean Claude", "Ricky"],
  [17, "Jean Marie", "Sargine"], [18, "Jn Baptiste", "Jn Louis Junior Markenson"],
  [19, "Jorema", "Judelaire"], [20, "Joseph", "Wilbens"],
  [21, "Joseph", "Speedo Woody"], [22, "Louis", "Naderson"],
  [23, "Milien", "Louis Marc Enley"], [24, "Pierre", "Myrlande"],
  [25, "Pierre Louis", "Junior"], [26, "Raymond", "Carl Idensky"],
  [27, "Raymond", "Carl Densky"], [28, "Saintil", "Dominique"],
  [29, "Sanvil", "Ytalcine"], [30, "Sanon", "Shoomy"],
  [31, "St-Hilaire", "Ted Bendochy"], [32, "Sylvestre", "Kechna"],
  [33, "Thermidor", "Dendy"], [34, "Tilus", "Jean Ulkens Mc Kenny"],
];

(async () => {
  const c = new Client({
    host: "aws-1-us-west-2.pooler.supabase.com", port: 5432,
    database: "postgres", user: "postgres.kvdtnodzxnmbejukalvj",
    password: "TEST2433119450", ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
  });
  await c.connect();
  console.log("Connecte");

  await c.query(`CREATE TABLE IF NOT EXISTS pre_enrolled (
    id SERIAL PRIMARY KEY, no INTEGER NOT NULL,
    nom TEXT NOT NULL, prenom TEXT NOT NULL,
    registered BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
  )`);
  await c.query("ALTER TABLE pre_enrolled ENABLE ROW LEVEL SECURITY");
  await c.query("GRANT SELECT ON TABLE pre_enrolled TO anon");
  await c.query("DROP POLICY IF EXISTS select_pre_enrolled ON pre_enrolled");
  await c.query("CREATE POLICY select_pre_enrolled ON pre_enrolled FOR SELECT USING (true)");
  await c.query("CREATE INDEX IF NOT EXISTS idx_pre_enrolled_nom ON pre_enrolled (nom)");
  await c.query("DELETE FROM pre_enrolled");
  console.log("Table + RLS OK");

  // Insert en lots de 10 pour éviter timeout
  for (let i = 0; i < list.length; i += 10) {
    const batch = list.slice(i, i + 10);
    const values = batch.map((_, j) => `($${j*3+1},$${j*3+2},$${j*3+3})`).join(",");
    const flat = batch.flat();
    await c.query(`INSERT INTO pre_enrolled(no,nom,prenom) VALUES ${values}`, flat);
    console.log(`  Insert ${i+1}-${Math.min(i+10, list.length)}`);
  }

  const { rows } = await c.query("SELECT count(*)::int as cnt FROM pre_enrolled");
  console.log(rows[0].cnt, "eleves pre-inscrits OK");
  await c.end();
})().catch(e => console.error("ERREUR:", e.message));
