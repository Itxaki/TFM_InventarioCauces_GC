import './style.css';
import { Map, View } from 'ol';
import { OSM, TileWMS, Vector as VectorSource } from "ol/source";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";

import GeoJSON from "ol/format/GeoJSON";
import Overlay from "ol/Overlay";

import "ol-layerswitcher/dist/ol-layerswitcher.css";
import LayerSwitcher from "ol-layerswitcher/dist/ol-layerswitcher.js";

import {
  Text,
  Icon,
  Circle as CircleStyle,
  Fill,
  Stroke,
  Style,
} from "ol/style";


//Controles
import {
  ZoomToExtent,
  OverviewMap,
  FullScreen,
  defaults as defaultControls,
  MousePosition,
} from "ol/control";

import { format } from "ol/coordinate";

import LayerGroup from 'ol/layer/Group';


//Establecer el centro de la vista
const spain_center = [-1735830.00, 3242475.00];

//Vista restringida a extensión
const spain_extent = [-1778300.00, 3196500.00, -1692000.00, 3291600.00];

//Establecer parámetros vista extensión Gran Canaria
const coruna_extent = [-1768200.00, 3212300.00, -1700700.00, 3278200.00];



//---Controles---

//OverviewMap control (Mapa guía)
const overviewMapControl = new OverviewMap({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
});


//Full Screem control
const fullScreenControl = new FullScreen();


//Zoom to extent control (A Coruña)
const zoomToCorunaControl = new ZoomToExtent({
  extent: coruna_extent,
});

//Mouse position control
const mousePositionControl = new MousePosition({
  coordinateFormat: (coordinate) => {
    return format(coordinate, "Lat: {y}, Long: {x}", 4);
  },
  projection: "EPSG:4326",
  className: "coordinate_display",
});

//Variable con los controles que vamos a cargar
const extendControls = [
  overviewMapControl,
  fullScreenControl,
  mousePositionControl,
  zoomToCorunaControl,
];



//---Capas---

const osmLayer = new TileLayer({
  title: "OpenStreetMap",
  source: new OSM(),
  type: "base",
  visible: true,
});


//Ortofoto PNOA
const ortoPNOALayer = new TileLayer({
  title: "PNOA",
  visible: false,
  source: new TileWMS({
    url: "https://www.ign.es/wms-inspire/pnoa-ma?",
    params: { LAYERS: "OI.OrthoimageCoverage", TILED: true },
    attributions: "PNOA &copy; Instituto Geográfico Nacional",
  }),
  type: "base",
});

//Ortofoto GRAFCAN
const ortoExpress = new TileLayer({
  title: "OrtoExpress",
  visible: false,
  source: new TileWMS({
    url: "https://idecan1.grafcan.es/ServicioWMS/OrtoExpress?",
    params: { 'LAYERS': "WMS_OrtoExpress", TILED: true },
  }),
  type: "base",
});

//Capa MTN50
const MTN50Layer = new TileLayer({
  title: "MTN50",
  visible: false,
  source: new TileWMS({
    url: "https://www.ign.es/wms/primera-edicion-mtn",
    params: { LAYERS: "MTN50", TILED: true },
    attributions: "MTN50 &copy; Instituto Geográfico Nacional",
  }),
  type: "base",
});


const caminos_santiago = new VectorLayer({
  title: "Cauces",
  visible: true,
  source: new VectorSource({
    format: new GeoJSON(),
    url: "./data/cauces.geojson",
  }),
});


//---Grupos de capas (Layerswitcher)---
const baseMaps_layers = new LayerGroup({
  title: "Mapas base",
  layers: [osmLayer, ortoPNOALayer, ortoExpress, MTN50Layer],
});

const overlays_layers = new LayerGroup({
  fold: "open",
  title: "Capas",
  layers: [caminos_santiago],
});



//---Popup (ventanas emergentes)---
//   Variables asociadas a objetos HTML
const container = document.getElementById("popup");
const content = document.getElementById("popup-content");
const closer = document.getElementById("popup-closer");

//   Evento para ocultar popup
closer.onclick = function () {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};

//   Objeto overlay de OL
const overlay = new Overlay({
  element: container,
  autoPan: true,
  autoPanAnimation: {
    duration: 250,
  },
});


//---Variable Map---
const map = new Map({
  target: 'map',
  layers: [baseMaps_layers, overlays_layers],
  view: new View({
    center: spain_center, //Centrar vista del mapa 
    zoom: 4,
    constrainResolution: false,
    extent: spain_extent //restringir extensión del mapa
  }),
  controls: defaultControls({
    //Gestión de controles por defecto
    zoom: true,
    attribution: true,
    rotate: true,
  }).extend(extendControls),
  overlays: [overlay],
});



//Evento apertura popup
map.on("singleclick", function (evt) {
  let info = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
    let nombre = feature.get("Barranco");
    let nombre2 = feature.get("OtrosTopon");
    let longitud = feature.get("Longitud");
    let xini = feature.get("Xini");
    let yini = feature.get("Yini");
    let xfin = feature.get("Xfin");
    let yfin = feature.get("Yfin");
    let data = [nombre, nombre2, longitud, xini, yini, xfin, yfin];
    return data;
  });
  if (info) {
    container.style.display = "block";
    const coordinate = evt.coordinate;
    // Añadimos el contenido al HTML
    content.innerHTML = `<h3>Información</h3>
                          <p><b>Barranco</b>: ${info[0]} </p>
                          <p><b>Otros topónimos</b> ${info[1]}
                          <p><b>Longitud</b>: ${info[2]} m.</p>
                          <p><b>X inicial</b>: ${info[3]} </p>
                          <p><b>Y inicial</b>: ${info[4]} </p>
                          <p><b>X final</b>: ${info[5]} </p>
                          <p><b>Y final</b>: ${info[6]} </p>`;
    // Presenta la ventana en las coordenadas
    overlay.setPosition(coordinate);
  } else {
    container.style.display = "none";
  }
});

map.on("pointermove", function (evt) {
  map.getTargetElement().style.cursor = map.hasFeatureAtPixel(evt.pixel)
    ? "pointer"
    : "";
});

//---Layerswitcher---
const layerSwitcher = new LayerSwitcher({
  tipLabel: 'Leyenda',
});

map.addControl(layerSwitcher);

console.log(35);