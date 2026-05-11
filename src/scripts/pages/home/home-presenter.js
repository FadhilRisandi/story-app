import { storyMapper } from "../../data/api-mapper";
import { getAllStories, saveStories } from "../../utils/idb";

export default class HomePresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async initMap() {
    this.#view.mapLoader();
    try {
      await this.#view.initialMap();
    } catch (error) {
      console.log(error);
    } finally {
      this.#view.mapLoaderHide();
    }
  }

  async onGetStories() {
    this.#view.showLoader();

    try {
      await this.initMap();
      const response = await this.#model.GetStories();

      const results = await Promise.all(
        response?.listStory?.map((story) => storyMapper(story)) || [],
      );
      await saveStories(results.filter(Boolean));

      this.#view.renderStories(
        response?.message || "success",
        results.filter(Boolean),
      );
    } catch (error) {
      console.log(error);
      const cachedStories = await getAllStories();
      this.#view.renderStories("offline", cachedStories);
    } finally {
      this.#view.hideLoader();
    }
  }
}
