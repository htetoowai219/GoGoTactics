import axios from "axios";
import { apiBaseUrl } from "../lib/runtimeConfig";

export const api = axios.create({
  baseURL: apiBaseUrl(),
  withCredentials: true,
});

export function getApiErrorMessage(
  err: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message || err.message || fallback;
  }
  return fallback;
}
