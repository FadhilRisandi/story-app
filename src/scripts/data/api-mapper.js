import Map from "../utils/map";

export async function storyMapper(story) {
  if (!story) {
    return null;
  }

  const hasCoordinate = story.lat != null && story.lon != null;

  return {
    ...story,
    location: {
      placeName: hasCoordinate
        ? await Map.getPlaceNameByCoordinate(story.lat, story.lon)
        : "Location not found",
    },
  };
}
