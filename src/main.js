import './style.css'


document.querySelector('#app').innerHTML = `
  <div id="map"></div>
  <div id="side-panel">
    <h3>Coordinates</h3>
    <div class="field">
      <label for="coords">Start / End Coordinates:</label>
      <textarea id="coords" readonly placeholder="Click and drag on map..."></textarea>
    </div>
    <div class="field response-field">
      <label for="response">API Response:</label>
      <textarea id="response" readonly placeholder="Response will appear here..."></textarea>
    </div>
  </div>
`


// Initialize and add the map
let map;

async function initMap() {
  // The location of Jerusalem
  const position = { lat: 31.7683, lng: 35.2137 };
  // Request needed libraries.
  //@ts-ignore
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

  // The map, centered at Jerusalem
  map = new Map(document.getElementById("map"), {
    zoom: 12,
    center: position,
    mapId: "DEMO_MAP_ID",
    mapTypeId: "terrain",
  });

  // The marker, positioned at Jerusalem
  const marker = new AdvancedMarkerElement({
    map: map,
    position: position,
    title: "Jerusalem",
  });

  // Drag-to-draw logic
  let drawing = false;
  let polyline = null;
  let startLatLng = null;

  map.addListener("mousedown", (e) => {
    drawing = true;
    startLatLng = e.latLng;

    // Disable map features like panning
    map.setOptions({ draggable: false, scrollwheel: false, disableDoubleClickZoom: true });

    if (polyline) polyline.setMap(null);
    polyline = new google.maps.Polyline({
      path: [startLatLng, startLatLng],
      map: map,
      strokeColor: "#FF0000",
      strokeOpacity: 1.0,
      strokeWeight: 2,
    });
  });

  map.addListener("mousemove", (e) => {
    if (!drawing) return;
    const currentLatLng = e.latLng;
    polyline.setPath([startLatLng, currentLatLng]);
  });

  google.maps.event.addDomListener(window, "mouseup", () => {
    if (!drawing) return;
    drawing = false;

    // Re-enable map features
    map.setOptions({ draggable: true, scrollwheel: true, disableDoubleClickZoom: false });

    // Final coordinates for API call
    const path = polyline.getPath();
    const start = path.getAt(0);
    const end = path.getAt(1);

    if (start && end) {
      // Update coordinates display only on mouseup
      const coordsArea = document.getElementById("coords");
      coordsArea.value = `START - ${start.lat().toFixed(6)}, ${start.lng().toFixed(6)}\nEND - ${end.lat().toFixed(6)}, ${end.lng().toFixed(6)}`;

      fetchLOS(start.lat(), start.lng(), end.lat(), end.lng());
    }
  });

  async function fetchLOS(sLat, sLng, eLat, eLng) {
    const responseArea = document.getElementById("response");
    responseArea.value = "Fetching data...";

    try {
      const apiUrl = `https://lineofsight-487018.lm.r.appspot.com/?start_lat=${sLat}&start_lng=${sLng}&end_lat=${eLat}&end_lng=${eLng}`;
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      responseArea.value = JSON.stringify(data, null, 2);
    } catch (error) {
      responseArea.value = `Error fetching data: ${error.message}`;
    }
  }
}

// Load the Google Maps script
const script = document.createElement('script');
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&v=weekly`;
script.async = true;
window.initMap = initMap;
document.head.appendChild(script);
