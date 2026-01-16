//keel-mobile/src/services/api.ts
import axios from "axios";
import * as SecureStore from "expo-secure-store";

const api = axios.create({
  baseURL: "http://192.168.86.247:5000",
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("accessToken");

  // Force headers to be correct AxiosHeaders type
  config.headers = {
    ...(config.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  } as any;

  return config;
});

export default api;
