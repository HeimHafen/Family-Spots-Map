// app.js

const spots = [
  {
    id: "spot1",
    name: "Abenteuerpark",
    location: { lat: 48.1351, lng: 11.582 },
    city: "München",
  },
  {
    id: "spot2",
    name: "Familienbad",
    location: { lat: 48.139, lng: 11.586 },
    city: "München",
  },
];

let map;

function initMap() {
  map = L.map("map").setView([48.1351, 11.582], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
  }).addTo(map);

  addSpots(spots);
}

function addSpots(spots) {
  spots.forEach((spot) => {
    if (!spot.location) return;

    const marker = L.marker([spot.location.lat, spot.location.lng]).addTo(map);
    marker.bindPopup(
      `<strong>${spot.name}</strong><br>${spot.city || ""}`
    );
  });
}

document.addEventListener("DOMContentLoaded", initMap);