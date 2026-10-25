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
