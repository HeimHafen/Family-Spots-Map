// js/sw-register.js

(() => {
  if (!("serviceWorker" in navigator)) return;

  // Prevent reload loops across controllerchange
  const RELOAD_GUARD_KEY = "fsm_sw_reloaded";

  function safeReloadOnce() {
    try {
      if (sessionStorage.getItem(RELOAD_GUARD_KEY) === "1") return;
      sessionStorage.setItem(RELOAD_GUARD_KEY, "1");
    } catch {
      // If sessionStorage is not available, still attempt a single reload
    }
    window.location.reload();
  }

  function sendSkipWaiting(sw) {
    try {
      sw && sw.postMessage && sw.postMessage({ type: "SKIP_WAITING" });
    } catch {
      // ignore
    }
  }

  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("service-worker.js", {
        // Critical on iOS/Safari: do not use cached SW script when checking updates
        updateViaCache: "none",
      });

      // If there is already a waiting SW (update downloaded previously), activate it now
      if (reg.waiting) {
        sendSkipWaiting(reg.waiting);
      }

      // When a new SW is found, activate ASAP once installed
      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;

        sw.addEventListener("statechange", () => {
          // installed + existing controller => it's an update, not first install
          if (sw.state === "installed" && navigator.serviceWorker.controller) {
            sendSkipWaiting(sw);
          }
        });
      });

      // Once the new SW takes control, reload exactly once to ensure fresh CSS/JS
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        safeReloadOnce();
      });

      // Actively check for updates once at startup (helps on iOS)
      if (typeof reg.update === "function") {
        reg.update().catch(() => {});
      }

      // Periodic update checks (iOS often misses update cycles)
      // Keep it conservative to avoid battery/network noise.
      setInterval(() => {
        reg.update && reg.update().catch(() => {});
      }, 60 * 60 * 1000); // every 60 minutes
    } catch (err) {
      console.error("Service Worker registration failed", err);
    }
  });
})();