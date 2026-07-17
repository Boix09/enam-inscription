const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../db");
const { generateDocx } = require("../utils/docxGenerator");
const { generateExcel } = require("../utils/excelGenerator");

async function getStudents(password) {
  if (password !== process.env.ADMIN_PASSWORD) return null;
  const { data, error } = await supabaseAdmin
    .from("students")
    .select("*")
    .order("no", { ascending: true });
  if (error) throw error;
  return data;
}

router.get("/word", async (req, res) => {
  try {
    const pw = req.headers.authorization;
    const students = await getStudents(pw);
    if (!students) return res.status(401).json({ error: "Non autorisé" });

    const buffer = await generateDocx(students);
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
    const students = await getStudents(pw);
    if (!students) return res.status(401).json({ error: "Non autorisé" });

    const buffer = await generateExcel(students);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=fiche_renseignements_ENAM.xlsx");
    res.send(buffer);
  } catch (err) {
    console.error("Erreur export Excel:", err);
    res.status(500).json({ error: "Erreur lors de la génération du fichier" });
  }
});

module.exports = router;
