const DB_NAME = "storyyy-db";
const DB_VERSION = 2;
const STORES = {
  STORIES: "stories",
  FAVORITES: "favorites",
  PENDING_STORIES: "pending-stories",
};

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORES.STORIES)) {
        db.createObjectStore(STORES.STORIES, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(STORES.FAVORITES)) {
        db.createObjectStore(STORES.FAVORITES, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(STORES.PENDING_STORIES)) {
        db.createObjectStore(STORES.PENDING_STORIES, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      const storeNames = Object.values(STORES);
      const missingStore = storeNames.find(
        (storeName) => !db.objectStoreNames.contains(storeName),
      );

      if (missingStore) {
        db.close();
        reject(new Error(`IndexedDB store "${missingStore}" is missing.`));
        return;
      }

      resolve(db);
    };
    request.onerror = () => reject(request.error);
  });
}

async function withStore(storeName, mode, callback) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = callback(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
      transaction.onerror = () => reject(transaction.error);
    } catch (error) {
      db.close();
      reject(error);
    }
  });
}

export async function saveStories(stories) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.STORIES, "readwrite");
    const store = transaction.objectStore(STORES.STORIES);

    stories.forEach((story) => store.put(story));

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

export function getAllStories() {
  return withStore(STORES.STORIES, "readonly", (store) => store.getAll());
}

export function getStoryById(id) {
  return withStore(STORES.STORIES, "readonly", (store) => store.get(id));
}

export function deleteStoryById(id) {
  return withStore(STORES.STORIES, "readwrite", (store) => store.delete(id));
}

export function saveFavoriteStory(story) {
  return withStore(STORES.FAVORITES, "readwrite", (store) =>
    store.put({ ...story, savedAt: new Date().toISOString() }),
  );
}

export function deleteFavoriteStory(id) {
  return withStore(STORES.FAVORITES, "readwrite", (store) => store.delete(id));
}

export function getFavoriteStory(id) {
  return withStore(STORES.FAVORITES, "readonly", (store) => store.get(id));
}

export function getAllFavoriteStories() {
  return withStore(STORES.FAVORITES, "readonly", (store) => store.getAll());
}

export function addPendingStory(story) {
  return withStore(STORES.PENDING_STORIES, "readwrite", (store) =>
    store.add({ ...story, createdAt: new Date().toISOString() }),
  );
}

export function deletePendingStory(id) {
  return withStore(STORES.PENDING_STORIES, "readwrite", (store) => store.delete(id));
}

export function getAllPendingStories() {
  return withStore(STORES.PENDING_STORIES, "readonly", (store) => store.getAll());
}
