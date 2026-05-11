import LoginPresenter from "./login-presenter";
import * as StoryAPI from "../../../data/api";
import * as AuthUtils from "../../../utils/auth";

export default class LoginPage {
  #presenter = null;

  async render() {
    return `
    <section
      class="max-w-md mx-auto min-h-[90vh] px-4 pt-24 flex flex-col gap-5 items-center justify-center"
    >
      <div class="text-center">
        <p class="eyebrow">Welcome back</p>
        <h1 class="text-4xl font-bold leading-tight">Login to Storyyy</h1>
      </div>
      <form id="login-form" class="form-card w-full">
        <div class="flex flex-col gap-2">
          <label for="email" class="cs-label"> Email </label>
          <input
            id="email"
            name="email"
            type="email"
            class="cs-input"
            placeholder="Masukan email kamu"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="password" class="cs-label"> Password </label>
          <input
            id="password"
            name="password"
            type="password"
            class="cs-input"
            placeholder="Masukan password kamu"
          />
        </div>
        <button id="login-btn" class="btn btn-primary">Login</button>
      </form>
    </section>
    `;
  }

  async afterRender() {
    this.#presenter = new LoginPresenter({
      view: this,
      model: StoryAPI,
      authModel: AuthUtils,
    });

    this.setupForm();
  }

  setupForm() {
    const form = document.getElementById("login-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const data = {
        email: document.getElementById("email")?.value,
        password: document.getElementById("password")?.value,
      };

      this.#presenter.onLogin(data);
    });
  }

  showLoader() {
    const btn = document.getElementById("login-btn");
    btn.innerHTML = "Loading...";
    btn.setAttribute("disabled", "true");
  }

  hideLoader() {
    const btn = document.getElementById("login-btn");
    btn.innerHTML = "Login";
    btn.removeAttribute("disabled");
  }
}
