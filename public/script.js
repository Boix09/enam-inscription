const form = document.getElementById("studentForm");
const submitBtn = document.getElementById("submitBtn");
const msg = document.getElementById("message");
const nomInput = document.getElementById("nom");
const prenomInput = document.getElementById("prenom");
const list = document.getElementById("autocomplete-list");

let selectedPreEnrolled = null;

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
      const res = await fetch("/api/pre-enrolled?q=" + encodeURIComponent(q));
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
