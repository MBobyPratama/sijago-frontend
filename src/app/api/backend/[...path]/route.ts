import { NextRequest, NextResponse } from "next/server";
import { publicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  if (path.some(part => part === "." || part === ".." || /[\\/]/.test(part))) return NextResponse.json({ success: false, error: { code: "INVALID_PATH", detail: "Alamat API tidak valid." } }, { status: 400 });
  const mutating = !["GET", "HEAD", "OPTIONS"].includes(request.method);
  if (mutating && request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ success: false, error: { code: "INVALID_ORIGIN", detail: "Asal permintaan tidak diizinkan." } }, { status: 403 });
  const headers = new Headers();
  headers.set("Content-Type", request.headers.get("content-type") || "application/json");
  const token = request.cookies.get("sijago_session")?.value;
  if (token && /^[a-f0-9]{64}$/.test(token)) headers.set("Cookie", `sijago_session=${token}`);
  if (request.headers.has("origin")) headers.set("Origin", request.headers.get("origin")!);
  for (const name of ["x-device-id", "idempotency-key"]) if (request.headers.has(name)) headers.set(name, request.headers.get(name)!);
  try {
    const upstream = await fetch(`${publicEnv.apiBaseUrl.replace(/\/$/, "")}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`, { method: request.method, headers, body: mutating ? await request.arrayBuffer() : undefined, cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(45000) });
    const response = new NextResponse(upstream.body, { status: upstream.status });
    for (const name of ["content-type", "content-disposition", "content-security-policy", "retry-after"]) if (upstream.headers.has(name)) response.headers.set(name, upstream.headers.get(name)!);
    response.headers.set("Cache-Control", "no-store");
    for (const cookie of upstream.headers.getSetCookie()) if (cookie.startsWith("sijago_session=")) response.headers.append("Set-Cookie", cookie);
    return response;
  } catch {
    return NextResponse.json({ success: false, error: { code: "BACKEND_UNAVAILABLE", detail: "Server belum dapat dihubungi. Silakan coba lagi." } }, { status: 503 });
  }
}
export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
