// init.js
const mapContainer = document.getElementById('map');

// Intersect only when needed
const observer = new IntersectionObserver(async ([entry], obs) => {
  if (entry.isIntersecting) {
    obs.disconnect();

    // Dynamisch Leaflet und MarkerCluster laden
    await Promise.all([
      import('https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js'),
      import('https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js'),
      import('./app.js')
    ]);
  }
}, { rootMargin: '200px' });

if (mapContainer) observer.observe(mapContainer);