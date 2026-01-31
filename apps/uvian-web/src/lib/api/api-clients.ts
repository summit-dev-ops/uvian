import { createApiClient } from './api-factory';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiBaseUrl) {
  throw new Error("API base URLs are not defined in environment variables.");
}

export const apiClient = createApiClient(apiBaseUrl);