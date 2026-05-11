import Toastify from "toastify-js";
import { queueStoryForSync, syncPendingStories } from "../../utils/offline-sync";

export default class AddStoryPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async onAddStory(body) {
    this.#view.showLoader();

    try {
      if (!navigator.onLine) {
        await queueStoryForSync(body);

        Toastify({
          text: "Story saved offline. It will be synced when you are online.",
          className: "info",
        }).showToast();

        location.href = "#/";
        return;
      }

      const response = await this.#model.AddStory(body);

      Toastify({
        text: response?.message || "Story added",
        className: "info",
      }).showToast();

      location.href = "#/";
    } catch (error) {
      if (!navigator.onLine || error instanceof TypeError) {
        await queueStoryForSync(body);

        Toastify({
          text:
            "Network problem. Story saved offline and will be synced automatically.",
          className: "info",
        }).showToast();
        location.href = "#/";
        return;
      }

      Toastify({
        text: error?.message || "Failed to add story",
        className: "error",
      }).showToast();
      console.log(error);
    } finally {
      this.#view.hideLoader();
    }
  }

  async onSyncPendingStories() {
    try {
      const syncedStories = await syncPendingStories();

      if (syncedStories.length > 0) {
        Toastify({
          text: `${syncedStories.length} offline story synced.`,
          className: "info",
        }).showToast();
      }
    } catch (error) {
      console.log(error);
    }
  }
}
