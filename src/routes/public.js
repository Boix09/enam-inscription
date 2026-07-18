const express = require("express");
const router = express.Router();
const path = require("path");
const { supabaseAnon } = require("../db");

// GET /renseignements/:promoSlug/:classeSlug → serve form
router.get("/renseignements/:promoSlug/:classeSlug", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "..", "public", "index.html"));
});

// GET /api/context?promo_slug=X&classe_slug=Y
router.get("/api/context", async (req, res) => {
  const { promo_slug, classe_slug } = req.query;
  if (!promo_slug || !classe_slug)
    return res.status(400).json({ error: "promo_slug et classe_slug requis" });

  const { data: promo, error: e1 } = await supabaseAnon
    .from("promotions").select("id, nom, annee_debut, annee_fin")
    .eq("slug", promo_slug).single();

  if (e1 || !promo)
    return res.status(404).json({ error: "Promotion introuvable" });

  const { data: classe, error: e2 } = await supabaseAnon
    .from("classes").select("id, nom")
    .eq("slug", classe_slug).eq("promotion_id", promo.id).single();

  if (e2 || !classe)
    return res.status(404).json({ error: "Classe introuvable" });

  res.json({
    promotion: promo,
    classe: classe
  });
});

module.exports = router;
