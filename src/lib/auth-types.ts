export type AuthRole = "ADMIN" | "SUPER_ADMIN" | "AUDITOR" | "PETUGAS_INSTANSI";
export interface AuthUser { id: string; email: string; fullName: string; role: AuthRole; agencyId: string | null; agencyCode: string | null; agencyName: string | null }
export const homeForUser = (user: AuthUser) => user.role === "PETUGAS_INSTANSI" ? "/instansi/laporan" : user.role === "AUDITOR" ? "/admin/audit" : "/admin/moderasi";
export function canAccessPortalPath(user: AuthUser, path: string): boolean {
  const pathname = path.split("?")[0];
  if (pathname === "/theme-guide" || pathname.startsWith("/theme-guide/")) return user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  if (pathname === "/instansi" || pathname.startsWith("/instansi/")) return user.role === "PETUGAS_INSTANSI";
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return user.role === "ADMIN" || user.role === "SUPER_ADMIN" || (user.role === "AUDITOR" && pathname === "/admin/audit");
  return false;
}
export function safeLoginDestination(next: string | null, user: AuthUser): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return homeForUser(user);
  const allowed = user.role === "PETUGAS_INSTANSI" ? ["/instansi/laporan", "/instansi/weather-intelligence"] : user.role === "AUDITOR" ? ["/admin/audit"] : ["/admin/moderasi", "/admin/audit", "/admin/pengaturan", "/theme-guide"];
  const path = next.split("?")[0];
  return allowed.includes(path) ? next : homeForUser(user);
}
