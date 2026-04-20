import { createHttpClient } from './httpClient';
import { getToken } from '../authStorage';

// Frontend talks to a same-origin path (/external-api).
// Nginx (and Vite in dev) proxy this to the real upstream defined by VITE_API_BASE_URL.
const baseUrl = '/external-api';
const apiKey = import.meta.env.VITE_API_KEY ?? '';

export const httpClient = createHttpClient({
  baseUrl,
  apiKey,
  getToken,
});

// Add your API services here, for example:
// export const myFeatureApi = createMyFeatureService(httpClient);

