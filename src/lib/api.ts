export const browserApiBaseUrl = "/api/backend";

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: { title: string; detail: string; code: string } }> {
  const res = await fetch(`${browserApiBaseUrl}${path}`, {
    ...options,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  const result = await res.json();
  if (res.status === 401 && result?.error?.code === "AUTH_REQUIRED" && !path.startsWith("/auth/") && typeof window !== "undefined") window.dispatchEvent(new Event("sijago:session-expired"));
  return result;
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
