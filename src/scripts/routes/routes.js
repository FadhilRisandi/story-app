import HomePage from "../pages/home/home-page";
import LoginPage from "../pages/auth/login/login-page";
import RegisterPage from "../pages/auth/register/register-page";
import {
  checkAuthenticatedRoute,
  checkUnauthenticatedRouteOnly,
} from "../utils/auth";
import DetailPage from "../pages/details/detail-page";
import AddStoryPage from "../pages/stories/add-story-page";
import AboutPage from "../pages/about/about-page";

const routes = {
  "/login": () => checkUnauthenticatedRouteOnly(new LoginPage()),
  "/register": () => checkUnauthenticatedRouteOnly(new RegisterPage()),

  "/": () => checkAuthenticatedRoute(new HomePage()),
  "/add-story": () => checkAuthenticatedRoute(new AddStoryPage()),
  "/about": () => checkAuthenticatedRoute(new AboutPage()),
  "/story/:id": () => checkAuthenticatedRoute(new DetailPage()),
};

export default routes;
