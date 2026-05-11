import * as StoryAPI from "../../data/api";
import AddStoryPresenter from "./add-story-presenter";
import Map from "../../utils/map";

export default class AddStoryPage {
  #presenter = null;
  #map = null;
  #locationMarker = null;
  #cameraStream = null;
  #capturedPhoto = null;

  async render() {
    return `
      <section class="page-section">
        <div class="page-header max-w-2xl mx-auto">
          <div>
            <p class="eyebrow">Ada cerita apa hari ini?</p>
            <h1 class="text-2xl font-bold leading-tight">Pilih foto terbaikmu, tandai lokasinya, lalu bagikan momen itu kepada pembaca lain.</h1>
          </div>
          <a href="#/" class="btn btn-secondary">Back</a>
        </div>
        <form id="story-form" class="form-card">
          <div class="flex flex-col gap-2">
            <label for="description" class="cs-label">Description</label>
            <textarea id="description" name="description" class="cs-textarea" required></textarea>
          </div>
          <div class="flex flex-col gap-2">
            <label for="photo" class="cs-label">Photo</label>
            <input id="photo" name="photo" type="file" accept="image/*" class="cs-input" />
          </div>
          <div class="camera-panel">
            <video id="camera-preview" class="camera-preview" autoplay playsinline muted hidden></video>
            <canvas id="camera-canvas" hidden></canvas>
            <img id="captured-preview" class="camera-preview" alt="Captured story preview" hidden />
            <div class="flex flex-wrap items-center gap-3">
              <button id="open-camera-button" type="button" class="btn btn-secondary w-fit">Open Camera</button>
              <button id="capture-camera-button" type="button" class="btn btn-secondary w-fit" disabled>Capture Photo</button>
              <button id="close-camera-button" type="button" class="btn btn-secondary w-fit" disabled>Close Camera</button>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <label for="lat" class="cs-label">Latitude</label>
              <input id="lat" name="lat" type="number" step="any" class="cs-input" readonly required />
            </div>
            <div class="flex flex-col gap-2">
              <label for="lon" class="cs-label">Longitude</label>
              <input id="lon" name="lon" type="number" step="any" class="cs-input" readonly required />
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <label for="add-story-map" class="cs-label">Pick Location</label>
            <div id="add-story-map" class="map-panel"></div>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <button id="use-location-button" type="button" class="btn btn-secondary w-fit">Use Current Location</button>
            <button id="save-story-button" class="btn btn-primary w-fit">Save Story</button>
          </div>
        </form>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new AddStoryPresenter({
      view: this,
      model: StoryAPI,
    });

    this.setupLocationButton();
    await this.initialMap();
    this.setupCamera();
    this.setupPhotoInput();
    this.setupForm();
  }

  async initialMap() {
    this.#map = await Map.build("#add-story-map", {
      zoom: 5,
      locate: true,
    });

    this.#map.addClickListener((event) => {
      this.setSelectedLocation(event.latlng.lat, event.latlng.lng);
    });
  }

  setSelectedLocation(latitude, longitude) {
    document.getElementById("lat").value = latitude;
    document.getElementById("lon").value = longitude;

    const coordinate = [latitude, longitude];
    this.#map.removeMarker(this.#locationMarker);
    this.#locationMarker = this.#map.addMarker(
      coordinate,
      { alt: "Selected story location" },
      { content: "Selected story location" },
    );
    this.#map.changeCamera(coordinate, 13);
  }

  setupLocationButton() {
    document
      .getElementById("use-location-button")
      .addEventListener("click", () => {
        navigator.geolocation.getCurrentPosition((position) => {
          this.setSelectedLocation(
            position.coords.latitude,
            position.coords.longitude,
          );
        });
      });
  }

  setupPhotoInput() {
    document.getElementById("photo").addEventListener("change", () => {
      this.#capturedPhoto = null;
      const capturedPreview = document.getElementById("captured-preview");
      capturedPreview.hidden = true;
      capturedPreview.removeAttribute("src");
    });
  }

  setupCamera() {
    document
      .getElementById("open-camera-button")
      .addEventListener("click", () => this.openCamera());
    document
      .getElementById("capture-camera-button")
      .addEventListener("click", () => this.capturePhoto());
    document
      .getElementById("close-camera-button")
      .addEventListener("click", () => this.stopCamera());
  }

  async openCamera() {
    try {
      this.#cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      const video = document.getElementById("camera-preview");
      video.srcObject = this.#cameraStream;
      video.hidden = false;

      document.getElementById("capture-camera-button").removeAttribute("disabled");
      document.getElementById("close-camera-button").removeAttribute("disabled");
    } catch (error) {
      alert(error?.message || "Camera cannot be opened");
    }
  }

  capturePhoto() {
    const video = document.getElementById("camera-preview");
    const canvas = document.getElementById("camera-canvas");
    const capturedPreview = document.getElementById("captured-preview");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      this.#capturedPhoto = new File([blob], "story-photo.jpg", {
        type: "image/jpeg",
      });
      capturedPreview.src = URL.createObjectURL(blob);
      capturedPreview.hidden = false;
      document.getElementById("photo").value = "";
      this.stopCamera();
    }, "image/jpeg");
  }

  stopCamera() {
    if (this.#cameraStream) {
      this.#cameraStream.getTracks().forEach((track) => track.stop());
      this.#cameraStream = null;
    }

    const video = document.getElementById("camera-preview");
    if (video) {
      video.srcObject = null;
      video.hidden = true;
    }

    document.getElementById("capture-camera-button")?.setAttribute("disabled", "true");
    document.getElementById("close-camera-button")?.setAttribute("disabled", "true");
  }

  setupForm() {
    document.getElementById("story-form").addEventListener("submit", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const photo = document.getElementById("photo").files[0] || this.#capturedPhoto;

      if (!photo) {
        alert("Please upload a photo or capture one with the camera.");
        return;
      }

      this.#presenter.onAddStory({
        description: document.getElementById("description").value,
        photo,
        lat: document.getElementById("lat").value,
        lon: document.getElementById("lon").value,
      });
    });
  }

  showLoader() {
    const button = document.getElementById("save-story-button");
    button.textContent = "Saving...";
    button.setAttribute("disabled", "true");
  }

  hideLoader() {
    const button = document.getElementById("save-story-button");
    button.textContent = "Save Story";
    button.removeAttribute("disabled");
  }

  destroy() {
    this.stopCamera();
  }
}
