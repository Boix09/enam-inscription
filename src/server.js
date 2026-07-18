try { require("dotenv").config(); } catch (e) {}
const express = require("express");
const path = require("path");
const studentsRouter = require("./routes/students");
const exportsRouter = require("./routes/exports");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "landing.html"));
});

app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/api/students", studentsRouter);
app.use("/api/exports", exportsRouter);
app.use("/api", require("./routes/preEnrolled"));
app.use("/api/admin/promotions", require("./routes/admin/promotions"));
app.use("/api/logs", require("./routes/logs"));
app.use("/", require("./routes/public"));

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "admin.html"));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Serveur ENAM démarré sur http://localhost:${PORT}`);
  });
}

module.exports = app;
