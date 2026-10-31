export type AuthRole = "ADMIN" | "SUPER_ADMIN" | "AUDITOR" | "PETUGAS_INSTANSI";
export interface AuthUser { id: string; email: string; fullName: string; role: AuthRole; agencyId: string | null; agencyCode: string | null; agencyName: string | null }
export const homeForUser = (user: AuthUser) => user.role === "PETUGAS_INSTANSI" ? "/instansi/laporan" : user.role === "AUDITOR" ? "/admin/audit" : "/admin/moderasi";
export function safeLoginDestination(next: string | null, user: AuthUser): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return homeForUser(user);
  const allowed = user.role === "PETUGAS_INSTANSI" ? ["/instansi/laporan", "/instansi/weather-intelligence"] : user.role === "AUDITOR" ? ["/admin/audit"] : ["/admin/moderasi", "/admin/audit", "/admin/pengaturan", "/instansi/laporan", "/instansi/weather-intelligence"];
  const path = next.split("?")[0];
  return allowed.includes(path) ? next : homeForUser(user);
}
