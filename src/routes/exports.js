const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../db");
const { generateDocx } = require("../utils/docxGenerator");
const { generateExcel } = require("../utils/excelGenerator");
const path = require("path");
const fs = require("fs");

const logoBuf = fs.readFileSync(path.join(__dirname, "..", "..", "public", "logo.jpg"));

async function getStudents(password, classe_id, ids) {
  if (password !== process.env.ADMIN_PASSWORD) return null;
  const query = supabaseAdmin.from("students").select("*");
  if (classe_id) query.eq("classe_id", classe_id);
  if (ids) {
    const idArr = ids.split(",").filter(Boolean);
    if (idArr.length > 0) query.in("id", idArr);
  }
  const { data, error } = await query.order("nom", { ascending: true }).order("prenom", { ascending: true });
  if (error) throw error;
  return data;
}

async function getPromoInfo(classe_id) {
  if (!classe_id) return null;
  const { data } = await supabaseAdmin
    .from("classes").select("nom, promotion_id").eq("id", classe_id).single();
  if (!data) return null;
  const { data: promo } = await supabaseAdmin
    .from("promotions").select("nom, annee_debut, annee_fin").eq("id", data.promotion_id).single();
  if (!promo) return null;
  return { promo: promo.nom + " (" + promo.annee_debut + "-" + promo.annee_fin + ")", classe: data.nom };
}

router.get("/word", async (req, res) => {
  try {
    const pw = req.headers.authorization;
    const students = await getStudents(pw, req.query.classe_id, req.query.ids);
    if (!students) return res.status(401).json({ error: "Non autorisé" });

    const info = await getPromoInfo(req.query.classe_id);
    const buffer = await generateDocx(students, info, logoBuf);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", "attachment; filename=fiche_renseignements_ENAM.docx");
    res.send(buffer);
  } catch (err) {
    console.error("Erreur export Word:", err);
    res.status(500).json({ error: "Erreur lors de la génération du fichier" });
  }
});

router.get("/excel", async (req, res) => {
  try {
    const pw = req.headers.authorization;
    const students = await getStudents(pw, req.query.classe_id, req.query.ids);
    if (!students) return res.status(401).json({ error: "Non autorisé" });

    const info = await getPromoInfo(req.query.classe_id);
    const buffer = await generateExcel(students, info, logoBuf);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=fiche_renseignements_ENAM.xlsx");
    res.send(buffer);
  } catch (err) {
    console.error("Erreur export Excel:", err);
    res.status(500).json({ error: "Erreur lors de la génération du fichier" });
  }
});

module.exports = router;
