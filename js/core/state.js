// js/core/state.js
// Globaler App-Zustand mit reaktivem Listener-System

const listeners = new Set();

const state = {
  spots: {
    all: [],
    filtered: [],
    currentSelectedId: null,
  },
  filters: null, // wird von initFilters gesetzt
  plus: {
    status: null,
    partnerCodesCache: null,
  },
};

/**
 * Gibt eine Kopie des aktuellen App-Zustands zurück.
 */
export function getState() {
  return {
    spots: { ...state.spots },
    filters: state.filters ? { ...state.filters } : null,
    plus: { ...state.plus },
  };
}

/**
 * Patcht den globalen Zustand und benachrichtigt alle Listener.
 * @param {Partial<typeof state>} patch
 */
export function setState(patch) {
  if (patch.spots) {
    state.spots = { ...state.spots, ...patch.spots };
  }
  if (patch.filters) {
    state.filters = { ...(state.filters || {}), ...patch.filters };
  }
  if (patch.plus) {
    state.plus = { ...state.plus, ...patch.plus };
  }

  const snapshot = getState();
  listeners.forEach((fn) => fn(snapshot));
}

/**
 * Fügt einen Listener hinzu, der bei jeder Änderung benachrichtigt wird.
 * Gibt eine Unsubscribe-Funktion zurück.
 */
export function subscribe(listener) {
  listeners.add(listener);
  // Direkt mit aktuellem Zustand initialisieren
  listener(getState());
  return () => listeners.delete(listener);
}
