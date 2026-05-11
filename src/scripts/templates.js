const getNavigationClass = (activeRoute, targetRoute) =>
  activeRoute === targetRoute ? "btn btn-primary" : "btn btn-secondary";

export const generateNavigation = (activeRoute = "") => {
  return `
        <div class="flex flex-col md:flex-row items-start md:items-center gap-3">
          <a href="#/login" class="${getNavigationClass(activeRoute, "/login")}">Login</a>
          <a href="#/register" class="${getNavigationClass(activeRoute, "/register")}">Register</a>
        </div>
    `;
};

export const generateNavigationAfterLogin = (activeRoute = "") => {
  return `
        <div class="flex flex-col md:flex-row items-start md:items-center gap-3">
          <a href="#/" class="${getNavigationClass(activeRoute, "/")}">Stories</a>
          <a href="#/add-story" class="${getNavigationClass(activeRoute, "/add-story")}">Add Story</a>
          <a href="#/about" class="${getNavigationClass(activeRoute, "/about")}">About</a>
          <button id="logout-button" class="btn btn-secondary">Logout</button>
        </div>
    `;
};

export const storyCard = (story) => {
  return `
     <article class="card story-card" data-story-id="${story.id}">
        <a href="#/story/${story.id}" class="block">
          <div class="relative aspect-4/3 bg-white">
            <img
              src="${story.photoUrl}"
              alt="${story.name}"
              class="w-full h-full object-cover"
            />
          </div>
        </a>
        <div class="flex flex-col gap-4 p-5">
          <div class="flex flex-col gap-2">
            <p class="text-xs font-heading uppercase text-muted">${new Date(story.createdAt).toLocaleDateString()}</p>
            <h2 class="text-xl leading-tight">
              <a href="#/story/${story.id}" class="hover:text-main">${story.name}</a>
            </h2>
          </div>
          <p class="line-clamp-2 text-sm text-muted leading-6">${story.description}</p>
          <div class="flex items-center justify-between gap-3 border-t border-border pt-4 text-sm">
            <p class="text-muted line-clamp-1">${story.location?.placeName || "Location not found"}</p>
            <a href="#/story/${story.id}" class="font-heading text-main shrink-0">View</a>
          </div>
          <div class="flex flex-wrap gap-3">
            <button class="btn btn-secondary w-fit favorite-story-button" type="button" data-favorite-id="${story.id}">
              Save
            </button>
            <button class="btn btn-danger w-fit delete-story-button" type="button" data-delete-story-id="${story.id}">
              Delete
            </button>
          </div>
        </div>
      </article>
    `;
};
