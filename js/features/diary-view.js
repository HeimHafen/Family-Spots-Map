// Presentation only: memory records, photo blobs and backup formats stay unchanged.
export function initDiaryView({ router, hasNewDraft }) {
  const view = document.getElementById("view-diary");
  const composer = document.getElementById("diary-composer");
  const create = document.getElementById("diary-new-memory");
  const input = document.getElementById("daylog-text");
  const empty = document.getElementById("diary-empty");
  if (!view || !composer || !create || !input) return null;
  const translate = () => {
    const l = document.documentElement.lang;
    const copy = l === "en" ? ["Diary", "Capture a memory"] : l === "da" ? ["Dagbog", "Gem et minde"] : ["Tagebuch", "Erinnerung festhalten"];
    view.querySelector("nav")?.setAttribute("aria-label", copy[0]);
    composer.setAttribute("aria-label", copy[1]);
  };
  translate();
  new MutationObserver(translate).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  const openComposer = (focus = true) => {
    composer.hidden = false;
    create.setAttribute("aria-expanded", "true");
    if (focus) input.focus();
  };
  const closeComposer = () => {
    // Closing changes visibility only; unfinished text/photos remain recoverable.
    composer.hidden = true;
    create.setAttribute("aria-expanded", "false");
    create.focus({ preventScroll: true });
  };
  create.addEventListener("click", () => composer.hidden ? openComposer() : input.focus());
  document.getElementById("diary-composer-close")?.addEventListener("click", closeComposer);
  return {
    refresh(count) { empty.hidden = count > 0; },
    restoreDrafts(hasEdits) {
      if (hasNewDraft()) openComposer(false);
      if (hasEdits || hasNewDraft()) router.switchRoute("diary", { replace: true });
    },
    afterSave(id, returnFocus) {
      if (!hasNewDraft()) { composer.hidden = true; create.setAttribute("aria-expanded", "false"); }
      if (returnFocus && (document.activeElement === document.body || document.activeElement?.id === "daylog-save")) {
        const entry = [...view.querySelectorAll(".daylog-entry")].find(e => e.dataset.entryId === id);
        (entry?.querySelector("[data-daylog-action=edit]") || create).focus({ preventScroll: false });
      }
    }
  };
}
