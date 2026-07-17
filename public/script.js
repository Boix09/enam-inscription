const form = document.getElementById("studentForm");
const submitBtn = document.getElementById("submitBtn");
const msg = document.getElementById("message");

function showMessage(text, type) {
  msg.textContent = text;
  msg.className = "message " + type;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = "Envoi en cours...";
  showMessage("", "");

  const payload = {
    nom: document.getElementById("nom").value.trim(),
    prenom: document.getElementById("prenom").value.trim(),
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
  } catch (err) {
    showMessage("Impossible de contacter le serveur. Verifie ta connexion et reessaie.", "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Envoyer";
  }
});
