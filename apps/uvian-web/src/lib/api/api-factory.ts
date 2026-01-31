"use client"
import axios, { AxiosInstance } from "axios";
import { createClient } from "../supabase/client";

async function fetchAuthSession() {
  const authClient = createClient();
  const { data } = await authClient.auth.getSession();
  return data.session;
}

/**
 * Creates a pre-configured Axios client instance.
 * @param baseURL The base URL for the specific API.
 * @returns An AxiosInstance with authentication interceptors configured.
 */
export function createApiClient(baseURL: string): AxiosInstance {
  const apiClient = axios.create({
    baseURL,
  });

  apiClient.interceptors.request.use(
    async (config) => {
      try {
        const session = await fetchAuthSession();
        const accessToken = session?.access_token.toString();

        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      } catch (error) {
        console.log("No active session. Requesting public resource.");
        return config;
      }
    },
    (error) => Promise.reject(error)
  );

  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.error("Unauthorized. Token might be expired or invalid.");
      }
      return Promise.reject(error);
    }
  );

  return apiClient;
}

/**
 * Generates the essential headers for making a secure, authenticated API call.
 * This is the perfect helper for `fetch` based streaming requests.
 * @returns A headers object with Content-Type and the Authorization Bearer token.
 */
export async function getAuthenticatedHeaders() {
  try {
    const session = await fetchAuthSession();
    const accessToken = session?.access_token.toString();

    if (!accessToken) {
      throw new Error("User is not authenticated");
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
  } catch (error) {
    console.error("Failed to get auth session:", error);
    // Rethrow or handle the error as appropriate for your app
    throw new Error("Authentication session error. Please log in again.");
  }
}
