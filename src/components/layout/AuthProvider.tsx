"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { AuthUser } from "@/lib/auth-types";

const AuthContext = createContext<{ user: AuthUser | null; loading: boolean; setAuthenticatedUser: (user: AuthUser) => void; logout: () => Promise<void> }>({ user: null, loading: true, setAuthenticatedUser: () => {}, logout: async () => {} });
export const useAuth = () => useContext(AuthContext);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const version = useRef(0);
  const protectedPage = pathname.startsWith("/admin/") || pathname.startsWith("/instansi/") || pathname === "/theme-guide" || pathname.startsWith("/theme-guide/");
  useEffect(() => {
    const current = ++version.current;
    setLoading(true);
    apiFetch<{ user: AuthUser }>("/auth/me").then(res => {
      if (version.current !== current) return;
      if (res.success && res.data) setUser(res.data.user);
      else { setUser(null); if (protectedPage && res.error?.code === "AUTH_REQUIRED") router.replace(`/login?next=${encodeURIComponent(pathname)}`); }
    }).catch(() => { if (version.current === current) setUser(null); }).finally(() => { if (version.current === current) setLoading(false); });
    return () => { version.current++; };
  }, [pathname, protectedPage, router]);
  useEffect(() => {
    const expired = () => { setUser(null); if (protectedPage) { router.replace(`/login?next=${encodeURIComponent(pathname)}`); router.refresh(); } };
    window.addEventListener("sijago:session-expired", expired);
    return () => window.removeEventListener("sijago:session-expired", expired);
  }, [pathname, protectedPage, router]);
  const logout = useCallback(async () => {
    const response = await apiFetch("/auth/logout", { method: "POST", body: "{}" });
    if (!response.success) throw new Error(response.error?.detail || "Belum berhasil keluar. Silakan coba lagi.");
    version.current++; setUser(null);
    window.location.assign("/login");
  }, []);
  return <AuthContext.Provider value={{ user, loading, setAuthenticatedUser: user => { version.current++; setUser(user); setLoading(false); }, logout }}>{children}</AuthContext.Provider>;
}
