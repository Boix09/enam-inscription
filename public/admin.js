let token = "";

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  token = document.getElementById("passwordInput").value.trim();
  document.getElementById("loginError").style.display = "none";

  try {
    const res = await fetch("/api/students", {
      headers: { "Authorization": token }
    });

    if (!res.ok) {
      document.getElementById("loginError").textContent = "Mot de passe incorrect";
      document.getElementById("loginError").style.display = "block";
      token = "";
      return;
    }

    const students = await res.json();
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("adminSection").style.display = "block";
    renderTable(students);
  } catch (err) {
    document.getElementById("loginError").textContent = "Erreur de connexion au serveur";
    document.getElementById("loginError").style.display = "block";
    token = "";
  }
});

function renderTable(students) {
  const tbody = document.querySelector("#studentsTable tbody");
  tbody.innerHTML = students.map(s => `
    <tr>
      <td>${s.no}</td>
      <td>${escHtml(s.nom)}</td>
      <td>${escHtml(s.prenom)}</td>
      <td>${escHtml(s.telephone_whatsapp || "")}</td>
      <td>${escHtml(s.telephone_appel || "")}</td>
      <td>${escHtml(s.adresse || "")}</td>
      <td>${escHtml(s.contact_nom || "")}</td>
      <td>${escHtml(s.contact_lien || "")}</td>
      <td>${escHtml(s.contact_telephone || "")}</td>
    </tr>
  `).join("");
}

function escHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function exportWord() {
  if (!token) return;
  const ind = document.getElementById("loadingIndicator");
  ind.style.display = "inline";
  try {
    const res = await fetch("/api/exports/word", {
      headers: { "Authorization": token }
    });
    if (!res.ok) { alert("Erreur d'export"); return; }
    downloadBlob(await res.blob(), "fiche_renseignements_ENAM.docx");
  } finally { ind.style.display = "none"; }
}

async function exportExcel() {
  if (!token) return;
  const ind = document.getElementById("loadingIndicator");
  ind.style.display = "inline";
  try {
    const res = await fetch("/api/exports/excel", {
      headers: { "Authorization": token }
    });
    if (!res.ok) { alert("Erreur d'export"); return; }
    downloadBlob(await res.blob(), "fiche_renseignements_ENAM.xlsx");
  } finally { ind.style.display = "none"; }
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
