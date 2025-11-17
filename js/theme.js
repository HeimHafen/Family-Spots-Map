const THEMES = ["light", "dark", "warm"];
let currentThemeIndex = 0;

// Lade aus localStorage
const saved = localStorage.getItem("theme");
if (saved && THEMES.includes(saved)) {
  currentThemeIndex = THEMES.indexOf(saved);
  document.documentElement.setAttribute("data-theme", saved);
}

// Theme umschalten
const toggleBtn = document.getElementById("theme-toggle");
if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
    const newTheme = THEMES[currentThemeIndex];
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);
  });

  // Optional: Icon passend ändern
  function updateThemeIcon(theme) {
    toggleBtn.textContent =
      theme === "dark" ? "🌙" : theme === "warm" ? "🌅" : "🌞";
  }

  updateThemeIcon(THEMES[currentThemeIndex]);
}