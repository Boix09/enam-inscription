const express = require("express");
const router = express.Router();
const { supabaseAnon, supabaseAdmin } = require("../db");

router.post("/", async (req, res) => {
  const { nom, prenom, telephone_whatsapp, telephone_appel, adresse, contact_nom, contact_lien, contact_telephone, classe_id } = req.body;

  if (!nom || !prenom) {
    return res.status(400).json({ error: "Nom et prénom sont obligatoires" });
  }

  const query = supabaseAnon.from("students").select("id").eq("nom", nom).eq("prenom", prenom);
  if (classe_id) query.eq("classe_id", classe_id);

  const { data: existing } = await query.maybeSingle();
  if (existing) {
    return res.status(409).json({ error: "Cet élève est déjà inscrit dans cette classe." });
  }

  if (telephone_whatsapp && classe_id) {
    const { data: telExists } = await supabaseAnon
      .from("students")
      .select("id")
      .eq("telephone_whatsapp", telephone_whatsapp)
      .eq("classe_id", classe_id)
      .maybeSingle();
    if (telExists) {
      return res.status(409).json({ error: "Ce numéro WhatsApp est déjà utilisé dans cette classe." });
    }
  }

  const { data, error } = await supabaseAnon
    .from("students")
    .insert([{
      nom, prenom, telephone_whatsapp, telephone_appel,
      adresse, contact_nom, contact_lien, contact_telephone, classe_id
    }])
    .select("no")
    .single();

  if (error) {
    console.error("Erreur insertion:", error);
    return res.status(500).json({ error: "Erreur lors de l'enregistrement. Vérifie ta connexion et réessaie." });
  }

  const preQuery = supabaseAnon.from("pre_enrolled").update({ registered: true }).eq("nom", nom).eq("prenom", prenom);
  if (classe_id) preQuery.eq("classe_id", classe_id);
  await preQuery;

  res.json({ success: true, no: data.no });
});

router.get("/", async (req, res) => {
  const password = req.headers.authorization;
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Non autorisé" });
  }

  const query = supabaseAdmin.from("students").select("*, classe_id");
  if (req.query.classe_id) query.eq("classe_id", req.query.classe_id);
  query.order("no", { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error("Erreur lecture:", error);
    return res.status(500).json({ error: "Erreur lors de la récupération des données" });
  }

  res.json(data);
});

// DELETE /api/students/class/:classeId — supprimer tous les élèves d'une classe
router.delete("/class/:classeId", async (req, res) => {
  const password = req.headers.authorization;
  if (password !== process.env.ADMIN_PASSWORD)
    return res.status(401).json({ error: "Non autorisé" });

  const { error } = await supabaseAdmin
    .from("students").delete().eq("classe_id", req.params.classeId);
  if (error) return res.status(500).json({ error: error.message });

  await supabaseAdmin
    .from("pre_enrolled").update({ registered: false }).eq("classe_id", req.params.classeId);

  res.json({ success: true });
});

// DELETE /api/students/:id — supprimer un élève (admin)
router.delete("/:id", async (req, res) => {
  const password = req.headers.authorization;
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Non autorisé" });
  }

  const { error } = await supabaseAdmin
    .from("students")
    .delete()
    .eq("id", req.params.id);

  if (error) {
    console.error("Erreur suppression:", error);
    return res.status(500).json({ error: "Erreur lors de la suppression" });
  }

  res.json({ success: true });
});

module.exports = router;
