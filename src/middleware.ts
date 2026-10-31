import { NextRequest, NextResponse } from "next/server";
import { publicEnv } from "./lib/env";
import { homeForUser, type AuthUser } from "./lib/auth-types";
export async function middleware(request: NextRequest) {
  const token = request.cookies.get("sijago_session")?.value;
  let user: AuthUser | null = null;
  if (token && /^[a-f0-9]{64}$/.test(token)) {
    try {
      const response = await fetch(`${publicEnv.apiBaseUrl}/auth/me`, { headers: { Cookie: `sijago_session=${token}` }, cache: "no-store", signal: AbortSignal.timeout(10000) });
      const result = await response.json();
      if (response.ok && result.success) user = result.data.user;
    } catch { /* Fail closed if the session cannot be validated. */ }
  }
  if (!user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  const path = request.nextUrl.pathname;
  if ((user.role === "PETUGAS_INSTANSI" && path.startsWith("/admin")) || (user.role === "AUDITOR" && path !== "/admin/audit")) return NextResponse.redirect(new URL(homeForUser(user), request.url));
  const headers = new Headers(request.headers);
  headers.set("x-sijago-path", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.next({ request: { headers } });
}
export const config = { matcher: ["/admin/:path*", "/instansi/:path*"] };
