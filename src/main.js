import './style.css'


document.querySelector('#app').innerHTML = `
  <div id="map"></div>
  <div id="side-panel">
    <h3>Coordinates</h3>
    <div class="field">
      <label for="coords">Lat, Long:</label>
      <input type="text" id="coords" readonly placeholder="Click on map...">
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

  // Add click listener
  map.addListener("click", async (mapsMouseEvent) => {
    const coords = mapsMouseEvent.latLng.toJSON();
    const coordsStr = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
    document.getElementById("coords").value = coordsStr;

    const responseArea = document.getElementById("response");
    responseArea.value = "Fetching data...";

    try {
      const apiUrl = `https://lineofsight-487018.lm.r.appspot.com/?lat=${coords.lat}&lng=${coords.lng}`;
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      responseArea.value = JSON.stringify(data, null, 2);
    } catch (error) {
      responseArea.value = `Error fetching data: ${error.message}`;
    }
  });
}

// Load the Google Maps script
const script = document.createElement('script');
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&v=weekly`;
script.async = true;
window.initMap = initMap;
document.head.appendChild(script);
