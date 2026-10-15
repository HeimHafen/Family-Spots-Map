import { readPhoto, readPhotoDraft, writePhotoDraft } from "./personal-storage.js";
import { preparePhoto, MAX_PHOTOS } from "./memory-images.js";

const words = {
  de: {
    add: "Fotos hinzufügen", brief: "Text optional · Fotos nur in diesem Browser.", info: "Hinweise zu Fotos", hint: "Bis zu 3 Fotos · Text ist optional. JPEG, PNG oder WebP, je Bild bis 25 MB. Die App speichert verkleinerte Kopien nur in diesem Browser. Bitte sichere wichtige Erinnerungen regelmäßig.",
    count: n => `${n} von 3 Fotos`, remove: n => `Foto ${n} entfernen`, view: n => `Foto ${n} vergrößern`, image: n => `Foto ${n} dieser Erinnerung`, close: "Schließen", preparing: "Fotos werden vorbereitet …", limit: "Du kannst bis zu drei verschiedene Fotos je Erinnerung hinzufügen.",
    photo_size: "Dieses Bild ist zu groß. Bitte wähle eine Datei bis 25 MB und höchstens 60 Megapixel.", photo_format: "Bitte wähle ein Foto im Format JPEG, PNG oder WebP. HEIC-Bilder bitte vorher als JPEG exportieren.", invalid_photo: "Dieses Bild konnte nicht geöffnet werden. Bitte versuche es mit einem anderen Foto.", missing: "Ein gespeichertes Foto konnte nicht geladen werden. Bitte lade die Seite erneut. Die Erinnerung wurde nicht verändert.", draft: "Die Fotoauswahl bleibt hier erhalten, konnte aber nicht für das Neuladen gesichert werden. Bitte speichere deine Erinnerung vor dem Schließen."
  },
  en: {
    add: "Add photos", brief: "Text optional · Photos stay in this browser.", info: "Photo information", hint: "Up to 3 photos · Text is optional. JPEG, PNG or WebP, up to 25 MB each. The app saves smaller copies only in this browser. Please back up important memories regularly.",
    count: n => `${n} of 3 photos`, remove: n => `Remove photo ${n}`, view: n => `Enlarge photo ${n}`, image: n => `Photo ${n} of this memory`, close: "Close", preparing: "Preparing photos …", limit: "You can add up to three different photos per memory.",
    photo_size: "This image is too large. Please choose a file up to 25 MB and no more than 60 megapixels.", photo_format: "Please choose a JPEG, PNG or WebP photo. Export HEIC images as JPEG first.", invalid_photo: "This image could not be opened. Please try another photo.", missing: "A saved photo could not be loaded. Please reload the page. The memory has not been changed.", draft: "Your selected photos are still here, but could not be saved for a reload. Please save your memory before closing the page."
  },
  da: {
    add: "Tilføj billeder", brief: "Tekst valgfri · Billeder gemmes i denne browser.", info: "Om billeder", hint: "Op til 3 billeder · Tekst er valgfri. JPEG, PNG eller WebP, højst 25 MB pr. billede. Appen gemmer mindre kopier kun i denne browser. Tag jævnligt en sikkerhedskopi af vigtige minder.",
    count: n => `${n} af 3 billeder`, remove: n => `Fjern billede ${n}`, view: n => `Forstør billede ${n}`, image: n => `Billede ${n} fra dette minde`, close: "Luk", preparing: "Billederne klargøres …", limit: "Du kan tilføje op til tre forskellige billeder pr. minde.",
    photo_size: "Billedet er for stort. Vælg en fil på højst 25 MB og højst 60 megapixel.", photo_format: "Vælg et billede i JPEG-, PNG- eller WebP-format. Eksportér først HEIC-billeder som JPEG.", invalid_photo: "Billedet kunne ikke åbnes. Prøv et andet billede.", missing: "Et gemt billede kunne ikke indlæses. Indlæs siden igen. Mindet er ikke ændret.", draft: "Dine valgte billeder er stadig her, men kunne ikke gemmes til næste indlæsning. Gem dit minde, før du lukker siden."
  }
};
export function initDaylogPhotos({ notify, onDirty, isLocked }) {
  const t = () => words[document.documentElement.lang] || words.de;
  const slots = new Map(), blobs = new Map(), mounts = new Map(), galleryURLs = new Set();
  let draftKey, draftStorageAvailable = true, pending = 0, queue = Promise.resolve(), main, dialog, dialogURL, opener;
  const busy = () => pending > 0 || isLocked();
  const changed = () => { document.documentElement.dataset.memoryDraft = String(pending > 0 || [...slots.values()].some(s => s.ids.length)); onDirty?.(); };
  const entrySlot = (key, ids = []) => {
    if (!slots.has(key)) slots.set(key, { ids: ids.slice() });
    return slots.get(key);
  };
  const blobFor = async id => {
    if (blobs.has(id)) return blobs.get(id);
    const blob = await readPhoto(id);
    if ([...slots.values()].some(s => s.ids.includes(id))) blobs.set(id, blob);
    return blob;
  };
  const saveDraft = () => {
    const snapshot = { version: 1, slots: Object.fromEntries([...slots].map(([key, s]) => [key, { ids: s.ids.slice(), media: s.ids.map(id => ({ id, blob: blobs.get(id) })).filter(x => x.blob) }])) };
    queue = queue.catch(() => {}).then(() => { if (!draftKey || !draftStorageAvailable) throw new Error("draft_unavailable"); return writePhotoDraft(draftKey, snapshot); });
    return queue.catch(() => { notify(t().draft); });
  };
  const ready = (async () => {
    try {
      let tab = sessionStorage.getItem("fs_photo_draft_tab");
      if (!tab) { tab = crypto.randomUUID(); sessionStorage.setItem("fs_photo_draft_tab", tab); }
      draftKey = `photo-draft:${tab}`;
      const saved = await readPhotoDraft(draftKey);
      if (saved != null && (saved.version !== 1 || !saved.slots || typeof saved.slots !== "object" || Array.isArray(saved.slots))) throw new Error("bad_photo_draft");
      if (saved?.version === 1 && saved.slots) for (const [key, s] of Object.entries(saved.slots)) {
        if (!Array.isArray(s.ids) || s.ids.length > MAX_PHOTOS || new Set(s.ids).size !== s.ids.length || s.ids.some(id => !/^[a-f0-9]{64}$/.test(id))) throw new Error("bad_photo_draft");
        for (const media of s.media || []) if (media.blob instanceof Blob && s.ids.includes(media.id)) blobs.set(media.id, media.blob);
        slots.set(key, { ids: s.ids.slice() });
      }
    } catch { draftStorageAvailable = false; notify(t().draft); }
    changed();
  })();
  const makeButton = (label, handler, className = "btn-ghost btn-small") => {
    const button = document.createElement("button"); button.type = "button"; button.className = className; button.textContent = label; button.addEventListener("click", handler); return button;
  };
  function closeViewer() { if (dialog?.open) dialog.close(); }
  async function view(id, n, source) {
    try {
      const blob = await blobFor(id);
      if (!source.isConnected) return;
      if (!dialog) {
        dialog = document.createElement("dialog"); dialog.className = "memory-photo-dialog";
        const close = makeButton(t().close, closeViewer, "btn-ghost memory-photo-close");
        const image = document.createElement("img"); dialog.append(close, image); document.body.append(dialog);
        dialog.addEventListener("keydown", event => {
          // The viewer has exactly one interactive control. Keep Tab and
          // Shift+Tab there while native <dialog> handles Escape and inertness.
          if (event.key === "Tab") { event.preventDefault(); close.focus(); }
        });
        dialog.addEventListener("click", e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeViewer(); } });
        dialog.addEventListener("close", () => { if (dialogURL) URL.revokeObjectURL(dialogURL); dialogURL = null; image.removeAttribute("src"); (opener?.isConnected ? opener : document.getElementById("daylog-text"))?.focus({ preventScroll: true }); });
      }
      if (dialogURL) URL.revokeObjectURL(dialogURL);
      dialogURL = URL.createObjectURL(blob); opener = source;
      dialog.querySelector("button").textContent = t().close;
      dialog.querySelector("img").src = dialogURL; dialog.querySelector("img").alt = t().image(n); dialog.setAttribute("aria-label", t().image(n));
      if (!dialog.open) dialog.showModal(); dialog.querySelector("button").focus();
    } catch { notify(t().missing); }
  }
  function thumbnail(id, n, editable, key, owner) {
    const figure = document.createElement("div"); figure.className = "memory-photo-tile";
    const button = makeButton("", () => view(id, n, button), "memory-photo-thumb"); button.setAttribute("aria-label", t().view(n));
    const img = document.createElement("img"); img.alt = t().image(n); img.loading = "lazy"; img.width = 160; img.height = 120; button.append(img); figure.append(button);
    blobFor(id).then(blob => {
      if (!img.isConnected) return;
      const url = URL.createObjectURL(blob); owner.add(url); img.src = url;
    }).catch(() => { if (img.isConnected) { button.textContent = t().missing; button.disabled = true; } });
    if (editable) {
      const remove = makeButton(t().remove(n), async () => {
        if (busy()) return;
        pending++; changed();
        const s = entrySlot(key); s.ids = s.ids.filter(photo => photo !== id);
        try { await saveDraft(); } finally { pending--; changed(); paint(key); mounts.get(key)?.root.querySelector(".memory-photo-add")?.focus({ preventScroll: true }); }
      }, "btn-ghost memory-photo-remove"); remove.disabled = busy(); figure.append(remove);
    }
    return figure;
  }
  function paint(key) {
    const mount = mounts.get(key); if (!mount) return;
    for (const url of mount.urls) URL.revokeObjectURL(url); mount.urls.clear();
    const { root } = mount, s = entrySlot(key);
    const previousHelp = root.querySelector("details");
    const helpOpen = !!previousHelp?.open;
    const helpFocused = previousHelp?.querySelector("summary") === document.activeElement;
    root.replaceChildren();
    const row = document.createElement("div"); row.className = "memory-photo-controls";
    const input = document.createElement("input"); input.type = "file"; input.accept = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"; input.multiple = true; input.hidden = true;
    const add = makeButton(t().add, () => { if (!busy()) input.click(); }, "btn-ghost btn-small memory-photo-add"); add.disabled = busy() || s.ids.length >= MAX_PHOTOS;
    const count = document.createElement("span"); count.className = "filter-group-helper"; count.textContent = pending ? t().preparing : t().count(s.ids.length); count.setAttribute("role", "status");
    row.append(add, count, input); root.append(row);
    if (key === "new") {
      const brief = document.createElement("p"); brief.className = "filter-group-helper memory-photo-hint";
      brief.id = "memory-photo-hint"; brief.textContent = t().brief; add.setAttribute("aria-describedby", brief.id);
      const help = document.createElement("details"); help.className = "memory-help"; help.open = helpOpen;
      const summary = document.createElement("summary"); summary.textContent = t().info;
      const hint = document.createElement("p"); hint.className = "filter-group-helper"; hint.textContent = t().hint;
      help.append(summary, hint); root.append(brief, help);
      if (helpFocused) summary.focus({ preventScroll: true });
    }
    const grid = document.createElement("div"); grid.className = "memory-photo-grid";
    s.ids.forEach((id, i) => grid.append(thumbnail(id, i + 1, true, key, mount.urls))); root.append(grid);
    input.addEventListener("cancel", () => add.focus({ preventScroll: true }));
    input.addEventListener("change", async () => {
      const files = [...(input.files || [])]; if (!files.length || busy()) return;
      if (files.length + s.ids.length > MAX_PHOTOS) { notify(t().limit); input.value = ""; add.focus(); return; }
      pending++; changed(); paint(key);
      try {
        // Prepare the entire selection first; a bad file never partly adds a batch.
        const prepared = [];
        for (const file of files) prepared.push(await preparePhoto(file));
        const unique = prepared.filter((m, i) => !s.ids.includes(m.id) && prepared.findIndex(x => x.id === m.id) === i);
        if (unique.length !== prepared.length) notify(t().limit);
        for (const media of unique) { blobs.set(media.id, media.blob); s.ids.push(media.id); }
        await saveDraft();
      } catch (error) { notify(t()[error.code] || t().invalid_photo); }
      finally { pending--; changed(); paint(key); const next = mounts.get(key)?.root.querySelector(".memory-photo-add"); if (next && !next.disabled) next.focus({ preventScroll: true }); }
    });
  }
  function mountEditor(key, host, ids = []) {
    const first = !slots.has(key);
    entrySlot(key, ids);
    const prior = mounts.get(key); if (prior) for (const url of prior.urls) URL.revokeObjectURL(url);
    const root = document.createElement("div"); root.className = "memory-photo-editor"; root.dataset.photoSlot = key; host.append(root);
    mounts.set(key, { root, urls: new Set() }); paint(key);
    // Keep the original photos with an edit draft too, even if another tab
    // later deletes the saved memory. Its conflict copy can still be saved.
    if (first && key !== "new" && ids.length) {
      pending++; changed(); paint(key);
      Promise.all(ids.map(blobFor)).then(saveDraft).catch(() => notify(t().missing)).finally(() => { pending--; changed(); paint(key); });
    }
    return root;
  }
  const api = {
    ready,
    ids: key => (slots.get(key)?.ids || []).slice(),
    hasDraft: () => pending > 0 || [...slots.values()].some(s => s.ids.length > 0),
    isBusy: () => pending > 0,
    restoredEdits: () => [...slots.keys()].filter(key => key.startsWith("entry:")).map(key => key.slice(6)),
    hasNew: () => !!slots.get("new")?.ids.length,
    mountMain(host) { main = mountEditor("new", host); },
    mountEditor,
    beginRender() { for (const url of galleryURLs) URL.revokeObjectURL(url); galleryURLs.clear(); for (const [key, m] of mounts) if (key !== "new") { for (const url of m.urls) URL.revokeObjectURL(url); mounts.delete(key); } },
    gallery(ids, host) { if (!ids?.length) return; const grid = document.createElement("div"); grid.className = "memory-photo-grid memory-photo-gallery"; grid.dataset.count = String(ids.length); host.append(grid); ids.forEach((id, i) => grid.append(thumbnail(id, i + 1, false, null, galleryURLs))); },
    async operation(key) {
      if (pending) throw new Error("photos_busy");
      pending++; changed();
      try {
        const ids = entrySlot(key).ids.slice(), media = [];
        for (const id of ids) media.push({ id, blob: await blobFor(id) });
        return { photos: ids, media, photoDraftKey: draftStorageAvailable ? draftKey : null, photoDraftSlot: key };
      } catch (error) { notify(t().missing); throw error; }
      finally { pending--; changed(); }
    },
    async clear(key) {
      pending++; changed();
      try {
        slots.delete(key); if (key === "new") entrySlot("new");
        await saveDraft();
        const retained = new Set([...slots.values()].flatMap(s => s.ids));
        for (const id of blobs.keys()) if (!retained.has(id)) blobs.delete(id);
      } finally { pending--; changed(); if (key === "new") paint("new"); }
    },
    refresh() { for (const key of mounts.keys()) paint(key); if (dialog?.open) dialog.querySelector("button").textContent = t().close; changed(); }
  };
  new MutationObserver(() => api.refresh()).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  window.addEventListener("beforeunload", e => { if (pending || api.hasDraft()) { e.preventDefault(); e.returnValue = ""; } });
  return api;
}
