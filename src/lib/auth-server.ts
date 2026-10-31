import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { publicEnv } from "./env";
import { homeForUser, type AuthUser } from "./auth-types";

export async function requirePortalUser(portal: "admin" | "agency") {
  const token = (await cookies()).get("sijago_session")?.value;
  const path = (await headers()).get("x-sijago-path") || (portal === "admin" ? "/admin/moderasi" : "/instansi/laporan");
  let user: AuthUser | null = null;
  if (token && /^[a-f0-9]{64}$/.test(token)) {
    try {
      const response = await fetch(`${publicEnv.apiBaseUrl}/auth/me`, { headers: { Cookie: `sijago_session=${token}` }, cache: "no-store", signal: AbortSignal.timeout(10000) });
      const data = await response.json();
      if (response.ok && data.success) user = data.data.user;
    } catch { /* No session is accepted when the backend cannot validate it. */ }
  }
  if (!user) redirect(`/login?next=${encodeURIComponent(path)}`);
  if (portal === "admin" && user.role === "PETUGAS_INSTANSI") redirect(homeForUser(user));
  if (user.role === "AUDITOR" && (portal !== "admin" || !path.startsWith("/admin/audit"))) redirect(homeForUser(user));
  return user;
}
