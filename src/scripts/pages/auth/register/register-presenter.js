import Toastify from "toastify-js";

export default class RegisterPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async onRegister(body) {
    this.#view.showLoader();

    try {
      const response = await this.#model.AuthUserRegister({
        name: body.name,
        email: body.email,
        password: body.password,
      });
      Toastify({
        text: response,
        className: "info",
      }).showToast();

      location.href = "#/login";
    } catch (error) {
      Toastify({
        text: error?.message,
        className: "error",
      }).showToast();
      console.log(error);
    } finally {
      this.#view.hideLoader();
    }
  }
}