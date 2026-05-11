import * as StoryAPI from "../../data/api";
import { parseActivePathname } from "../../routes/url-parser";
import Map from "../../utils/map";
import {
  deleteFavoriteStory,
  deleteStoryById,
  getFavoriteStory,
  saveFavoriteStory,
} from "../../utils/idb";
import DetailPresenter from "./detail-presenter";

export default class DetailPage {
  #presenter = null;
  #map = null;
  #story = null;

  async render() {
    return `
      <section class="page-section">
        <div class="page-header">
          <div>
            <p class="eyebrow">Story detail</p>
            <h1 id="name-story" class="text-4xl sm:text-5xl font-bold leading-tight"></h1>
          </div>
          <a href="#/" class="btn btn-secondary w-fit">Back</a>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6 items-start">
          <article class="card overflow-hidden gap-0">
            <img id="photo-story" class="w-full aspect-[16/10] object-cover bg-white" />
            <div class="p-6 sm:p-8 flex flex-col gap-5">
              <p id="description-story" class="text-lg leading-8 text-muted"></p>
              <div class="flex flex-wrap gap-3">
                <button id="favorite-story-detail-button" type="button" class="btn btn-secondary w-fit">
                  Save Story
                </button>
                <button id="delete-story-detail-button" type="button" class="btn btn-danger w-fit">
                  Delete Story
                </button>
              </div>
            </div>
          </article>
          <aside class="flex flex-col gap-4">
            <div class="card p-5">
              <p class="eyebrow">Location</p>
              <p id="location" class="text-lg font-heading"></p>
            </div>
            <p id="detail-offline-status" class="status-note" hidden></p>
            <div id="map" class="map-panel"></div>
          </aside>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new DetailPresenter(parseActivePathname().id, {
      view: this,
      model: StoryAPI,
    });

    this.#presenter.onGetStory();
  }

  async initialMap() {
    this.#map = await Map.build("#map", {
      zoom: 10,
      locate: true,
    });
  }

  async renderStory(message, story) {
    this.#story = story;
    const text = document.getElementById("name-story");
    const description = document.getElementById("description-story");
    const photo = document.getElementById("photo-story");
    const location = document.getElementById("location");
    const offlineStatus = document.getElementById("detail-offline-status");

    offlineStatus.hidden = message !== "offline";
    offlineStatus.textContent = "This story is loaded from offline storage.";

    if (this.#map) {
      const storyCoordinate = [
        parseFloat(String(story.lat)),
        parseFloat(String(story.lon)),
      ];
      const markerOptions = { alt: story.name };
      const popupOptions = { content: story.name };

      if (storyCoordinate.every(Number.isFinite)) {
        this.#map.changeCamera(storyCoordinate);
        this.#map.addMarker(storyCoordinate, markerOptions, popupOptions);
      }
    }

    description.textContent = story.description;
    photo.src = story.photoUrl;
    photo.alt = story.name;
    text.textContent = story.name;
    location.textContent = story.location?.placeName || "Location not found";
    await this.#setupFavoriteButton();
  }

  async #setupFavoriteButton() {
    const button = document.getElementById("favorite-story-detail-button");
    const deleteButton = document.getElementById("delete-story-detail-button");
    const favorite = await getFavoriteStory(this.#story.id);

    button.textContent = favorite ? "Saved Story" : "Save Story";
    button.classList.toggle("btn-primary", !!favorite);
    button.classList.toggle("btn-secondary", !favorite);

    button.onclick = async () => {
      const latestFavorite = await getFavoriteStory(this.#story.id);

      if (!latestFavorite) {
        await saveFavoriteStory(this.#story);
      }

      await this.#setupFavoriteButton();
    };

    deleteButton.onclick = async () => {
      await deleteFavoriteStory(this.#story.id);
      await deleteStoryById(this.#story.id);
      location.href = "#/";
    };
  }

  showLoader() {}
  hideLoader() {}
  mapLoader() {}
  mapLoaderHide() {}
}
