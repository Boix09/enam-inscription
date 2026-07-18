let token = "";

// --- Login ---
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  token = document.getElementById("passwordInput").value.trim();
  document.getElementById("loginError").style.display = "none";

  try {
    const res = await fetch("/api/students", { headers: { "Authorization": token } });
    if (!res.ok) {
      document.getElementById("loginError").textContent = "Mot de passe incorrect";
      document.getElementById("loginError").style.display = "block";
      token = "";
      return;
    }
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("adminSection").style.display = "block";
    loadPromotions();
    loadStudents();
    populateClasseFilter();
  } catch (err) {
    document.getElementById("loginError").textContent = "Erreur de connexion";
    document.getElementById("loginError").style.display = "block";
    token = "";
  }
});

// --- Tabs ---
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).style.display = "block";
    if (btn.dataset.tab === "eleves") { loadStudents(); populateClasseFilter(); }
  });
});

// --- Promotions ---
async function loadPromotions() {
  try {
    const res = await fetch("/api/admin/promotions", { headers: { "Authorization": token } });
    const promotions = await res.json();
    const div = document.getElementById("promotionsList");
    div.innerHTML = promotions.map(p => `
      <div class="promo-card">
        <div class="promo-header">
          <strong>${escHtml(p.nom)}</strong> (${p.annee_debut}-${p.annee_fin})
          <button class="btn-small danger" onclick="deletePromotion('${p.id}')">Supprimer</button>
        </div>
        <div class="promo-classes">
          ${p.classes.map(c => `
            <div class="classe-row">
              <span>${escHtml(c.nom)}</span>
              <span class="classe-count">${c.eleves} élèves</span>
              <code class="classe-link">https://enamdt.vercel.app/renseignements/${escHtml(p.slug)}/${escHtml(c.slug)}</code>
              <button class="btn-tiny" onclick="copyLink('https://enamdt.vercel.app/renseignements/${escHtml(p.slug)}/${escHtml(c.slug)}')">Copier</button>
            </div>
          `).join("")}
        </div>
      </div>
    `).join("");
  } catch(e) { console.error(e); }
}

async function deletePromotion(id) {
  if (!confirm("Supprimer cette promotion et toutes ses données ?")) return;
  await fetch("/api/admin/promotions/" + id, { method: "DELETE", headers: { "Authorization": token } });
  loadPromotions();
}

function copyLink(url) {
  navigator.clipboard.writeText(url).then(() => alert("Lien copié !"));
}

// --- Create Promotion ---
function showCreatePromo() {
  document.getElementById("promoModal").style.display = "block";
  updateClassInputs();
}

function closeModal() {
  document.getElementById("promoModal").style.display = "none";
}

function updateClassInputs() {
  const n = parseInt(document.getElementById("classCount").value) || 3;
  const div = document.getElementById("classInputs");
  const defaults = ["1ère Année", "2ème Année", "3ème Année"];
  div.innerHTML = "";
  for (let i = 0; i < n; i++) {
    div.innerHTML += `<label>Classe ${i+1}</label><input type="text" class="class-name" value="${escHtml(defaults[i] || "Classe " + (i+1))}" required>`;
  }
}

document.getElementById("promoForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("promoMsg");
  msg.style.display = "none";
  const classInputs = document.querySelectorAll(".class-name");
  const classes = Array.from(classInputs).map(inp => ({ nom: inp.value.trim() })).filter(c => c.nom);

  const body = {
    nom: document.getElementById("promoNom").value.trim(),
    annee_debut: parseInt(document.getElementById("promoAnneeDebut").value),
    annee_fin: parseInt(document.getElementById("promoAnneeFin").value),
    description: document.getElementById("promoDescription").value.trim(),
    classes
  };

  if (!classes.length) { msg.textContent = "Ajoute au moins une classe"; msg.className = "message error"; msg.style.display = "block"; return; }

  try {
    const res = await fetch("/api/admin/promotions", {
      method: "POST",
      headers: { "Authorization": token, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) { msg.textContent = data.error; msg.className = "message error"; msg.style.display = "block"; return; }
    closeModal();
    loadPromotions();
    document.getElementById("promoForm").reset();
    updateClassInputs();
  } catch(e) { msg.textContent = "Erreur réseau"; msg.className = "message error"; msg.style.display = "block"; }
});

// --- Students / Exports ---
async function loadStudents() {
  const tbody = document.querySelector("#studentsTable tbody");
  try {
    const classeId = document.getElementById("classeFilter")?.value || "";
    const url = "/api/students" + (classeId ? "?classe_id=" + classeId : "");
    const res = await fetch(url, { headers: { "Authorization": token } });
    const students = await res.json();
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
  } catch(e) { tbody.innerHTML = "<tr><td colspan='9'>Erreur chargement</td></tr>"; }
}

async function populateClasseFilter() {
  const sel = document.getElementById("classeFilter");
  try {
    const res = await fetch("/api/admin/promotions", { headers: { "Authorization": token } });
    const promotions = await res.json();
    sel.innerHTML = '<option value="">Toutes les classes</option>';
    promotions.forEach(p => {
      p.classes.forEach(c => {
        sel.innerHTML += `<option value="${c.id}">${escHtml(p.nom)} - ${escHtml(c.nom)}</option>`;
      });
    });
  } catch(e) {}
}

function getExportSuffix() {
  const sel = document.getElementById("classeFilter");
  if (!sel || !sel.value) return "";
  const text = sel.options[sel.selectedIndex].text;
  return "_" + text.replace(/[^a-zA-Z0-9]/g, "_");
}

async function exportWord() {
  if (!token) return;
  const ind = document.getElementById("loadingIndicator");
  ind.style.display = "inline";
  try {
    const classeId = document.getElementById("classeFilter")?.value || "";
    const url = "/api/exports/word" + (classeId ? "?classe_id=" + classeId : "");
    const res = await fetch(url, { headers: { "Authorization": token } });
    if (!res.ok) { alert("Erreur d'export"); return; }
    downloadBlob(await res.blob(), "fiche_renseignements_ENAM" + getExportSuffix() + ".docx");
  } finally { ind.style.display = "none"; }
}

async function exportExcel() {
  if (!token) return;
  const ind = document.getElementById("loadingIndicator");
  ind.style.display = "inline";
  try {
    const classeId = document.getElementById("classeFilter")?.value || "";
    const url = "/api/exports/excel" + (classeId ? "?classe_id=" + classeId : "");
    const res = await fetch(url, { headers: { "Authorization": token } });
    if (!res.ok) { alert("Erreur d'export"); return; }
    downloadBlob(await res.blob(), "fiche_renseignements_ENAM" + getExportSuffix() + ".xlsx");
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

function escHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Close modal on outside click
window.addEventListener("click", e => {
  const modal = document.getElementById("promoModal");
  if (e.target === modal) closeModal();
});
