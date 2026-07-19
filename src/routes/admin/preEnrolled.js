const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../../db");

function auth(req, res, next) {
  if (req.headers.authorization !== process.env.ADMIN_PASSWORD)
    return res.status(401).json({ error: "Non autorisé" });
  next();
}

router.use(auth);

// GET /api/admin/pre-enrolled
router.get("/", async (req, res) => {
  const query = supabaseAdmin
    .from("pre_enrolled")
    .select("id, no, nom, prenom, registered, classe_id")
    .order("no");

  if (req.query.classe_id) query.eq("classe_id", req.query.classe_id);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PUT /api/admin/pre-enrolled/:id — toggle registered
router.put("/:id", async (req, res) => {
  const { registered } = req.body;
  const { error } = await supabaseAdmin
    .from("pre_enrolled")
    .update({ registered })
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// DELETE /api/admin/pre-enrolled/:id
router.delete("/:id", async (req, res) => {
  const { error } = await supabaseAdmin
    .from("pre_enrolled")
    .delete()
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
