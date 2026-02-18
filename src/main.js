import './style.css'


document.querySelector('#app').innerHTML = `
  <div id="map"></div>
  <div id="side-panel">
    <div class="field">
      <label for="coords">START / END:</label>
      <textarea id="coords" readonly placeholder="Click and drag on map..."></textarea>
    </div>
    <button id="clear-selection" class="btn secondary">Clear Selection</button>
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

  // Create custom control for Draw Mode
  const controlDiv = document.createElement("div");
  controlDiv.className = "field toggle-field map-control";
  controlDiv.innerHTML = `
    <label class="switch">
      <input type="checkbox" id="draw-mode">
      <span class="slider round"></span>
    </label>
    <span id="toggle-label" class="toggle-label">Drag to pan map</span>
  `;
  map.controls[google.maps.ControlPosition.LEFT_TOP].push(controlDiv);

  // Handle toggle label change
  const drawModeCheckbox = controlDiv.querySelector("#draw-mode");
  const toggleLabel = controlDiv.querySelector("#toggle-label");
  drawModeCheckbox.addEventListener("change", () => {
    toggleLabel.textContent = drawModeCheckbox.checked ? "Drag to test Line of Sight" : "Drag to pan map";
  });

  // Drag-to-draw logic
  let drawing = false;
  let polyline = null;
  let startLatLng = null;

  // Helper for touch to latlng
  const getTouchLatLng = (e) => {
    if (!e.touches || e.touches.length === 0) return null;
    const touch = e.touches[0];
    const mapDiv = document.getElementById("map");
    const rect = mapDiv.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // This is a bit complex since Google Maps doesn't provide a direct
    // "getLatLngFromPixel" on the map instance easily without an OverlayView.
    // However, the standard mouse events are usually enough if we prevent default behavior.
    return null; // Stick to raw events but handle them better
  };

  const handleStart = (latLng) => {
    const isDrawMode = document.getElementById("draw-mode").checked;
    if (!isDrawMode) return;

    drawing = true;
    startLatLng = latLng;

    // Lock map gestures
    map.setOptions({
      draggable: false,
      scrollwheel: false,
      disableDoubleClickZoom: true,
      gestureHandling: "none"
    });

    if (polyline) polyline.setMap(null);
    polyline = new google.maps.Polyline({
      path: [startLatLng, startLatLng],
      map: map,
      strokeColor: "#000000",
      strokeOpacity: 1.0,
      strokeWeight: 3,
      icons: []
    });
  };

  const handleMove = (latLng) => {
    if (!drawing) return;
    polyline.setPath([startLatLng, latLng]);
  };

  const handleEnd = () => {
    if (!drawing) return;
    drawing = false;
    // Restore map gestures
    map.setOptions({
      draggable: true,
      scrollwheel: true,
      disableDoubleClickZoom: false,
      gestureHandling: "greedy"
    });

    const path = polyline.getPath();
    const start = path.getAt(0);
    const end = path.getAt(1);

    if (start && end) {
      const coordsArea = document.getElementById("coords");
      coordsArea.value = `START - ${start.lat().toFixed(6)}, ${start.lng().toFixed(6)}\nEND - ${end.lat().toFixed(6)}, ${end.lng().toFixed(6)}`;
      fetchLOS(start.lat(), start.lng(), end.lat(), end.lng());
    }
  };

  map.addListener("mousedown", (e) => handleStart(e.latLng));
  map.addListener("mousemove", (e) => handleMove(e.latLng));
  google.maps.event.addDomListener(window, "mouseup", () => handleEnd());

  // Mobile specific: Prevent scrolling when drawing
  const mapDiv = document.getElementById("map");

  const blockGesture = (e) => {
    const isDrawMode = document.getElementById("draw-mode").checked;
    if (isDrawMode) {
      if (e.cancelable) e.preventDefault();
    }
  };

  mapDiv.addEventListener("touchstart", blockGesture, { passive: false });
  mapDiv.addEventListener("touchmove", blockGesture, { passive: false });

  document.getElementById("clear-selection").addEventListener("click", () => {
    if (polyline) polyline.setMap(null);
    polyline = null;
    document.getElementById("coords").value = "";
    document.getElementById("response").value = "";
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

      // Update line color based on result
      if (polyline) {
        if (data === true) {
          polyline.setOptions({ strokeColor: "#4CAF50", icons: [] }); // Green
        } else if (data === false) {
          polyline.setOptions({ strokeColor: "#F44336", icons: [] }); // Red
        }
      }
    } catch (error) {
      responseArea.value = `Error fetching data: ${error.message}`;

      // Dotted yellow line for errors
      if (polyline) {
        polyline.setOptions({
          strokeColor: "#FFEB3B", // Yellow
          strokeOpacity: 0,
          icons: [{
            icon: {
              path: 'M 0,-1 0,1',
              strokeOpacity: 1,
              scale: 4
            },
            offset: '0',
            repeat: '20px'
          }]
        });
      }
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
