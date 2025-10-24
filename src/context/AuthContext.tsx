"use client";

import { api } from "@/network/axiosConfig";
import { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Tokens = { accessToken: string; refreshToken: string };

type AuthContextType = {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokenFunc: () => Promise<string | null>;
  setTokens: (tokens: Tokens) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

function setAuthHeader(cfg: { headers?: any }, token: string) {
  cfg.headers = cfg.headers ?? {};
  if (cfg.headers instanceof AxiosHeaders || typeof (cfg.headers as any).set === "function") {
    (cfg.headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
  } else {
    (cfg.headers as Record<string, any>)["Authorization"] = `Bearer ${token}`;
  }
}

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

function getPath(url?: string) {
  try {
    return new URL(url || "", (api.defaults as any).baseURL).pathname || "";
  } catch {
    return url || "";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // Cargar tokens de localStorage (individualmente)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const a = localStorage.getItem("accessToken");
    const r = localStorage.getItem("refreshToken");
    if (a) setAccessToken(a);
    if (r) setRefreshToken(r);
  }, []);

  const setTokens = useCallback((tokens: Tokens) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);
    }
    setAccessToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
  }, []);

  const clearTokens = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
    setAccessToken(null);
    setRefreshToken(null);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const e = (email ?? "").trim();
      const p = (password ?? "").trim();
      if (!e || !p) throw new Error("Ingresa tu correo y contraseña.");

      const url = "/auth/loginadmin";
      console.debug("POST", (api.defaults as any).baseURL + url, { email: e, hasPassword: !!p });

      try {
        const res = await api.post(
          url,
          JSON.stringify({ email: e, password: p }),
          { headers: { "Content-Type": "application/json" } }
        );

        const { token, refreshToken: rt, access_token, refresh_token } = res.data || {};
        const finalAccess = token ?? access_token;
        const finalRefresh = rt ?? refresh_token;

        if (!finalAccess || !finalRefresh) throw new Error("Respuesta inválida del servidor.");
        setTokens({ accessToken: finalAccess, refreshToken: finalRefresh });
      } catch (err: any) {
        const st = err?.response?.status;
        if (st === 400) throw new Error("Datos inválidos: verifica correo y contraseña.");
        if (st === 401) throw new Error("Credenciales incorrectas.");
        if (err?.message?.includes("Network")) throw new Error("Sin conexión con el servidor.");
        throw new Error("No es posible ingresar.");
      }
    },
    [setTokens]
  );

  const logout = useCallback(async () => {
    try {
      if (accessToken && refreshToken) {
        await api.post(
          `/auth/logout`,
          JSON.stringify({ token: refreshToken }),
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
      }
    } catch {
      // Ignorar errores de logout
    } finally {
      clearTokens();
    }
  }, [accessToken, refreshToken, clearTokens]);

  const refreshTokenFunc = useCallback(async (): Promise<string | null> => {
    if (!refreshToken) return null;
    try {
      const res = await api.post(
        `/auth/refresh`,
        JSON.stringify({ token: refreshToken }), // usa { refreshToken } si tu backend lo requiere
        { headers: { "Content-Type": "application/json" } }
      );
      if (res.status < 200 || res.status > 299) { await logout(); return null; }
      const { access_token, token } = res.data || {};
      const newAccess = access_token ?? token;
      if (!newAccess) throw new Error("Missing access_token");
      setTokens({ accessToken: newAccess, refreshToken });
      return newAccess;
    } catch (e) {
      console.error("Refresh failed:", e);
      await logout();
      return null;
    }
  }, [refreshToken, logout, setTokens]);

  useEffect(() => {
    const reqId = api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const path = getPath(config.url);
      const isAuthPath = typeof path === "string" && path.startsWith("/auth/");
      if (accessToken && !isAuthPath) {
        const already =
          config.headers instanceof AxiosHeaders
            ? (config.headers as AxiosHeaders).get("Authorization")
            : (config.headers as any)?.Authorization;
        if (!already) setAuthHeader(config, accessToken);
      }
      return config;
    });

    const resId = api.interceptors.response.use(
      (res) => res,
      async (error) => {
        const status: number | undefined = error?.response?.status;
        const originalConfig: RetryableConfig = error?.config ?? {};
        const path = getPath(originalConfig?.url);
        const isAuthPath = typeof path === "string" && path.startsWith("/auth/");

        if (status === 401 && !originalConfig._retry && !isAuthPath) {
          originalConfig._retry = true;
          try {
            // USAR SIEMPRE el token devuelto por refreshTokenFunc()
            const fresh = await refreshTokenFunc();
            if (fresh) {
              setAuthHeader(originalConfig, fresh);
              return api(originalConfig);
            }
            await logout();
            return Promise.reject(error);
          } catch (e) {
            await logout();
            return Promise.reject(e);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(reqId);
      api.interceptors.response.eject(resId);
    };
  }, [accessToken, refreshTokenFunc, logout]);

  const value = useMemo<AuthContextType>(
    () => ({
      accessToken,
      refreshToken,
      isAuthenticated: accessToken !== null,
      login,
      logout,
      refreshTokenFunc,
      setTokens,
    }),
    [accessToken, refreshToken, login, logout, refreshTokenFunc, setTokens]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
