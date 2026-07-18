const express = require("express");
const router = express.Router();
const { supabaseAnon } = require("../db");

router.get("/pre-enrolled", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json([]);

  const { data, error } = await supabaseAnon
    .from("pre_enrolled")
    .select("no, nom, prenom, registered")
    .ilike("nom", `%${q}%`)
    .order("no")
    .limit(10);

  if (error) {
    console.error("Erreur recherche pre-enrolled:", error);
    return res.status(500).json({ error: "Erreur recherche" });
  }

  res.json(data);
});

module.exports = router;
