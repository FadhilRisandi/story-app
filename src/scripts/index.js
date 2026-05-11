// CSS imports
import "../styles/styles.css";
import "leaflet/dist/leaflet.css";
import "toastify-js/src/toastify.css";

import App from "./pages/app";
import { registerServiceWorker } from "./utils/push-notification";
import { syncPendingStories } from "./utils/offline-sync";

document.addEventListener("DOMContentLoaded", async () => {
  await registerServiceWorker();
  syncPendingStories().catch(console.error);

  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#hamburger-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
    mobileDrawerContainer: document.querySelector("#mobile-navigation-drawer"),
    skipToContentButton: document.querySelector("#skip-to-content-button"),
  });
  await app.renderPage();

  window.addEventListener("hashchange", async () => {
    await app.renderPage();
  });

  window.addEventListener("online", () => {
    syncPendingStories().catch(console.error);
  });
});
