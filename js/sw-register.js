// Family Spots Map – Service Worker Registration (stable)
(function () {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("service-worker.js")
      .then(function (reg) {
        console.info("Service Worker registriert:", reg.scope);
      })
      .catch(function (err) {
        console.warn("Service Worker Registrierung fehlgeschlagen:", err);
      });
  });
})();