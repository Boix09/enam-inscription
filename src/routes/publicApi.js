const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../db");

// GET /api/public/students — accessible seulement si api_publique = ON
router.get("/students", async (req, res) => {
  // Vérifier si l'API publique est activée
  const { data: flag } = await supabaseAdmin
    .from("feature_flags")
    .select("enabled")
    .eq("key", "api_publique")
    .single();

  if (!flag || !flag.enabled) {
    return res.status(403).json({ error: "API publique désactivée" });
  }

  const query = supabaseAdmin
    .from("students")
    .select("no, nom, prenom, classe_id, created_at")
    .order("nom", { ascending: true })
    .order("prenom", { ascending: true });

  if (req.query.classe_id) query.eq("classe_id", req.query.classe_id);
  if (req.query.limit) query.limit(parseInt(req.query.limit));

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  res.json({
    success: true,
    count: data.length,
    data,
    api: "ENAM Public API v1",
  });
});

// GET /api/public/promotions
router.get("/promotions", async (req, res) => {
  const { data: flag } = await supabaseAdmin
    .from("feature_flags")
    .select("enabled")
    .eq("key", "api_publique")
    .single();

  if (!flag || !flag.enabled) {
    return res.status(403).json({ error: "API publique désactivée" });
  }

  const { data: promotions, error } = await supabaseAdmin
    .from("promotions").select("nom, slug, annee_debut, annee_fin");

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, count: promotions.length, data: promotions });
});

module.exports = router;
