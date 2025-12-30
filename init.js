const mapContainer = document.getElementById('map');

if (mapContainer) {
  const observer = new IntersectionObserver(async ([entry], obs) => {
    if (!entry.isIntersecting) return;
    obs.disconnect();

    try {
      // Dynamisch Leaflet und MarkerCluster laden
      const [{ default: L }] = await Promise.all([
        import('https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js'),
        import('https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js'),
        import('./app.js'), // sollte einen default exportierten Init-Fn haben
      ]);

      // Logging nur für Dev
      if (import.meta.env?.DEV) {
        console.log('Leaflet geladen:', L);
        console.log('Map initialisiert');
      }
    } catch (error) {
      console.error('Fehler beim Laden der Map-Komponenten:', error);
      const toast = document.getElementById('toast');
      if (toast) toast.textContent = 'Kartenfunktion konnte nicht geladen werden.';
    }
  }, {
    rootMargin: '200px', // frühzeitig laden
    threshold: 0.01
  });

  observer.observe(mapContainer);
}