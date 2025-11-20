// js/tilla.js
// Kleine Helferin für Tilla im "Über"-Tab

export function initTilla() {
  const aboutDe = document.getElementById("page-about-de");
  const aboutEn = document.getElementById("page-about-en");

  // Deutsche Version
  if (aboutDe && !aboutDe.querySelector(".tilla-hero")) {
    const heroDe = document.createElement("section");
    heroDe.className = "tilla-hero";

    heroDe.innerHTML = `
      <div class="tilla-hero-illustration" aria-hidden="true"></div>
      <div class="tilla-hero-copy">
        <h2 class="tilla-hero-title">Hallo, ich bin Tilla 🐢</h2>
        <p id="tilla-message-de" class="tilla-hero-message">
          Hallo, ich bin Tilla – eure Schildkröten-Begleiterin für entspannte Familien-Abenteuer!
        </p>
      </div>
    `;

    aboutDe.insertBefore(heroDe, aboutDe.firstChild);
  }

  // Englische Version
  if (aboutEn && !aboutEn.querySelector(".tilla-hero")) {
    const heroEn = document.createElement("section");
    heroEn.className = "tilla-hero";

    heroEn.innerHTML = `
      <div class="tilla-hero-illustration" aria-hidden="true"></div>
      <div class="tilla-hero-copy">
        <h2 class="tilla-hero-title">Hi, I’m Tilla 🐢</h2>
        <p id="tilla-message-en" class="tilla-hero-message">
          Hi, I’m Tilla – your turtle companion for relaxed family adventures!
        </p>
      </div>
    `;

    aboutEn.insertBefore(heroEn, aboutEn.firstChild);
  }
}

// Wird aus app.js aufgerufen, wenn sich die Sprache ändert.
// Der Text (Deutsch/Englisch) wird von app.js übergeben.
export function showTillaMessage(text) {
  const msgDe = document.getElementById("tilla-message-de");
  const msgEn = document.getElementById("tilla-message-en");
  if (msgDe) msgDe.textContent = text;
  if (msgEn) msgEn.textContent = text;
}