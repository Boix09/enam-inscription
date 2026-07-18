const { Client } = require("pg");
const c = new Client({
  host: "aws-1-us-west-2.pooler.supabase.com", port: 5432,
  database: "postgres", user: "postgres.kvdtnodzxnmbejukalvj",
  password: "TEST2433119450", ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 20000,
});

const list = [
  [1, "Acao", "Marc Arthur"], [2, "Alfred", "Saraïde"],
  [3, "André", "Christopher"], [4, "Brice", "Mc Andy Cliff Luchini"],
  [5, "Cadet", "Basilio Léonardo"], [6, "Chérie", "Stanley"],
  [7, "Chery", "Sebastien Chrisnet"], [8, "Clement", "Loudianie"],
  [9, "Cléon", "Mike Guy-Marly"], [10, "Daniel", "Bioulla"],
  [11, "Dorilas", "Marie Midelene"], [12, "Dorvil", "Schnaïka Scheeloveki"],
  [13, "Eustache", "Garvens"], [14, "Eximon", "Mike Stanley"],
  [15, "Fontus", "Michaël Angelo"], [16, "Jean Claude", "Ricky"],
  [17, "Jean Marie", "Sargine"], [18, "Jn Baptiste", "Jn Louis Junior Markenson"],
  [19, "Jorema", "Judelaire"], [20, "Joseph", "Wilbens"],
  [21, "Joseph", "Speedo Woody"], [22, "Louis", "Naderson"],
  [23, "Milien", "Louis Marc Enley"], [24, "Pierre", "Myrlande"],
  [25, "Pierre Louis", "Junior"], [26, "Raymond", "Carl Idensky"],
  [27, "Raymond", "Carl Densky"], [28, "Saintil", "Dominique"],
  [29, "Sanvil", "Ytaleine"], [30, "Sanon", "Shoomy"],
  [31, "St-Hilaire", "Ted Bendochy"], [32, "Sylvestre", "Kechna"],
  [33, "Thermidor", "Dendy"], [34, "Tilus", "Jean Ulkens Mc Kenny"],
];

(async () => {
  await c.connect();
  console.log("Connecte");

  // 1ère année
  const { rows: classe } = await c.query("SELECT id FROM classes WHERE slug='1ere-annee' LIMIT 1");
  const classeId = classe[0].id;

  await c.query("DELETE FROM pre_enrolled WHERE classe_id=$1", [classeId]);

  for (let i = 0; i < list.length; i += 10) {
    const batch = list.slice(i, i + 10);
    const values = batch.map((_, j) => `($${j*4+1},$${j*4+2},$${j*4+3},$${j*4+4})`).join(",");
    const flat = batch.flatMap(r => [r[0], r[1], r[2], classeId]);
    await c.query(`INSERT INTO pre_enrolled(no,nom,prenom,classe_id) VALUES ${values}`, flat);
    console.log(`  Insert ${i+1}-${Math.min(i+10, list.length)}`);
  }

  const { rows } = await c.query("SELECT count(*)::int as cnt FROM pre_enrolled WHERE classe_id=$1", [classeId]);
  console.log(rows[0].cnt, "pre-inscrits OK");

  // Update registered status for existing students
  const { rows: students } = await c.query("SELECT nom, prenom FROM students WHERE classe_id=$1", [classeId]);
  for (const s of students) {
    await c.query("UPDATE pre_enrolled SET registered=true WHERE nom=$1 AND prenom=$2 AND classe_id=$3",
      [s.nom, s.prenom, classeId]);
  }
  console.log("Registered flags synchronises");

  await c.end();
})().catch(e => console.error("ERREUR:", e.message));
