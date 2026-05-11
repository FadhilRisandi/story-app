import Toastify from "toastify-js";

export default class LoginPresenter {
  #view;
  #model;
  #authModel;

  constructor({ view, model, authModel }) {
    this.#view = view;
    this.#model = model;
    this.#authModel = authModel;
  }

  async onLogin(body) {
    this.#view.showLoader();

    try {
      const response = await this.#model.AuthUserLogin({
        email: body.email,
        password: body.password,
      });

      this.#authModel.putAccessToken(response.loginResult.token);

      Toastify({
        text: response.message,
        className: "info",
      }).showToast();

      location.href = "#/";
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