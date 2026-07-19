const express = require("express");
const router = express.Router();
const path = require("path");
const { supabaseAnon, supabaseAdmin } = require("../db");

// GET /renseignements/:promoSlug/:classeSlug → serve form
router.get("/renseignements/:promoSlug/:classeSlug", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "..", "public", "index.html"));
});

// GET /api/context?promo_slug=X&classe_slug=Y
// PUT /api/settings/whatsapp — update (admin)
router.put("/api/settings/whatsapp", async (req, res) => {
  if (req.headers.authorization !== process.env.ADMIN_PASSWORD)
    return res.status(401).json({ error: "Non autorisé" });
  const { value } = req.body;
  if (!value) return res.status(400).json({ error: "Numéro requis" });

  const { error } = await supabaseAdmin
    .from("settings").upsert({ key: "whatsapp", value }, { onConflict: "key" });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// GET /api/settings/whatsapp
router.get("/api/settings/whatsapp", async (req, res) => {
  const { data } = await supabaseAnon
    .from("settings").select("value").eq("key", "whatsapp").single();
  res.json({ whatsapp: data?.value || "+50938817140" });
});

// GET /api/feature-flags — retourne les flags activés (public)
router.get("/api/feature-flags", async (req, res) => {
  const { data, error } = await supabaseAnon
    .from("feature_flags").select("key, enabled");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// GET /api/settings/banner — message de bannière (public)
router.get("/api/settings/banner", async (req, res) => {
  const { data } = await supabaseAnon
    .from("settings").select("value").eq("key", "banner_message").single();
  res.json({ message: data?.value || "" });
});

// PUT /api/settings/banner — mettre à jour la bannière (super admin)
router.put("/api/settings/banner", async (req, res) => {
  if (req.headers.authorization !== process.env.SUPER_ADMIN_PASSWORD)
    return res.status(401).json({ error: "Non autorisé" });
  const { message } = req.body;
  const { error } = await supabaseAdmin
    .from("settings").upsert({ key: "banner_message", value: message }, { onConflict: "key" });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

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
