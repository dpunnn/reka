import axios from "axios";
import { useAuthStore } from "@/lib/store/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8010/api/v1";
const SERVER_ROOT = API_URL.replace(/\/api\/v1\/?$/, "");

export const api = axios.create({
  baseURL: API_URL,
});

/** Bangun URL absolut untuk file yang diserve backend (mis. foto produk),
 * dari path relatif seperti "/uploads/produk/xxx.jpg" yang dikembalikan API. */
export function fileUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${SERVER_ROOT}${path}`;
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
