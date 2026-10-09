// Offline registration and explicit updates; preserves unsaved memories.
(() => {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
  let registration, waitingWorker, banner, message, updateButton, laterButton;
  let requestedUpdate = false;
  let reloaded = false;
  const copy = {
    de: ["Eine neue Version ist bereit.", "Aktualisieren", "Später", "Bitte speichere deinen Text vor dem Aktualisieren."],
    en: ["A new version is ready.", "Update", "Later", "Please save your text before updating."],
    da: ["En ny version er klar.", "Opdater", "Senere", "Gem venligst din tekst før opdatering."]
  };
  let blockedByDraft = false;
  function translate() {
    if (!banner) return;
    const texts = copy[document.documentElement.lang] || copy.de;
    message.textContent = texts[blockedByDraft ? 3 : 0];
    updateButton.textContent = texts[1];
    laterButton.textContent = texts[2];
  }
  function hasDraft() {
    return [...document.querySelectorAll("#daylog-text, .daylog-entry-input")].some(el => el.value.trim());
  }
  function showUpdate(worker) {
    waitingWorker = worker;
    if (banner) { banner.hidden = false; banner.style.display = "flex"; translate(); return; }
    banner = document.createElement("div");
    banner.className = "fsm-update-banner";
    banner.setAttribute("role", "status");
    banner.style.cssText = "position:relative;z-index:10000;padding:12px 16px;padding-bottom:max(12px,env(safe-area-inset-bottom));background:var(--card-bg,#fff7ee);color:var(--text-color,#452213);box-shadow:0 -3px 16px #0002;display:flex;gap:10px;align-items:center;flex-wrap:wrap;font:inherit;font-size:14px";
    message = document.createElement("span");
    message.style.flex = "1 1 180px";
    updateButton = document.createElement("button");
    updateButton.type = "button";
    updateButton.className = "btn btn-small";
    laterButton = document.createElement("button");
    laterButton.type = "button";
    laterButton.className = "btn-ghost btn-small";
    updateButton.addEventListener("click", () => {
      if (hasDraft()) { blockedByDraft = true; translate(); return; }
      blockedByDraft = false;
      requestedUpdate = true;
      updateButton.disabled = true;
      waitingWorker?.postMessage({type:"SKIP_WAITING"});
    });
    laterButton.addEventListener("click", () => { banner.hidden = true; banner.style.display = "none"; });
    banner.append(message, updateButton, laterButton);
    document.body.prepend(banner);
    translate();
    new MutationObserver(translate).observe(document.documentElement, {attributes:true,attributeFilter:["lang"]});
  }
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // First installation and changes in another tab never reload this page.
    if (!requestedUpdate || reloaded) return;
    if (hasDraft()) { requestedUpdate = false; updateButton.disabled = false; blockedByDraft = true; translate(); return; }
    reloaded = true;
    window.location.reload();
  });
  async function start() {
    try {
      registration = await navigator.serviceWorker.register("./service-worker.js", {updateViaCache:"none"});
      if (registration.waiting) showUpdate(registration.waiting);
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) showUpdate(worker);
        });
      });
      const check = () => { if (navigator.onLine) registration.update().catch(() => {}); };
      window.addEventListener("online", check);
      document.addEventListener("visibilitychange", () => { if (!document.hidden) check(); });
      setInterval(check, 60 * 60 * 1000);
      check();
    } catch (error) { console.warn("[Family Spots] Offline preparation failed:", error); }
  }
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, {once:true});
})();
