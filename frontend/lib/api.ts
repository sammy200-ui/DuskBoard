import axios from "axios";

const AUTH_STORAGE_KEY = "dusk-auth-store";

const readPersistedAccessToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as {
      state?: {
        accessToken?: string | null;
      };
    };

    return parsed.state?.accessToken ?? null;
  } catch {
    return null;
  }
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api",
  timeout: 15_000,
});

api.interceptors.request.use((config) => {
  const accessToken = readPersistedAccessToken();
  if (accessToken) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

export default api;