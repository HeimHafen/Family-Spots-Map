// js/tilla.js
// Tilla-Hero im Über-Tab (DE/EN) – Bild links, Text rechts

function insertHero(container, lang) {
  if (!container || container.querySelector(".tilla-hero")) return;

  const isDe = (lang || "de").startsWith("de");

  const hero = document.createElement("section");
  hero.className = "tilla-hero";

  hero.innerHTML = `
    <div class="tilla-hero-card">
      <div class="tilla-hero-layout">
        <div class="tilla-hero-image">
          <img
            class="tilla-hero-img"
            src="assets/tilla/tilla-hero.png"
            alt="${
              isDe
                ? "Tilla, die Schildkröte – eure Begleiterin für entspannte Familien-Abenteuer"
                : "Tilla the turtle – your companion for relaxed family adventures"
            }"
          />
        </div>
        <div class="tilla-hero-text-block">
          <h3 class="tilla-hero-title">
            ${isDe ? "Hallo, ich bin Tilla 🐢" : "Hi, I’m Tilla 🐢"}
          </h3>
          <p id="tilla-message-${isDe ? "de" : "en"}" class="tilla-hero-text">
            ${
              isDe
                ? "Hallo, ich bin Tilla – eure Schildkröten-Begleiterin für entspannte Familien-Abenteuer!"
                : "Hi, I’m Tilla – your turtle companion for relaxed family adventures!"
            }
          </p>
        </div>
      </div>
    </div>
 `;

  const firstHeading = container.querySelector("h2");
  if (firstHeading) {
    const parent = firstHeading.parentNode;
    if (firstHeading.nextSibling) {
      parent.insertBefore(hero, firstHeading.nextSibling);
    } else {
      parent.appendChild(hero);
    }
  } else {
    container.insertBefore(hero, container.firstChild);
  }
}

export function initTilla() {
  const aboutDe = document.getElementById("page-about-de");
  const aboutEn = document.getElementById("page-about-en");

  if (aboutDe) insertHero(aboutDe, "de");
  if (aboutEn) insertHero(aboutEn, "en");
}

// aktuell nutzen wir showTillaMessage nur für den Hero-Text;
// Sidebar-Texte kommen aus app.js über i18n
export function showTillaMessage(text) {
  if (!text) return;

  const lang = (document.documentElement.lang || "de").toLowerCase();
  const isDe = lang.startsWith("de");
  const id = isDe ? "tilla-message-de" : "tilla-message-en";

  const el = document.getElementById(id);
  if (el) {
    el.textContent = text;
  }
}