const form = document.getElementById("studentForm");
const submitBtn = document.getElementById("submitBtn");
const msg = document.getElementById("message");
const nomInput = document.getElementById("nom");
const prenomInput = document.getElementById("prenom");
const list = document.getElementById("autocomplete-list");

let selectedPreEnrolled = null;
let contexte = null; // { promotion: {nom,...}, classe: {id, nom} }

// Auto-format téléphone +509
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
formatTel(document.getElementById("telephone_whatsapp"));
formatTel(document.getElementById("telephone_appel"));

// Détecter si on est sur une URL slug
async function detecterContexte() {
  const path = window.location.pathname;
  const match = path.match(/\/renseignements\/([^/]+)\/([^/]+)/);
  if (!match) return;

  try {
    const res = await fetch(`/api/context?promo_slug=${encodeURIComponent(match[1])}&classe_slug=${encodeURIComponent(match[2])}`);
    if (!res.ok) return;
    contexte = await res.json();
    const info = document.getElementById("promoInfo");
    info.innerHTML = `<h3>${escHtml(contexte.promotion.nom)} (${contexte.promotion.annee_debut}-${contexte.promotion.annee_fin})<br><span style="font-size:14px;opacity:.8">${escHtml(contexte.classe.nom)}</span></h3>`;
  } catch(_) {}
}

detecterContexte();

function showMessage(text, type) {
  msg.textContent = text;
  msg.className = "message " + type;
}

let acTimeout;
nomInput.addEventListener("input", () => {
  clearTimeout(acTimeout);
  selectedPreEnrolled = null;
  const q = nomInput.value.trim();
  if (q.length < 1) { list.innerHTML = ""; list.style.display = "none"; return; }
  acTimeout = setTimeout(async () => {
    try {
      let url = "/api/pre-enrolled?q=" + encodeURIComponent(q);
      if (contexte) url += "&classe_id=" + encodeURIComponent(contexte.classe.id);
      const res = await fetch(url);
      const data = await res.json();
      list.innerHTML = "";
      if (data.length === 0) { list.style.display = "none"; return; }
      list.style.display = "block";
      data.forEach(p => {
        const div = document.createElement("div");
        div.textContent = p.nom + " " + p.prenom + (p.registered ? " (deja inscrit)" : "");
        if (p.registered) div.style.opacity = "0.5";
        div.addEventListener("click", () => {
          nomInput.value = p.nom;
          prenomInput.value = p.prenom;
          selectedPreEnrolled = p;
          list.innerHTML = "";
          list.style.display = "none";
        });
        list.appendChild(div);
      });
    } catch (_) { list.style.display = "none"; }
  }, 250);
});

document.addEventListener("click", e => {
  if (!e.target.closest(".autocomplete-wrapper")) {
    list.innerHTML = "";
    list.style.display = "none";
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = "Envoi en cours...";
  showMessage("", "");

  const payload = {
    nom: nomInput.value.trim(),
    prenom: prenomInput.value.trim(),
    telephone_whatsapp: document.getElementById("telephone_whatsapp").value.trim(),
    telephone_appel: document.getElementById("telephone_appel").value.trim(),
    adresse: document.getElementById("adresse").value.trim(),
    contact_nom: document.getElementById("contact_nom").value.trim(),
    contact_lien: document.getElementById("contact_lien").value.trim(),
    contact_telephone: document.getElementById("contact_telephone").value.trim(),
  };

  if (contexte) payload.classe_id = contexte.classe.id;

  if (!payload.nom || !payload.prenom) {
    showMessage("Nom et prénom sont obligatoires.", "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Envoyer";
    return;
  }

  if (selectedPreEnrolled && selectedPreEnrolled.registered) {
    showMessage("Cet élève est déjà inscrit.", "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Envoyer";
    return;
  }

  try {
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage(data.error || "Erreur lors de l'envoi.", "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Envoyer";
      return;
    }

    showMessage("Merci, tes informations ont ete enregistrees !", "success");
    form.reset();
    submitBtn.textContent = "Envoye ✓";
    selectedPreEnrolled = null;
  } catch (err) {
    showMessage("Impossible de contacter le serveur. Verifie ta connexion et reessaie.", "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Envoyer";
  }
});

function escHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
