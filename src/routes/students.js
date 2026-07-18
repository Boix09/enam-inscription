const express = require("express");
const router = express.Router();
const { supabaseAnon, supabaseAdmin } = require("../db");

function getIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
}

async function logSubmission(req, info) {
  const { browser } = req.body;
  const payload = {
    student_nom: info.nom || null,
    student_prenom: info.prenom || null,
    classe_id: info.classe_id || null,
    ip_address: getIp(req),
    user_agent: req.headers["user-agent"] || null,
    screen_resolution: browser?.screen || null,
    language: browser?.language || null,
    timezone: browser?.timezone || null,
    platform: browser?.platform || null,
    device_type: browser?.device_type || null,
    referrer: browser?.referrer || null,
    page_url: browser?.page_url || null,
    success: info.success || false,
    reject_reason: info.reject_reason || null,
  };
  await supabaseAdmin.from("submission_logs").insert([payload]);
}

router.post("/", async (req, res) => {
  const { nom, prenom, telephone_whatsapp, telephone_appel, adresse, contact_nom, contact_lien, contact_telephone, classe_id } = req.body;

  if (!nom || !prenom) {
    logSubmission(req, { nom, prenom, classe_id, success: false, reject_reason: "Champs obligatoires manquants" });
    return res.status(400).json({ error: "Nom et prénom sont obligatoires" });
  }

  const query = supabaseAnon.from("students").select("id").eq("nom", nom).eq("prenom", prenom);
  if (classe_id) query.eq("classe_id", classe_id);

  const { data: existing } = await query.maybeSingle();
  if (existing) {
    logSubmission(req, { nom, prenom, classe_id, success: false, reject_reason: "Doublon nom+prénom dans la classe" });
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
      logSubmission(req, { nom, prenom, classe_id, success: false, reject_reason: "Téléphone WhatsApp déjà utilisé dans la classe" });
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
    logSubmission(req, { nom, prenom, classe_id, success: false, reject_reason: "Erreur serveur: " + error.message });
    return res.status(500).json({ error: "Erreur lors de l'enregistrement. Vérifie ta connexion et réessaie." });
  }

  const preQuery = supabaseAnon.from("pre_enrolled").update({ registered: true }).eq("nom", nom).eq("prenom", prenom);
  if (classe_id) preQuery.eq("classe_id", classe_id);
  await preQuery;

  logSubmission(req, { nom, prenom, classe_id, success: true });
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

// PUT /api/students/:id — modifier un élève (admin)
router.put("/:id", async (req, res) => {
  const password = req.headers.authorization;
  if (password !== process.env.ADMIN_PASSWORD)
    return res.status(401).json({ error: "Non autorisé" });

  const { nom, prenom, telephone_whatsapp, telephone_appel, adresse, contact_nom, contact_lien, contact_telephone } = req.body;

  const { error } = await supabaseAdmin
    .from("students").update({
      nom, prenom, telephone_whatsapp, telephone_appel,
      adresse, contact_nom, contact_lien, contact_telephone
    }).eq("id", req.params.id);

  if (error) return res.status(500).json({ error: error.message });
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
