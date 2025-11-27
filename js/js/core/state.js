// js/state.js
// Kleiner globaler Store für App-State (Filter, Spots, Plus, UI)

const listeners = new Set();

const state = {
  spots: {
    all: [],
    filtered: [],
    currentSelectedId: null,
  },
  filters: null, // wird nach initFilters gesetzt
  plus: {
    status: null,
    partnerCodesCache: null,
  },
};

export function getState() {
  return {
    spots: { ...state.spots },
    filters: state.filters ? { ...state.filters } : null,
    plus: { ...state.plus },
  };
}

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

export function subscribe(listener) {
  listeners.add(listener);
  listener(getState());
  return () => listeners.delete(listener);
}