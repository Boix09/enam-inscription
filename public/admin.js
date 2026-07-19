let token = "";
let flags = {};

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
    await loadFlags();
    loadPromotions();
    loadStudents();
    populateClasseFilter();
    loadWhatsapp();
  } catch (err) {
    document.getElementById("loginError").textContent = "Erreur de connexion";
    document.getElementById("loginError").style.display = "block";
    token = "";
  }
});

async function loadFlags() {
  try {
    const res = await fetch("/api/feature-flags");
    const data = await res.json();
    flags = {};
    data.forEach(f => { flags[f.key] = f.enabled; });
    const searchBar = document.getElementById("searchBar");
    if (searchBar) searchBar.style.display = flags.recherche_globale ? "block" : "none";
    const preTab = document.getElementById("preTab");
    if (preTab) preTab.style.display = flags.gerer_pre_inscrits ? "" : "none";
  } catch(e) {}
}

// --- Tabs ---
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).style.display = "block";
    if (btn.dataset.tab === "eleves") { loadStudents(); populateClasseFilter(); }
    if (btn.dataset.tab === "preinscrits") { populatePreClasseFilter(); loadPreEnrolled(); }
    if (btn.dataset.tab === "journal") { populateLogClasseFilter(); loadLogs(); }
  });
});

// --- Promotions ---
async function loadWhatsapp() {
  try {
    const res = await fetch("/api/settings/whatsapp");
    const d = await res.json();
    document.getElementById("whatsappSetting").value = d.whatsapp;
  } catch(e) {}
}

async function saveWhatsapp() {
  const val = document.getElementById("whatsappSetting").value.trim();
  const msg = document.getElementById("whatsappMsg");
  try {
    const res = await fetch("/api/settings/whatsapp", {
      method: "PUT",
      headers: { "Authorization": token, "Content-Type": "application/json" },
      body: JSON.stringify({ value: val }),
    });
    msg.textContent = res.ok ? "Sauvegardé ✓" : (await res.json()).error;
    msg.style.color = res.ok ? "var(--success-text)" : "var(--error-text)";
  } catch(e) { msg.textContent = "Erreur réseau"; msg.style.color = "var(--error-text)"; }
}

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
              <button class="btn-tiny danger" onclick="viderClasse('${c.id}', '${escHtml(c.nom)}')">Vider</button>
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
let currentStudents = [];
let deletedStudents = [];
let classeMap = {};

async function loadStudents() {
  const tbody = document.querySelector("#studentsTable tbody");
  try {
    await buildClasseMap();
    const classeId = document.getElementById("classeFilter")?.value || "";
    const url = "/api/students" + (classeId ? "?classe_id=" + classeId : "");
    const res = await fetch(url, { headers: { "Authorization": token } });
    currentStudents = await res.json();
    renderTable();
  } catch(e) { tbody.innerHTML = "<tr><td colspan='11'>Erreur chargement</td></tr>"; }
}

async function buildClasseMap() {
  try {
    const res = await fetch("/api/admin/promotions", { headers: { "Authorization": token } });
    const promotions = await res.json();
    classeMap = {};
    promotions.forEach(p => {
      p.classes.forEach(c => {
        classeMap[c.id] = escHtml(p.nom) + " - " + escHtml(c.nom);
      });
    });
  } catch(e) {}
}

let searchTerm = "";

function filterStudents() {
  searchTerm = (document.getElementById("searchInput")?.value || "").toLowerCase();
  renderTable();
}

function renderTable() {
  const tbody = document.querySelector("#studentsTable tbody");
  const filtered = searchTerm
    ? currentStudents.filter(s =>
        (s.nom || "").toLowerCase().includes(searchTerm) ||
        (s.prenom || "").toLowerCase().includes(searchTerm) ||
        (s.telephone_whatsapp || "").includes(searchTerm) ||
        (s.telephone_appel || "").includes(searchTerm) ||
        (s.adresse || "").toLowerCase().includes(searchTerm) ||
        (s.contact_nom || "").toLowerCase().includes(searchTerm) ||
        (s.contact_telephone || "").includes(searchTerm))
    : currentStudents;
  tbody.innerHTML = filtered.map((s, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escHtml(s.nom)}</td>
      <td>${escHtml(s.prenom)}</td>
      <td>${escHtml(s.telephone_whatsapp || "")}</td>
      <td>${escHtml(s.telephone_appel || "")}</td>
      <td>${escHtml(s.adresse || "")}</td>
      <td>${escHtml(s.contact_nom || "")}</td>
      <td>${escHtml(s.contact_lien || "")}</td>
      <td>${escHtml(s.contact_telephone || "")}</td>
      <td style="white-space:nowrap">
        <button class="btn-tiny" onclick="editStudent('${s.id}')">✎</button>
        <button class="btn-tiny danger" onclick="retirer('${s.id}')">✕</button>
      </td>
    </tr>
  `).join("");

  const dtbody = document.getElementById("deletedTable");
  if (deletedStudents.length === 0) {
    document.getElementById("deletedSection").style.display = "none";
    return;
  }
  document.getElementById("deletedSection").style.display = "block";
  dtbody.innerHTML = deletedStudents.map((s, i) => `
    <tr style="opacity:0.7">
      <td>${i + 1}</td>
      <td>${escHtml(s.nom)}</td>
      <td>${escHtml(s.prenom)}</td>
      <td>
        <button class="btn-tiny" onclick="restaurer('${s.id}')">Restaurer</button>
        <button class="btn-tiny danger" onclick="supprimerPermanent('${s.id}')">✕</button>
      </td>
    </tr>
  `).join("");
}

function retirer(id) {
  const idx = currentStudents.findIndex(s => s.id === id);
  if (idx === -1) return;
  deletedStudents.push(currentStudents.splice(idx, 1)[0]);
  renderTable();
}

function restaurer(id) {
  const idx = deletedStudents.findIndex(s => s.id === id);
  if (idx === -1) return;
  currentStudents.push(deletedStudents.splice(idx, 1)[0]);
  renderTable();
}

let editingId = null;

function editStudent(id) {
  const s = currentStudents.find(x => x.id === id) || deletedStudents.find(x => x.id === id);
  if (!s) return;
  editingId = id;
  document.getElementById("editNom").value = s.nom || "";
  document.getElementById("editPrenom").value = s.prenom || "";
  document.getElementById("editWhatsapp").value = s.telephone_whatsapp || "";
  document.getElementById("editAppel").value = s.telephone_appel || "";
  document.getElementById("editAdresse").value = s.adresse || "";
  document.getElementById("editContactNom").value = s.contact_nom || "";
  document.getElementById("editContactLien").value = s.contact_lien || "";
  document.getElementById("editContactTel").value = s.contact_telephone || "";
  document.getElementById("editMsg").style.display = "none";
  document.getElementById("editModal").style.display = "block";
}

function formatTel(el) {
  el.addEventListener("input", () => {
    let v = el.value.replace(/[^\d+]/g, "");
    if (v.startsWith("509")) v = "+" + v;
    if (!v.startsWith("+509") && v.length > 0) v = "+509 " + v.replace(/^\+509\s*/, "");
    const d = v.replace(/^\+509\s*/, "").replace(/\D/g, "").slice(0, 8);
    let f = "+509";
    if (d.length > 0) f += " " + d.slice(0, 2);
    if (d.length > 2) f += " " + d.slice(2, 4);
    if (d.length > 4) f += " " + d.slice(4, 8);
    el.value = f;
  });
}
formatTel(document.getElementById("editWhatsapp"));
formatTel(document.getElementById("editAppel"));
formatTel(document.getElementById("editContactTel"));

function closeEditModal() {
  document.getElementById("editModal").style.display = "none";
  editingId = null;
}

document.getElementById("editForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("editMsg");
  msg.style.display = "none";
  const body = {
    nom: document.getElementById("editNom").value.trim(),
    prenom: document.getElementById("editPrenom").value.trim(),
    telephone_whatsapp: document.getElementById("editWhatsapp").value.trim(),
    telephone_appel: document.getElementById("editAppel").value.trim(),
    adresse: document.getElementById("editAdresse").value.trim(),
    contact_nom: document.getElementById("editContactNom").value.trim(),
    contact_lien: document.getElementById("editContactLien").value.trim(),
    contact_telephone: document.getElementById("editContactTel").value.trim(),
  };
  try {
    const res = await fetch("/api/students/" + editingId, {
      method: "PUT",
      headers: { "Authorization": token, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) { const d = await res.json(); msg.textContent = d.error; msg.className = "message error"; msg.style.display = "block"; return; }
    closeEditModal();
    await loadStudents();
  } catch(e) { msg.textContent = "Erreur réseau"; msg.className = "message error"; msg.style.display = "block"; }
});

async function supprimerPermanent(id) {
  const res = await fetch("/api/students/" + id, { method: "DELETE", headers: { "Authorization": token } });
  if (!res.ok) { alert("Erreur lors de la suppression"); return; }
  deletedStudents = deletedStudents.filter(s => s.id !== id);
  renderTable();
}

async function viderClasseDepuisEleves() {
  const sel = document.getElementById("classeFilter");
  if (sel && sel.value) { await viderClasse(sel.value); return; }
  const classesAvecEleves = {};
  for (const s of currentStudents) {
    if (s.classe_id) classesAvecEleves[s.classe_id] = (classesAvecEleves[s.classe_id] || 0) + 1;
  }
  const ids = Object.keys(classesAvecEleves);
  if (ids.length === 1) { await viderClasse(ids[0]); return; }
  if (ids.length === 0) { alert("Aucun élève à supprimer"); return; }
  if (confirm("Vider TOUTES les classes (" + ids.length + ") ?")) {
    for (const id of ids) await viderClasse(id);
  }
}

let pendingViderClasseId = null;

function showViderModal(classeId, classeNom) {
  pendingViderClasseId = classeId;
  document.getElementById("viderModalText").textContent = "Vider " + classeNom + " ? Cette action supprime tous les élèves.";
  document.getElementById("viderModal").style.display = "flex";
}

function closeViderModal() {
  document.getElementById("viderModal").style.display = "none";
  pendingViderClasseId = null;
}

document.getElementById("viderConfirmBtn").addEventListener("click", async () => {
  if (!pendingViderClasseId) return;
  const res = await fetch("/api/students/class/" + pendingViderClasseId, { method: "DELETE", headers: { "Authorization": token } });
  closeViderModal();
  if (!res.ok) { alert("Erreur lors du vidage de la classe"); return; }
  loadPromotions();
  loadStudents();
});

async function viderClasse(classeId, classeNom) {
  showViderModal(classeId, classeNom);
}

async function confirmDeleteAll() {
  if (!confirm("Tout supprimer définitivement ? Les élèves retirés seront effacés de la base.")) return;
  for (const s of deletedStudents) {
    const res = await fetch("/api/students/" + s.id, { method: "DELETE", headers: { "Authorization": token } });
    if (!res.ok) { alert("Erreur lors de la suppression de " + s.nom + " " + s.prenom); continue; }
  }
  deletedStudents = [];
  renderTable();
}

// --- Journal (logs) ---
async function loadLogs() {
  const tbody = document.querySelector("#logsTable tbody");
  try {
    const classeId = document.getElementById("logClasseFilter")?.value || "";
    const status = document.getElementById("logStatusFilter")?.value || "";
    let url = "/api/logs?limit=200";
    if (classeId) url += "&classe_id=" + classeId;
    const res = await fetch(url, { headers: { "Authorization": token } });
    let logs = await res.json();
    if (status === "success") logs = logs.filter(l => l.success);
    if (status === "rejected") logs = logs.filter(l => !l.success);
    document.getElementById("logCount").textContent = logs.length + " entrées";
    tbody.innerHTML = logs.map(l => `
      <tr style="${l.success ? "" : "background:rgba(255,0,0,0.05)"}">
        <td style="white-space:nowrap;font-size:12px">${new Date(l.created_at).toLocaleString("fr-FR")}</td>
        <td>${escHtml(l.student_nom || "")}</td>
        <td>${escHtml(l.student_prenom || "")}</td>
        <td>${l.success ? "✅" : "❌"}</td>
        <td style="font-size:12px;color:var(--text-secondary)">${escHtml(l.reject_reason || "")}</td>
        <td style="font-size:12px">${escHtml(l.ip_address || "")}</td>
        <td style="font-size:11px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escHtml(l.user_agent || "")}">${escHtml((l.user_agent || "").slice(0, 40))}</td>
        <td style="font-size:12px">${escHtml(l.screen_resolution || "")}</td>
        <td style="font-size:12px">${escHtml(l.language || "")}</td>
        <td style="font-size:12px">${escHtml(l.timezone || "")}</td>
        <td style="font-size:12px">${escHtml(l.platform || "")}</td>
        <td style="font-size:12px">${escHtml(l.device_type || "")}</td>
        <td style="font-size:11px;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escHtml(l.page_url || "")}">${escHtml((l.page_url || "").slice(0, 30))}</td>
        <td style="font-size:11px;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escHtml(l.referrer || "")}">${escHtml((l.referrer || "").slice(0, 30))}</td>
      </tr>
    `).join("");
  } catch(e) { tbody.innerHTML = "<tr><td colspan='14'>Erreur chargement</td></tr>"; }
}

async function populateLogClasseFilter() {
  const sel = document.getElementById("logClasseFilter");
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

function buildExportUrl(base) {
  const params = new URLSearchParams();
  const classeId = document.getElementById("classeFilter")?.value || "";
  if (classeId) params.set("classe_id", classeId);
  return base + "?" + params.toString();
}

async function exportWord() {
  if (!token) return;
  const ind = document.getElementById("loadingIndicator");
  ind.style.display = "inline";
  try {
    const res = await fetch(buildExportUrl("/api/exports/word"), { headers: { "Authorization": token } });
    if (!res.ok) { alert("Erreur d'export"); return; }
    downloadBlob(await res.blob(), "fiche_renseignements_ENAM" + getExportSuffix() + ".docx");
  } finally { ind.style.display = "none"; }
}

async function exportExcel() {
  if (!token) return;
  const ind = document.getElementById("loadingIndicator");
  ind.style.display = "inline";
  try {
    const res = await fetch(buildExportUrl("/api/exports/excel"), { headers: { "Authorization": token } });
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

// --- Pré-inscrits ---
async function loadPreEnrolled() {
  const tbody = document.querySelector("#preTable tbody");
  try {
    await populatePreClasseFilter();
    const classeId = document.getElementById("preClasseFilter")?.value || "";
    const url = "/api/admin/pre-enrolled" + (classeId ? "?classe_id=" + classeId : "");
    const res = await fetch(url, { headers: { "Authorization": token } });
    const data = await res.json();
    document.getElementById("preCount").textContent = data.length + " pré-inscrits";
    tbody.innerHTML = data.map(p => `
      <tr>
        <td>${p.no}</td>
        <td>${escHtml(p.nom)}</td>
        <td>${escHtml(p.prenom)}</td>
        <td>${p.registered
          ? '<span style="color:var(--success-text);font-weight:600">✓ Inscrit</span>'
          : '<span style="color:var(--text-secondary)">—</span>'
        }</td>
        <td style="white-space:nowrap">
          <button class="btn-tiny" onclick="togglePreRegistered('${p.id}', ${!p.registered})">
            ${p.registered ? "Marquer non-inscrit" : "Marquer inscrit"}
          </button>
          <button class="btn-tiny danger" onclick="deletePreEnrolled('${p.id}', '${escHtml(p.nom)} ${escHtml(p.prenom)}')">✕</button>
        </td>
      </tr>
    `).join("");
  } catch(e) {
    tbody.innerHTML = "<tr><td colspan='5'>Erreur chargement</td></tr>";
  }
}

async function populatePreClasseFilter() {
  const sel = document.getElementById("preClasseFilter");
  if (!sel) return;
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

async function togglePreRegistered(id, registered) {
  try {
    await fetch("/api/admin/pre-enrolled/" + id, {
      method: "PUT",
      headers: { "Authorization": token, "Content-Type": "application/json" },
      body: JSON.stringify({ registered })
    });
    loadPreEnrolled();
  } catch(e) { alert("Erreur"); }
}

async function deletePreEnrolled(id, name) {
  if (!confirm("Supprimer " + name + " de la liste des pré-inscrits ?")) return;
  try {
    await fetch("/api/admin/pre-enrolled/" + id, {
      method: "DELETE",
      headers: { "Authorization": token }
    });
    loadPreEnrolled();
  } catch(e) { alert("Erreur"); }
}

window.addEventListener("click", e => {
  const promoM = document.getElementById("promoModal");
  if (e.target === promoM) closeModal();
  const viderM = document.getElementById("viderModal");
  if (e.target === viderM) closeViderModal();
});
