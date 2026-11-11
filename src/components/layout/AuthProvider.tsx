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
  const checkedPublicOnce = useRef(false);
  const protectedPage = pathname.startsWith("/admin/") || pathname.startsWith("/instansi/") || pathname === "/theme-guide" || pathname.startsWith("/theme-guide/");

  useEffect(() => {
    if (!protectedPage && checkedPublicOnce.current) {
      return;
    }
    const current = ++version.current;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;

    const runCheck = () => {
      setLoading(true);
      apiFetch<{ user: AuthUser }>("/auth/me")
        .then(res => {
          if (version.current !== current) return;
          checkedPublicOnce.current = true;
          if (res.success && res.data) setUser(res.data.user);
          else {
            setUser(null);
            if (protectedPage && res.error?.code === "AUTH_REQUIRED") {
              router.replace(`/login?next=${encodeURIComponent(pathname)}`);
            }
          }
        })
        .catch(() => {
          if (version.current === current) setUser(null);
        })
        .finally(() => {
          if (version.current === current) setLoading(false);
        });
    };

    if (protectedPage) {
      runCheck();
    } else if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(runCheck, { timeout: 180 });
    } else {
      timerId = setTimeout(runCheck, 80);
    }

    return () => {
      version.current++;
      if (idleId !== null && typeof window !== "undefined" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timerId !== null) clearTimeout(timerId);
    };
  }, [pathname, protectedPage, router]);

  useEffect(() => {
    const expired = () => {
      checkedPublicOnce.current = false;
      setUser(null);
      if (protectedPage) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        router.refresh();
      }
    };
    window.addEventListener("sijago:session-expired", expired);
    return () => window.removeEventListener("sijago:session-expired", expired);
  }, [pathname, protectedPage, router]);

  const logout = useCallback(async () => {
    const response = await apiFetch("/auth/logout", { method: "POST", body: "{}" });
    if (!response.success) throw new Error(response.error?.detail || "Belum berhasil keluar. Silakan coba lagi.");
    version.current++;
    checkedPublicOnce.current = false;
    setUser(null);
    window.location.assign("/login");
  }, []);

  return <AuthContext.Provider value={{ user, loading, setAuthenticatedUser: user => { version.current++; checkedPublicOnce.current = true; setUser(user); setLoading(false); }, logout }}>{children}</AuthContext.Provider>;
}
