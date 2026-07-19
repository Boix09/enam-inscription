const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../db");

function auth(req, res, next) {
  const saPwd = process.env.SUPER_ADMIN_PASSWORD;
  if (!saPwd)
    return res.status(500).json({ error: "SUPER_ADMIN_PASSWORD non configuré dans les variables d'environnement" });
  if (req.headers.authorization !== saPwd)
    return res.status(401).json({ error: "Non autorisé" });
  next();
}

router.use(auth);

// GET /api/superadmin/feature-flags
router.get("/feature-flags", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("feature_flags").select("*").order("key");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PUT /api/superadmin/feature-flags/:key
router.put("/feature-flags/:key", async (req, res) => {
  const { enabled } = req.body;
  const { error } = await supabaseAdmin
    .from("feature_flags")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("key", req.params.key);
  if (error) return res.status(500).json({ error: error.message });

  await logAction(req, `Toggle ${req.params.key} → ${enabled ? "ON" : "OFF"}`);
  res.json({ success: true });
});

// GET /api/superadmin/backup
router.get("/backup", async (req, res) => {
  const [
    promotions, classes, students, preEnrolled,
    settings, logs, flags, saLogs
  ] = await Promise.all([
    supabaseAdmin.from("promotions").select("*"),
    supabaseAdmin.from("classes").select("*"),
    supabaseAdmin.from("students").select("*"),
    supabaseAdmin.from("pre_enrolled").select("*"),
    supabaseAdmin.from("settings").select("*"),
    supabaseAdmin.from("submission_logs").select("*"),
    supabaseAdmin.from("feature_flags").select("*"),
    supabaseAdmin.from("super_admin_logs").select("*"),
  ]);

  const backup = {
    version: "1.0",
    exported_at: new Date().toISOString(),
    promotions: promotions.data || [],
    classes: classes.data || [],
    students: students.data || [],
    pre_enrolled: preEnrolled.data || [],
    settings: settings.data || [],
    submission_logs: logs.data || [],
    feature_flags: flags.data || [],
    super_admin_logs: saLogs.data || [],
  };

  await logAction(req, "Backup exporté");
  res.json(backup);
});

// POST /api/superadmin/restore
router.post("/restore", async (req, res) => {
  const data = req.body;
  if (!data.version)
    return res.status(400).json({ error: "Format de backup invalide" });

  const errors = [];

  if (data.promotions?.length) {
    const { error } = await supabaseAdmin.from("promotions").insert(data.promotions);
    if (error) errors.push(`promotions: ${error.message}`);
  }
  if (data.classes?.length) {
    const { error } = await supabaseAdmin.from("classes").insert(data.classes);
    if (error) errors.push(`classes: ${error.message}`);
  }
  if (data.students?.length) {
    const { error } = await supabaseAdmin.from("students").insert(data.students);
    if (error) errors.push(`students: ${error.message}`);
  }
  if (data.pre_enrolled?.length) {
    await supabaseAdmin.from("pre_enrolled").delete().neq("id", 0);
    const { error } = await supabaseAdmin.from("pre_enrolled").insert(data.pre_enrolled);
    if (error) errors.push(`pre_enrolled: ${error.message}`);
  }
  if (data.settings?.length) {
    await supabaseAdmin.from("settings").delete().neq("id", 0);
    const { error } = await supabaseAdmin.from("settings").insert(data.settings);
    if (error) errors.push(`settings: ${error.message}`);
  }
  if (data.submission_logs?.length) {
    const { error } = await supabaseAdmin.from("submission_logs").insert(data.submission_logs);
    if (error) errors.push(`submission_logs: ${error.message}`);
  }
  if (data.feature_flags?.length) {
    const { error } = await supabaseAdmin.from("feature_flags").insert(data.feature_flags);
    if (error) errors.push(`feature_flags: ${error.message}`);
  }
  if (data.super_admin_logs?.length) {
    const { error } = await supabaseAdmin.from("super_admin_logs").insert(data.super_admin_logs);
    if (error) errors.push(`super_admin_logs: ${error.message}`);
  }

  const status = errors.length === 0 ? "complète" : `partielle (${errors.length} erreurs)`;
  await logAction(req, `Restauration ${status} depuis backup` + (errors.length ? `: ${errors.join("; ")}` : ""));

  if (errors.length)
    return res.status(500).json({ success: false, errors, message: "Restauration partielle — certaines tables ont échoué" });

  res.json({ success: true, message: "Restauration terminée avec succès" });
});

// GET /api/superadmin/logs
router.get("/logs", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("super_admin_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

async function logAction(req, action) {
  try {
    await supabaseAdmin.from("super_admin_logs").insert([{
      action,
      ip_address: req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip,
    }]);
  } catch (e) {
    console.error("Erreur log super admin:", e);
  }
}

module.exports = router;
