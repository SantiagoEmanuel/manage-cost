import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/** Rutas de auth donde un 401 es un resultado esperado (no hay que refrescar ni redirigir). */
const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/refresh"];

/** Promesa compartida para evitar múltiples refresh simultáneos. */
let refreshPromise: Promise<void> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original = err.config as RetriableConfig | undefined;
    const status = err.response?.status;
    const url = original?.url ?? "";
    const isAuthRoute = AUTH_PATHS.some((p) => url.includes(p));

    if (status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        refreshPromise ??= axios
          .post("/api/auth/refresh", {}, { withCredentials: true })
          .then(() => undefined);
        await refreshPromise;
        return api(original);
      } catch {
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/login"
        ) {
          window.location.href = "/login";
        }
        return Promise.reject(err);
      } finally {
        refreshPromise = null;
      }
    }

    return Promise.reject(err);
  },
);
