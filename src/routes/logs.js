const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../db");

router.get("/", async (req, res) => {
  const password = req.headers.authorization;
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Non autorisé" });
  }

  const query = supabaseAdmin.from("submission_logs").select("*");
  if (req.query.classe_id) query.eq("classe_id", req.query.classe_id);
  query.order("created_at", { ascending: false });
  if (req.query.limit) query.limit(parseInt(req.query.limit));

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
