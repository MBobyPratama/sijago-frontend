import { publicEnv } from "./env";

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: { title: string; detail: string; code: string } }> {
  const res = await fetch(`${publicEnv.apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  return res.json();
}

export function getClientFingerprint(): string {
  if (typeof window === "undefined") return "server-ssr-fp";
  const key = "sijago_client_fp";
  let fp = window.localStorage.getItem(key);
  if (!fp) {
    fp = `fp-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
    window.localStorage.setItem(key, fp);
  }
  return fp;
}
