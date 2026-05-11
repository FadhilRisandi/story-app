import { map, tileLayer, Icon, icon, marker, popup, latLng, control } from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { MAP_SERVICE_API_KEY } from "../config";

export default class Map {
  #zoom = 5;
  #map = null;

  static async getPlaceNameByCoordinate(latitude, longitude) {
    try {
      const url = new URL(
        `https://api.maptiler.com/geocoding/${longitude},${latitude}.json`,
      );
      url.searchParams.set("key", MAP_SERVICE_API_KEY);
      url.searchParams.set("language", "id");
      url.searchParams.set("limit", "1");
      const response = await fetch(url);
      const json = await response.json();
      const placeName = json.features?.[0]?.place_name;

      if (!placeName) {
        return `${latitude}, ${longitude}`;
      }

      const place = placeName.split(", ");
      return [place.at(-2), place.at(-1)].map((name) => name).join(", ");
    } catch (error) {
      console.error("getPlaceNameByCoordinate: error:", error);
      return `${latitude}, ${longitude}`;
    }
  }

  static isGeolocationAvailable() {
    return "geolocation" in navigator;
  }

  static getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
      if (!Map.isGeolocationAvailable()) {
        reject("Geolocation API unsupported");
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  /**
   * Reference of using this static method:
   * https://stackoverflow.com/questions/43431550/how-can-i-invoke-asynchronous-code-within-a-constructor
   * */
  static async build(selector, options = {}) {
    if ("center" in options && options.center) {
      return new Map(selector, options);
    }

    const jakartaCoordinate = [-6.2, 106.816666];

    // Using Geolocation API
    if ("locate" in options && options.locate) {
      try {
        const position = await Map.getCurrentPosition();
        const coordinate = [
          position.coords.latitude,
          position.coords.longitude,
        ];

        return new Map(selector, {
          ...options,
          center: coordinate,
        });
      } catch (error) {
        console.error("build: error:", error);

        return new Map(selector, {
          ...options,
          center: jakartaCoordinate,
        });
      }
    }

    return new Map(selector, {
      ...options,
      center: jakartaCoordinate,
    });
  }

  constructor(selector, options = {}) {
    this.#zoom = options.zoom ?? this.#zoom;

    const tileOsm = tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
      },
    );
    const tileMapTilerStreets = tileLayer(
      `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAP_SERVICE_API_KEY}`,
      {
        attribution:
          '&copy; <a href="https://www.maptiler.com/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>',
      },
    );
    const tileMapTilerSatellite = tileLayer(
      `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${MAP_SERVICE_API_KEY}`,
      {
        attribution:
          '&copy; <a href="https://www.maptiler.com/" target="_blank">MapTiler</a>',
      },
    );

    this.#map = map(document.querySelector(selector), {
      zoom: this.#zoom,
      scrollWheelZoom: false,
      layers: [tileOsm],
      ...options,
    });

    control.layers(
      {
        OpenStreetMap: tileOsm,
        "MapTiler Streets": tileMapTilerStreets,
        "MapTiler Satellite": tileMapTilerSatellite,
      },
      {},
      { position: "topright" },
    ).addTo(this.#map);
  }

  createIcon(options = {}) {
    return icon({
      ...Icon.Default.prototype.options,
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
      ...options,
    });
  }

  changeCamera(coordinate, zoomLevel = null) {
    if (!zoomLevel) {
      this.#map.setView(latLng(coordinate), this.#zoom);
      return;
    }
    this.#map.setView(latLng(coordinate), zoomLevel);
  }

  addMarker(coordinates, markerOptions = {}, popupOptions = null) {
    const [latitude, longitude] = coordinates;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    if (typeof markerOptions !== "object") {
      throw new Error("markerOptions must be an object");
    }
    const newMarker = marker(coordinates, {
      icon: this.createIcon(),
      ...markerOptions,
    });
    if (popupOptions) {
      if (typeof popupOptions !== "object") {
        throw new Error("popupOptions must be an object");
      }
      if (!("content" in popupOptions)) {
        throw new Error("popupOptions must include `content` property.");
      }
      const newPopup = popup(coordinates, popupOptions);
      newMarker.bindPopup(newPopup);
    }
    newMarker.addTo(this.#map);
    return newMarker;
  }

  addClickListener(callback) {
    this.#map.on("click", callback);
  }

  removeMarker(currentMarker) {
    if (!currentMarker) return;
    currentMarker.removeFrom(this.#map);
  }
}
