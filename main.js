import './style.css';
import { Map, View } from 'ol';

import { OSM, TileWMS, Vector as VectorSource } from "ol/source";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";

import GeoJSON from "ol/format/GeoJSON";

import {format} from "ol/coordinate";

import Overlay from "ol/Overlay";

import "ol-layerswitcher/dist/ol-layerswitcher.css";
import LayerSwitcher from "ol-layerswitcher";

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
  ZoomSlider,
  ZoomToExtent,
  OverviewMap,
  FullScreen,
  defaults as defaultControls,
  MousePosition,
} from "ol/control";

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


//Zoom Slider control
const zoomSlider = new ZoomSlider();


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
  zoomSlider,
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



const caminosStyle = (feature) => {
  let agrupacion = feature.get("agrupacion");

  let colorAgrupacion;

  switch (agrupacion) {
    case 'Camino Francés':
      colorAgrupacion = 'yellow';
      break;
    case 'Caminos Andaluces':
      colorAgrupacion = 'green';
      break;
    case 'Caminos Catalanes':
      colorAgrupacion = 'blue';
      break;
    case 'Caminos de Galicia':
      colorAgrupacion = 'dark pink';
      break;
    case 'Caminos del Norte':
      colorAgrupacion = 'fuchsia';
      break;
    case 'Caminos del Centro':
      colorAgrupacion = 'orange';
      break;
    case 'Caminos del Este':
      colorAgrupacion = 'gray';
      break;
    case 'Caminos del Sureste':
      colorAgrupacion = 'red';
      break;
    case 'Caminos Insulares':
      colorAgrupacion = 'cyan';
      break;
    case 'Caminos Portugueses':
      colorAgrupacion = 'brown';
      break;
    case 'Chemins vers Via des Piemonts':
      colorAgrupacion = 'maroon';
      break;
    case 'Chemins vers Via Turonensis':
      colorAgrupacion = '#1f6b75';
      break;
    case 'Voie des Piemonts':
      colorAgrupacion = 'dark green';
      break;
    case 'Voie Turonensis - Paris':
      colorAgrupacion = '#78b90f';
      break;
    case 'Via Tolosana Arles':
      colorAgrupacion = 'dark green';
      break;


  }

  return new Style({
    stroke: new Stroke({
      color: colorAgrupacion,
      width: 2
    })
  });
  
}

const caminos_santiago = new VectorLayer({
  title: "Caminos de Santiago",
  visible: true,
  style: function (feature) {
    return caminosStyle(feature);
  },
  source: new VectorSource({
    format: new GeoJSON(),
    url: "./data/caminos_santiago.geojson",
  }),
});


//---Grupos de capas (Layerswitcher)---
const baseMaps_layers = new LayerGroup({
  title: "Mapas base",
  layers: [osmLayer, ortoPNOALayer, MTN50Layer],
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
    let nombre = feature.get("nombre");
    let longitud = feature.get("longitud");
    let url_info = feature.get("url_info");
    let agrupacion = feature.get("agrupacion");
    let pais = feature.get("pais");
    let data = [nombre, longitud, url_info, agrupacion, pais];
    return data;
  });
  if (info) {
    container.style.display = "block";
    const coordinate = evt.coordinate;
    // Añadimos el contenido al HTML
    content.innerHTML = `<h3>Información</h3>
                          <p><b>Nombre</b>: ${info[0]} </p>
                          <p><b>Longitud</b>: ${info[1]} Km.</p>
                          <p><b>URL</b>: ${info[2]} </p>
                          <p><b>Agrupación</b>: ${info[3]} </p>
                          <p><b>País</b>: ${info[4]} </p>`;
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
  tipLabel: "Leyenda",
});

map.addControl(layerSwitcher);

