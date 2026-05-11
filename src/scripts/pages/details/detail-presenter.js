import { storyMapper } from "../../data/api-mapper";
import { getStoryById, saveStories } from "../../utils/idb";

export default class HomePresenter {
  #view;
  #model;

  constructor(storyId, { view, model }) {
    this.storyId = storyId;
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

  async onGetStory() {
    this.#view.showLoader();

    try {
      await this.initMap();
      const response = await this.#model.GetStory(this.storyId);
      const results = await storyMapper(response?.story);

      if (!results) {
        throw new Error("Story not found");
      }

      await saveStories([results]);
      this.#view.renderStory(response?.message || "success", results);
    } catch (error) {
      console.log(error);
      const cachedStory = await getStoryById(this.storyId);
      if (cachedStory) {
        this.#view.renderStory("offline", cachedStory);
      }
    } finally {
      this.#view.hideLoader();
    }
  }

}
