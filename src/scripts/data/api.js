import CONFIG from "../config";
import { getAccessToken } from "../utils/auth";

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  STORIES: (page = 1, size = 10, location = 0) =>
    `${CONFIG.BASE_URL}/stories?page=${page}&size=${size}&location=${location}`,
  ADD_STORY: `${CONFIG.BASE_URL}/stories`,
  STORY: (id) => `${CONFIG.BASE_URL}/stories/${id}`,
  NOTIFICATION_SUBSCRIBE: `${CONFIG.BASE_URL}/notifications/subscribe`,
};

export const AuthUserRegister = async (value) => {
  const response = await fetch(ENDPOINTS.REGISTER, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(value),
  });
  const result = await response.json();

  if (result?.error) {
    throw new Error(result.message);
  }

  return result.message;
};

export const AuthUserLogin = async (value) => {
  const response = await fetch(ENDPOINTS.LOGIN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(value),
  });

  const result = await response.json();

  if (result?.error) {
    throw new Error(result.message);
  }

  return result;
};

export const GetStories = async () => {
  const response = await fetch(ENDPOINTS.STORIES(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });

  const result = await response.json();

  if (result?.error) {
    throw new Error(result.message);
  }

  return result;
};

export const GetStory = async (id) => {
  const response = await fetch(ENDPOINTS.STORY(id), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });

  const result = await response.json();

  if (result?.error) {
    throw new Error(result.message);
  }

  return result;
};

export const AddStory = async ({ description, photo, lat, lon }) => {
  const formData = new FormData();
  formData.set("description", description);
  formData.set("photo", photo);

  if (lat !== "" && lat != null) formData.set("lat", lat);
  if (lon !== "" && lon != null) formData.set("lon", lon);

  const response = await fetch(ENDPOINTS.ADD_STORY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: formData,
  });

  const result = await response.json();

  if (result?.error) {
    throw new Error(result.message);
  }

  return result;
};

export const SubscribePushNotification = async (subscription) => {
  const response = await fetch(ENDPOINTS.NOTIFICATION_SUBSCRIBE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify(subscription),
  });

  const result = await response.json();

  if (result?.error) {
    throw new Error(result.message);
  }

  return result;
};

export const UnsubscribePushNotification = async (endpoint) => {
  const response = await fetch(ENDPOINTS.NOTIFICATION_SUBSCRIBE, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify({ endpoint }),
  });

  const result = await response.json();

  if (result?.error) {
    throw new Error(result.message);
  }

  return result;
};
