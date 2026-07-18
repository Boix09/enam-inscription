const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../../db");

function auth(req, res, next) {
  if (req.headers.authorization !== process.env.ADMIN_PASSWORD)
    return res.status(401).json({ error: "Non autorisé" });
  next();
}

router.use(auth);

// GET /api/admin/promotions → liste toutes les promotions avec classes
router.get("/", async (req, res) => {
  const { data: promotions, error } = await supabaseAdmin
    .from("promotions").select("*").order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const { data: classes, error: e2 } = await supabaseAdmin
    .from("classes").select("*").order("created_at");

  if (e2) return res.status(500).json({ error: e2.message });

  const map = {};
  for (const c of classes) {
    if (!map[c.promotion_id]) map[c.promotion_id] = [];
    map[c.promotion_id].push(c);
  }
  for (const p of promotions) p.classes = map[p.id] || [];

  const { data: counts } = await supabaseAdmin
    .from("students").select("classe_id");
  const countMap = {};
  if (counts) for (const s of counts) countMap[s.classe_id] = (countMap[s.classe_id] || 0) + 1;
  for (const p of promotions)
    for (const c of p.classes)
      c.eleves = countMap[c.id] || 0;

  res.json(promotions);
});

// POST /api/admin/promotions → créer promotion + classes
router.post("/", async (req, res) => {
  const { nom, annee_debut, annee_fin, description, classes } = req.body;
  if (!nom || !annee_debut || !annee_fin || !classes || !classes.length)
    return res.status(400).json({ error: "Nom, années et au moins une classe requis" });

  const slug = nom.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + annee_debut;

  const { data: promo, error: e1 } = await supabaseAdmin
    .from("promotions").insert([{ nom, slug, annee_debut, annee_fin, description }])
    .select("id").single();
  if (e1) return res.status(500).json({ error: e1.message });

  const rows = classes.map(c => ({
    promotion_id: promo.id,
    nom: c.nom,
    slug: c.nom.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  }));

  const { data: inserted, error: e2 } = await supabaseAdmin
    .from("classes").insert(rows).select();
  if (e2) return res.status(500).json({ error: e2.message });

  res.json({ promo, classes: inserted });
});

// DELETE /api/admin/promotions/:id
router.delete("/:id", async (req, res) => {
  // Get all classe IDs for this promotion
  const { data: classes } = await supabaseAdmin
    .from("classes").select("id").eq("promotion_id", req.params.id);
  const ids = classes ? classes.map(c => c.id) : [];

  // Delete students first, then pre_enrolled, then classes, then promotion
  if (ids.length) {
    await supabaseAdmin.from("students").delete().in("classe_id", ids);
    await supabaseAdmin.from("pre_enrolled").delete().in("classe_id", ids);
    await supabaseAdmin.from("submission_logs").delete().in("classe_id", ids);
  }

  const { error: e1 } = await supabaseAdmin
    .from("classes").delete().eq("promotion_id", req.params.id);
  if (e1) return res.status(500).json({ error: e1.message });

  const { error } = await supabaseAdmin
    .from("promotions").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true });
});

module.exports = router;
