let token = "";
let restoreData = null;

// --- Login ---
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  token = document.getElementById("passwordInput").value.trim();
  document.getElementById("loginError").style.display = "none";

  try {
    const res = await fetch("/api/superadmin/feature-flags", {
      headers: { "Authorization": token }
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      document.getElementById("loginError").textContent = d.error || "Mot de passe incorrect";
      document.getElementById("loginError").style.display = "block";
      token = "";
      return;
    }
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("saSection").style.display = "block";
    loadFlags();
    loadSALogs();
  } catch (err) {
    document.getElementById("loginError").textContent = "Erreur de connexion au serveur";
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
    if (btn.dataset.tab === "flags") loadFlags();
    if (btn.dataset.tab === "backup") { /* nothing to auto-load */ }
    if (btn.dataset.tab === "logs") loadSALogs();
  });
});

// --- Feature Flags ---
async function loadFlags() {
  const div = document.getElementById("flagsList");
  try {
    const res = await fetch("/api/superadmin/feature-flags", {
      headers: { "Authorization": token }
    });
    const flags = await res.json();
    div.innerHTML = flags.map(f => `
      <div class="flag-row">
        <div class="flag-info">
          <strong>${escHtml(f.label)}</strong>
          <small>${escHtml(f.description || "")}</small>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${f.enabled ? "checked" : ""} onchange="toggleFlag('${f.key}', this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
    `).join("");

    // Show banner config if enabled
    const bannerFlag = flags.find(f => f.key === "banniere_annonce");
    if (bannerFlag && bannerFlag.enabled) {
      document.getElementById("bannerConfig").style.display = "block";
      loadBanner();
    } else {
      document.getElementById("bannerConfig").style.display = "none";
    }
  } catch (e) {
    div.innerHTML = '<p style="color:var(--error-text)">Erreur de chargement</p>';
  }
}

async function toggleFlag(key, enabled) {
  const msg = document.getElementById("flagMsg");
  msg.style.display = "none";
  try {
    const res = await fetch("/api/superadmin/feature-flags/" + key, {
      method: "PUT",
      headers: { "Authorization": token, "Content-Type": "application/json" },
      body: JSON.stringify({ enabled })
    });
    if (res.ok) {
      msg.textContent = `"${key}" ${enabled ? "activé" : "désactivé"} ✓`;
      msg.className = "message success";
      // Show/hide banner config
      if (key === "banniere_annonce") {
        document.getElementById("bannerConfig").style.display = enabled ? "block" : "none";
        if (enabled) loadBanner();
      }
    } else {
      const d = await res.json();
      msg.textContent = d.error || "Erreur";
      msg.className = "message error";
      loadFlags();
    }
  } catch (e) {
    msg.textContent = "Erreur réseau";
    msg.className = "message error";
    loadFlags();
  }
  msg.style.display = "block";
  setTimeout(() => { msg.style.display = "none"; }, 3000);
}

// --- Banner ---
async function loadBanner() {
  try {
    const res = await fetch("/api/settings/banner");
    const d = await res.json();
    document.getElementById("bannerMessage").value = d.message || "";
  } catch(e) {}
}

async function saveBanner() {
  const msg = document.getElementById("bannerMsg");
  const message = document.getElementById("bannerMessage").value.trim();
  try {
    const res = await fetch("/api/settings/banner", {
      method: "PUT",
      headers: { "Authorization": token, "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    if (res.ok) {
      msg.textContent = "Bannière sauvegardée ✓";
      msg.style.color = "var(--success-text)";
    } else {
      const d = await res.json();
      msg.textContent = d.error || "Erreur";
      msg.style.color = "var(--error-text)";
    }
  } catch(e) {
    msg.textContent = "Erreur réseau";
    msg.style.color = "var(--error-text)";
  }
}

async function clearBanner() {
  document.getElementById("bannerMessage").value = "";
  await saveBanner();
  document.getElementById("bannerMsg").textContent = "Bannière effacée";
}

// --- Backup ---
async function exportBackup() {
  const btn = document.getElementById("exportBtn");
  const msg = document.getElementById("backupMsg");
  msg.style.display = "none";
  btn.disabled = true;
  btn.textContent = "Export en cours...";
  try {
    const res = await fetch("/api/superadmin/backup", {
      headers: { "Authorization": token }
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `enam_backup_${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    msg.textContent = `Sauvegarde exportée (${(blob.size / 1024).toFixed(1)} Ko) ✓`;
    msg.className = "message success";
    msg.style.display = "block";
  } catch (e) {
    msg.textContent = "Erreur : " + e.message;
    msg.className = "message error";
    msg.style.display = "block";
  } finally {
    btn.disabled = false;
    btn.textContent = "📥 Télécharger la sauvegarde";
  }
}

// --- Restore ---
document.getElementById("restoreFile").addEventListener("change", function(e) {
  const file = e.target.files[0];
  const btn = document.getElementById("restoreBtn");
  if (!file) { btn.disabled = true; return; }

  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      restoreData = JSON.parse(ev.target.result);
      if (!restoreData.version) {
        alert("Fichier invalide : version manquante");
        restoreData = null;
        btn.disabled = true;
        return;
      }
      btn.disabled = false;
    } catch (err) {
      alert("Fichier JSON invalide");
      restoreData = null;
      btn.disabled = true;
    }
  };
  reader.readAsText(file);
});

function showRestoreConfirm() {
  if (!restoreData) { alert("Charge d'abord un fichier de sauvegarde"); return; }

  const counts = [];
  if (restoreData.promotions?.length) counts.push(`${restoreData.promotions.length} promotions`);
  if (restoreData.classes?.length) counts.push(`${restoreData.classes.length} classes`);
  if (restoreData.students?.length) counts.push(`${restoreData.students.length} élèves`);
  if (restoreData.pre_enrolled?.length) counts.push(`${restoreData.pre_enrolled.length} pré-inscrits`);
  if (restoreData.submission_logs?.length) counts.push(`${restoreData.submission_logs.length} logs`);
  if (restoreData.settings?.length) counts.push(`${restoreData.settings.length} paramètres`);

  document.getElementById("restorePreview").textContent =
    `Ce fichier contient : ${counts.join(", ")}. Exporté le ${new Date(restoreData.exported_at).toLocaleString("fr-FR")}.`;
  document.getElementById("restoreArea").style.display = "block";
}

function cancelRestore() {
  document.getElementById("restoreArea").style.display = "none";
  document.getElementById("restoreFile").value = "";
  document.getElementById("restoreBtn").disabled = true;
  restoreData = null;
}

async function confirmRestore() {
  if (!restoreData) return;
  if (!confirm("Cette action va REMPLACER toutes les données existantes. Es-tu sûr ?")) return;

  const btn = document.getElementById("confirmRestoreBtn");
  const msg = document.getElementById("backupMsg");
  msg.style.display = "none";
  btn.disabled = true;
  btn.textContent = "Restauration en cours...";

  try {
    const res = await fetch("/api/superadmin/restore", {
      method: "POST",
      headers: { "Authorization": token, "Content-Type": "application/json" },
      body: JSON.stringify(restoreData)
    });
    const d = await res.json();
    if (d.success) {
      msg.textContent = d.message + " ✓";
      msg.className = "message success";
      cancelRestore();
    } else {
      msg.textContent = d.message + " — " + (d.errors || []).join("; ");
      msg.className = "message error";
    }
  } catch (e) {
    msg.textContent = "Erreur réseau : " + e.message;
    msg.className = "message error";
  }
  msg.style.display = "block";
  btn.disabled = false;
  btn.textContent = "Confirmer la restauration";
}

// --- Super Admin Logs ---
async function loadSALogs() {
  const div = document.getElementById("saLogsList");
  try {
    const res = await fetch("/api/superadmin/logs", {
      headers: { "Authorization": token }
    });
    const logs = await res.json();
    if (!logs.length) {
      div.innerHTML = '<p style="font-size:13px;color:var(--text-secondary)">Aucune action enregistrée pour le moment.</p>';
      return;
    }
    div.innerHTML = logs.map(l => `
      <div class="log-entry">
        <span class="log-date">${new Date(l.created_at).toLocaleString("fr-FR")}</span>
        &mdash; ${escHtml(l.action)}
        ${l.ip_address ? `<span style="font-size:11px;color:var(--text-tertiary)">[${escHtml(l.ip_address)}]</span>` : ""}
      </div>
    `).join("");
  } catch (e) {
    div.innerHTML = '<p style="color:var(--error-text)">Erreur de chargement</p>';
  }
}

function escHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
