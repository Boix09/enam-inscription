// Shared features: dark mode, banner, etc.
(async function() {
  try {
    const res = await fetch("/api/feature-flags");
    const flags = await res.json();
    const enabled = {};
    flags.forEach(f => { enabled[f.key] = f.enabled; });

    // --- Dark Mode ---
    const toggle = document.getElementById("darkModeToggle");
    if (enabled.mode_sombre && toggle) {
      const saved = localStorage.getItem("darkMode");
      const html = document.documentElement;

      if (saved === "dark") { html.classList.add("dark-mode"); html.classList.remove("light-mode"); }
      else if (saved === "light") { html.classList.add("light-mode"); html.classList.remove("dark-mode"); }
      else { html.classList.remove("dark-mode", "light-mode"); }

      toggle.style.display = "inline-block";
      toggle.onclick = () => {
        const isDark = html.classList.contains("dark-mode");
        const isLight = html.classList.contains("light-mode");
        if (isDark) {
          html.classList.remove("dark-mode");
          html.classList.add("light-mode");
          localStorage.setItem("darkMode", "light");
        } else if (isLight) {
          html.classList.remove("light-mode");
          localStorage.setItem("darkMode", "system");
        } else {
          html.classList.add("dark-mode");
          localStorage.setItem("darkMode", "dark");
        }
        updateToggleIcon();
      };
      function updateToggleIcon() {
        if (html.classList.contains("dark-mode")) toggle.textContent = "🌙";
        else toggle.textContent = "☀️";
      }
      updateToggleIcon();
    }

    // --- Banner ---
    if (enabled.banniere_annonce) {
      const bannerEl = document.getElementById("siteBanner");
      if (bannerEl) {
        try {
          const br = await fetch("/api/settings/banner");
          const bd = await br.json();
          if (bd.message) {
            bannerEl.textContent = bd.message;
            bannerEl.style.display = "block";
          }
        } catch(e) { /* ignore */ }
      }
    }
  } catch(e) { console.error("Features init error:", e); }
})();
