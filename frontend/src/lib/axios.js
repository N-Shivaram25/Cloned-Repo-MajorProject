import axios from "axios";

// Prefer explicit backend URL set via Vite env: `VITE_BACKEND_URL` (e.g. https://api.example.com)
// In development fall back to localhost; in production fall back to relative `/api`.
const envBackend = import.meta.env.VITE_BACKEND_URL;
const BASE_URL =
  envBackend || (import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api");

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send cookies with the request
});
