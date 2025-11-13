// Family Spots Map — Dialog Portal & Z-Index Fix
// - Portaliert alle [role="dialog"] an das Ende von <body>
// - Schaltet Body-Scroll aus, wenn ein Dialog sichtbar ist
// - Erzeugt bei Bedarf einen Backdrop (#dialog-backdrop)

(function () {
  function portalizeDialogs() {
    var dialogs = document.querySelectorAll('[role="dialog"]');
    for (var i = 0; i < dialogs.length; i++) {
      var el = dialogs[i];
      if (el.parentElement !== document.body) {
        document.body.appendChild(el);
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
    var result = [];
    var dialogs = document.querySelectorAll('[role="dialog"]');
    for (var i = 0; i < dialogs.length; i++) {
      var el = dialogs[i];
      if (!el.hasAttribute('hidden') && el.style.display !== 'none') {
        result.push(el);
      }
    }
    return result;
  }

  function updateBodyLock() {
    var backdrop = document.getElementById('dialog-backdrop');
    var open = visibleDialogs();
    if (open.length > 0) {
      document.body.classList.add('body--dialog-open');
      if (backdrop) backdrop.classList.add('is-backdrop-visible');
    } else {
      document.body.classList.remove('body--dialog-open');
      if (backdrop) backdrop.classList.remove('is-backdrop-visible');
    }
  }

  function observeMutations() {
    var observer = new MutationObserver(function () {
      updateBodyLock();
    });
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