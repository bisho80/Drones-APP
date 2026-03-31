import axios from "axios";

// Central API URL configuration using environment variable.
// This allows easy environment switching without code changes.
const runtimeHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
export const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${runtimeHost}:5163`;

// Shared axios instance for all backend calls.
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize API errors so Redux slices can show user-friendly messages.
export function getApiErrorMessage(error) {
  if (error?.response?.data) {
    if (typeof error.response.data === "string") return error.response.data;
    if (error.response.data.title) return error.response.data.title;
  }
  if (error?.message) return error.message;
  return "Unexpected network error.";
}
