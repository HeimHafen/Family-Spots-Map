// js/sw-register.js

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("service-worker.js");

      // Wenn ein neuer SW installiert/gefunden wird: sofort aktivieren
      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;

        sw.addEventListener("statechange", () => {
          // "installed" + es gibt schon einen Controller => Update (nicht Erst-Install)
          if (sw.state === "installed" && navigator.serviceWorker.controller) {
            sw.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });

      // Sobald der neue SW übernimmt: einmal reloaden (damit neue CSS/JS sicher aktiv sind)
      let reloaded = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloaded) return;
        reloaded = true;
        window.location.reload();
      });

      // Optional: beim Start einmal aktiv nach Updates suchen (hilft besonders auf iOS)
      if (reg.update) {
        reg.update().catch(() => {});
      }
    } catch (err) {
      console.error("Service Worker registration failed", err);
    }
  });
}