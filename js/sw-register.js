(() => {
  if (!("serviceWorker" in navigator)) return;

  const RELOAD_GUARD_KEY = "fsm_sw_reloaded";

  function safeReloadOnce() {
    try {
      if (sessionStorage.getItem(RELOAD_GUARD_KEY) === "1") return;
      sessionStorage.setItem(RELOAD_GUARD_KEY, "1");
    } catch {}
    window.location.reload();
  }

  function sendSkipWaiting(sw) {
    try {
      sw && sw.postMessage && sw.postMessage({ type: "SKIP_WAITING" });
    } catch {}
  }

  function showUpdateBanner(sw) {
    const banner = document.createElement("div");
    banner.textContent = "Eine neue Version ist verfügbar.";
    banner.style = `
      position:fixed;bottom:0;left:0;right:0;z-index:9999;
      background:#111;color:#fff;text-align:center;
      padding:12px 16px;font-size:15px;
      display:flex;justify-content:center;align-items:center;
    `;
    const btn = document.createElement("button");
    btn.textContent = "Aktualisieren";
    btn.style = `
      margin-left:12px;padding:6px 14px;border:none;
      background:#fff;color:#111;font-weight:600;
      border-radius:6px;cursor:pointer;
    `;
    btn.onclick = () => {
      sendSkipWaiting(sw);
      safeReloadOnce();
    };
    banner.appendChild(btn);
    document.body.appendChild(banner);
  }

  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("service-worker.js", {
        updateViaCache: "none",
      });

      if (reg.waiting) {
        showUpdateBanner(reg.waiting);
      }

      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller) {
            showUpdateBanner(sw);
          }
        });
      });

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        safeReloadOnce();
      });

      reg.update?.().catch(() => {});
      setInterval(() => reg.update?.().catch(() => {}), 60 * 60 * 1000);
    } catch (err) {
      console.error("Service Worker registration failed", err);
    }
  });
})();