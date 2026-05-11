import HomePresenter from "./home-presenter";
import * as StoryAPI from "../../data/api";
import { storyCard } from "../../templates";
import StoryMap from "../../utils/map";
import {
  deleteFavoriteStory,
  deleteStoryById,
  getAllFavoriteStories,
  saveFavoriteStory,
} from "../../utils/idb";
import {
  getPushSubscription,
  isPushSupported,
  subscribePushNotification,
  unsubscribePushNotification,
} from "../../utils/push-notification";

export default class HomePage {
  #presenter = null;
  #map = null;
  #storyMarkers = new globalThis.Map();
  #stories = [];
  #favoriteStories = new globalThis.Map();

  async render() {
    return `
      <section class="page-section">
        <div class="page-header">
          <div>
            <p class="eyebrow">Ceritaku</p>
            <h1 class="text-4xl sm:text-5xl font-bold leading-tight">Ruang berbagi cerita</h1>
          </div>
          <a href="#/add-story" class="btn btn-primary w-fit">Add Story</a>
        </div>
        <div class="toolbar-panel mb-6">
          <div class="flex flex-col sm:flex-row gap-3 flex-1">
            <label class="sr-only" for="story-search">Search stories</label>
            <input id="story-search" class="cs-input" type="search" placeholder="Search stories" />
            <label class="sr-only" for="story-sort">Sort stories</label>
            <select id="story-sort" class="cs-input sm:max-w-52">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name</option>
            </select>
          </div>
          <label class="inline-flex items-center gap-2 font-heading">
            <input id="favorite-filter" type="checkbox" class="size-5 accent-main" />
            Favorites
          </label>
          <button id="push-toggle-button" type="button" class="btn btn-secondary w-fit">
            <i data-lucide="bell" aria-hidden="true"></i>
            Subscribe
          </button>
        </div>
        <div id="app-alert" class="app-alert" role="dialog" aria-modal="true" aria-labelledby="app-alert-title" hidden>
          <div class="app-alert__backdrop" data-alert-close></div>
          <div class="app-alert__panel">
            <div class="app-alert__icon">
              <i data-lucide="check" aria-hidden="true"></i>
            </div>
            <h2 id="app-alert-title">Berhasil</h2>
            <p id="app-alert-message"></p>
          </div>
        </div>
        <p id="offline-status" class="status-note mb-5" hidden></p>
        <div id="map" class="map-panel mb-8"></div>
        <div id="stories-content" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"></div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new HomePresenter({
      view: this,
      model: StoryAPI,
    });

    this.#presenter.onGetStories();
    this.#setupFilters();
    this.#setupPushToggle();
    this.#setupAlert();
    this.#renderIcons();
  }

  async initialMap() {
    this.#map = await StoryMap.build("#map", {
      zoom: 10,
      locate: true,
    });
  }

  renderStories(message, stories) {
    this.#stories = [...stories];
    document.getElementById("offline-status").hidden = message !== "offline";
    document.getElementById("offline-status").textContent =
      "You are seeing saved stories while offline.";
    this.#applyStoryFilters();
  }

  async #applyStoryFilters() {
    const search = document.getElementById("story-search")?.value.toLowerCase() || "";
    const sortBy = document.getElementById("story-sort")?.value || "newest";
    const favoriteOnly = document.getElementById("favorite-filter")?.checked || false;
    const favorites = await getAllFavoriteStories();

    this.#favoriteStories = new globalThis.Map(
      favorites.map((favorite) => [favorite.id, favorite]),
    );

    let stories = this.#stories.filter((story) => {
      const searchableText = `${story.name} ${story.description}`.toLowerCase();
      const matchSearch = searchableText.includes(search);
      const matchFavorite =
        !favoriteOnly || this.#favoriteStories.has(story.id);

      return matchSearch && matchFavorite;
    });

    stories = [...stories].sort((first, second) => {
      if (sortBy === "oldest") {
        return new Date(first.createdAt) - new Date(second.createdAt);
      }

      if (sortBy === "name") {
        return first.name.localeCompare(second.name);
      }

      return new Date(second.createdAt) - new Date(first.createdAt);
    });

    if (stories.length <= 0) {
      const container = document.getElementById("stories-content");
      container.innerHTML = `
        <div class="card p-8 sm:col-span-2 lg:col-span-3 text-center">
          <h2 class="text-2xl">No stories found</h2>
          <p class="text-muted">Create your first story and it will appear here.</p>
          <a href="#/add-story" class="btn btn-primary mx-auto w-fit">Add Story</a>
        </div>
      `;
      return;
    }

    const container = document.getElementById("stories-content");
    this.#storyMarkers.clear();

    const html = stories.reduce((accumulator, story) => {
      if (this.#map) {
        const lat = parseFloat(String(story.lat));
        const lon = parseFloat(String(story.lon));

        const coordinate = [lat, lon];
        if (coordinate.every(Number.isFinite)) {
          const markerOptions = { alt: story.name };
          const popupOptions = {
            content: `
              <a href="#/story/${story.id}" class="story-map-popup">
                <img src="${story.photoUrl}" alt="${story.name}" class="story-map-popup__image" />
                <strong class="story-map-popup__title">${story.name}</strong>
              </a>
            `,
          };
          const currentMarker = this.#map.addMarker(coordinate, markerOptions, popupOptions);
          if (currentMarker) {
            currentMarker.on("click", () => this.#setActiveStory(story.id, coordinate));
            this.#storyMarkers.set(story.id, { marker: currentMarker, coordinate });
          }
        }
      }

      return accumulator.concat(storyCard(story));
    }, "");

    container.innerHTML = html;
    this.#setupStoryMapSync();
    this.#setupFavoriteButtons();
  }

  #setupFilters() {
    ["story-search", "story-sort", "favorite-filter"].forEach((id) => {
      document
        .getElementById(id)
        .addEventListener("input", () => this.#applyStoryFilters());
    });
  }

  #setupStoryMapSync() {
    document.querySelectorAll("[data-story-id]").forEach((storyCardElement) => {
      const storyId = storyCardElement.dataset.storyId;
      storyCardElement.addEventListener("click", () => this.#openStoryMarker(storyId));
      storyCardElement.addEventListener("focusin", () => this.#openStoryMarker(storyId));
      storyCardElement.addEventListener("mouseenter", () => this.#openStoryMarker(storyId));
    });
  }

  #openStoryMarker(storyId) {
    const storyMarker = this.#storyMarkers.get(storyId);
    if (!storyMarker || !this.#map) return;

    this.#map.changeCamera(storyMarker.coordinate, 12);
    storyMarker.marker.openPopup();
    this.#setActiveStory(storyId);
  }

  #setActiveStory(storyId) {
    document.querySelectorAll("[data-story-id]").forEach((storyCardElement) => {
      storyCardElement.classList.toggle(
        "story-card-active",
        storyCardElement.dataset.storyId === storyId,
      );
    });
  }

  #setupFavoriteButtons() {
    document.querySelectorAll(".favorite-story-button").forEach((button) => {
      const storyId = button.dataset.favoriteId;
      const isFavorite = this.#favoriteStories.has(storyId);

      button.textContent = isFavorite ? "Saved" : "Save";
      button.classList.toggle("btn-primary", isFavorite);
      button.classList.toggle("btn-secondary", !isFavorite);

      button.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const story = this.#stories.find((item) => item.id === storyId);
        if (!story) return;

        if (this.#favoriteStories.has(storyId)) {
          await deleteFavoriteStory(storyId);
        } else {
          await saveFavoriteStory(story);
        }

        await this.#applyStoryFilters();
      });
    });

    document.querySelectorAll(".delete-story-button").forEach((button) => {
      button.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const storyId = button.dataset.deleteStoryId;

        await deleteFavoriteStory(storyId);
        await deleteStoryById(storyId);
        this.#stories = this.#stories.filter((story) => story.id !== storyId);
        this.#showAlert("Berhasil", "Story berhasil dihapus dari penyimpanan lokal.");
        await this.#applyStoryFilters();
      });
    });
  }

  async #setupPushToggle() {
    const button = document.getElementById("push-toggle-button");

    if (!isPushSupported()) {
      button.textContent = "Notifications Unsupported";
      button.setAttribute("disabled", "true");
      return;
    }

    const updateButton = async () => {
      const subscription = await getPushSubscription();
      button.innerHTML = subscription
        ? '<i data-lucide="bell-off" aria-hidden="true"></i> Unsubscribe'
        : '<i data-lucide="bell" aria-hidden="true"></i> Subscribe';
      button.classList.toggle("btn-primary", !!subscription);
      button.classList.toggle("btn-secondary", !subscription);
      this.#renderIcons();
    };

    await updateButton();

    button.addEventListener("click", async () => {
      button.setAttribute("disabled", "true");

      try {
        const subscription = await getPushSubscription();
        if (subscription) {
          await unsubscribePushNotification();
          this.#showAlert("Berhasil", "Langganan push notification berhasil dinonaktifkan.");
        } else {
          await subscribePushNotification();
          this.#showAlert("Berhasil", "Langganan push notification berhasil diaktifkan.");
        }
      } catch (error) {
        this.#showAlert("Gagal", error?.message || "Gagal mengubah langganan notifikasi.");
      } finally {
        button.removeAttribute("disabled");
        await updateButton();
      }
    });
  }

  #setupAlert() {
    const alertElement = document.getElementById("app-alert");
    alertElement
      .querySelector("[data-alert-close]")
      .addEventListener("click", () => this.#hideAlert());

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !alertElement.hidden) {
        this.#hideAlert();
      }
    });
  }

  #showAlert(title, message) {
    const alertElement = document.getElementById("app-alert");
    document.getElementById("app-alert-title").textContent = title;
    document.getElementById("app-alert-message").textContent = message;
    alertElement.hidden = false;
    this.#renderIcons();

    clearTimeout(this.alertTimeout);
    this.alertTimeout = setTimeout(() => this.#hideAlert(), 2200);
  }

  #hideAlert() {
    document.getElementById("app-alert").hidden = true;
  }

  #renderIcons() {
    globalThis.lucide?.createIcons();
  }

  showLoader() {}
  hideLoader() {}
  mapLoader() {}
  mapLoaderHide() {}
}
