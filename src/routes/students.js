const express = require("express");
const router = express.Router();
const { supabaseAnon, supabaseAdmin } = require("../db");

router.post("/", async (req, res) => {
  const { nom, prenom, telephone_whatsapp, telephone_appel, adresse, contact_nom, contact_lien, contact_telephone } = req.body;

  if (!nom || !prenom) {
    return res.status(400).json({ error: "Nom et prénom sont obligatoires" });
  }

  const { data, error } = await supabaseAnon
    .from("students")
    .insert([{
      nom, prenom, telephone_whatsapp, telephone_appel,
      adresse, contact_nom, contact_lien, contact_telephone
    }])
    .select("no")
    .single();

  if (error) {
    console.error("Erreur insertion:", error);
    return res.status(500).json({ error: "Erreur lors de l'enregistrement. Vérifie ta connexion et réessaie." });
  }

  res.json({ success: true, no: data.no });
});

router.get("/", async (req, res) => {
  const password = req.headers.authorization;
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Non autorisé" });
  }

  const { data, error } = await supabaseAdmin
    .from("students")
    .select("*")
    .order("no", { ascending: true });

  if (error) {
    console.error("Erreur lecture:", error);
    return res.status(500).json({ error: "Erreur lors de la récupération des données" });
  }

  res.json(data);
});

module.exports = router;
