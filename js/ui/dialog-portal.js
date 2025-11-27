// Family Spots Map — Dialog Portal & Z-Index Fix (stable)

(function () {
  function portalizeDialogs() {
    var dialogs = document.querySelectorAll('[role="dialog"]');
    for (var i = 0; i < dialogs.length; i++) {
      var el = dialogs[i];
      if (el.parentElement !== document.body) {
        document.body.appendChild(el); // an Body-Ende verschieben
      }
    }
    ensureBackdrop();
    updateBodyLock();
  }

  function ensureBackdrop() {
    var backdrop = document.getElementById('dialog-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'dialog-backdrop';
      document.body.appendChild(backdrop);
    }
    backdrop.addEventListener('click', function () {
      // sichtbare Dialoge schließen, wenn erlaubt
      var open = visibleDialogs();
      for (var i = 0; i < open.length; i++) {
        if (open[i].getAttribute('data-backdrop-close') === 'true') {
          open[i].setAttribute('hidden', '');
        }
      }
      updateBodyLock();
    });
  }

  function visibleDialogs() {
    var out = [];
    var dialogs = document.querySelectorAll('[role="dialog"]');
    for (var i = 0; i < dialogs.length; i++) {
      var el = dialogs[i];
      if (!el.hasAttribute('hidden') && el.style.display !== 'none') {
        out.push(el);
      }
    }
    return out;
  }

  function updateBodyLock() {
    var backdrop = document.getElementById('dialog-backdrop');
    var anyOpen = visibleDialogs().length > 0;
    if (anyOpen) {
      document.body.classList.add('body--dialog-open');
      if (backdrop) backdrop.classList.add('is-visible');
    } else {
      document.body.classList.remove('body--dialog-open');
      if (backdrop) backdrop.classList.remove('is-visible');
    }
  }

  // Änderungen beobachten (hidden/style/class) -> Body-Lock & Backdrop aktualisieren
  function observeMutations() {
    var observer = new MutationObserver(function () { updateBodyLock(); });
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['hidden', 'style', 'class']
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      portalizeDialogs();
      observeMutations();
    });
  } else {
    portalizeDialogs();
    observeMutations();
  }
})();
