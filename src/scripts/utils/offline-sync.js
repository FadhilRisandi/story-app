import { AddStory } from "../data/api";
import { convertBase64ToBlob, convertBlobToBase64 } from "./index";
import {
  addPendingStory,
  deletePendingStory,
  getAllPendingStories,
} from "./idb";

export async function queueStoryForSync({ description, photo, lat, lon }) {
  const photoBase64 = await convertBlobToBase64(photo);

  return addPendingStory({
    description,
    lat,
    lon,
    photo: {
      base64: photoBase64,
      name: photo.name || "story-photo.jpg",
      type: photo.type || "image/jpeg",
    },
  });
}

export async function syncPendingStories() {
  if (!navigator.onLine) {
    return [];
  }

  const pendingStories = await getAllPendingStories();
  const syncedStories = [];

  for (const pendingStory of pendingStories) {
    const [metadata, base64Data] = pendingStory.photo.base64.split(",");
    const mimeType =
      metadata?.match(/data:(.*);base64/)?.[1] || pendingStory.photo.type;
    const photoBlob = convertBase64ToBlob(base64Data, mimeType);
    const photo = new File([photoBlob], pendingStory.photo.name, {
      type: mimeType,
    });

    await AddStory({
      description: pendingStory.description,
      photo,
      lat: pendingStory.lat,
      lon: pendingStory.lon,
    });
    await deletePendingStory(pendingStory.id);
    syncedStories.push(pendingStory);
  }

  return syncedStories;
}
