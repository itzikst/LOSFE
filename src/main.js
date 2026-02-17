import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.js'

document.querySelector('#app').innerHTML = `
  <div id="map"></div>
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
  });

  // The marker, positioned at Jerusalem
  const marker = new AdvancedMarkerElement({
    map: map,
    position: position,
    title: "Jerusalem",
  });
}

// Load the Google Maps script
const script = document.createElement('script');
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&v=weekly`;
script.async = true;
window.initMap = initMap;
document.head.appendChild(script);
