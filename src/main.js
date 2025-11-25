// main.js

// Core State & Storage
import "./app/state.js";
import {
  loadFavoritesFromStorage,
  loadLangFromStorage,
  loadThemeFromStorage,
  loadPlusStateFromStorage
} from "./app/storage.js";

// UI & Features
import { getInitialLang, t } from "./app/i18n.js";
import { initMap } from "./app/map.js";
import { initUI } from "./app/ui.js";
import { TillaCompanion } from "./app/tillaCompanion.js";
import { loadSpots } from "./app/dataLoader.js"; // <-- Wichtig: aktivieren!

/**
 * Initialisiert globale App-Zustände & Features
 */
async function initApp() {
  try {
    // Sprache setzen
    const lang = getInitialLang();
    document.documentElement.lang = lang;
    console.info(`[FSM] Sprache gesetzt auf: ${lang}`);

    // Theme, Favoriten, Plus-Status aus Storage laden
    loadThemeFromStorage();
    loadLangFromStorage();
    loadFavoritesFromStorage();
    loadPlusStateFromStorage();

    // Karten-Komponente starten
    await initMap();

    // UI initialisieren (Filter, Navigation, Details)
    initUI();

    // Optional: Tilla aktivieren
    const tilla = new TillaCompanion({
      getText: (key) => t(key)
    });
    window.tilla = tilla;

    // Spots laden + Filter anwenden
    await loadSpots();

    console.info("[FSM] App vollständig initialisiert 🚀");
  } catch (err) {
    console.error("[FSM] Fehler bei App-Initialisierung:", err);
    alert("Beim Starten der App ist ein Fehler aufgetreten.");
  }
}

// DOM Ready → Init starten
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});