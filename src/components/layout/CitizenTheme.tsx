"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sun, CloudSun, Moon } from "lucide-react";

import { type CitizenTheme, CITIZEN_THEME_STORAGE_KEY as STORAGE_KEY, parseCitizenTheme, isThemedRoute } from "./citizen-theme-config";

const ThemeContext = createContext<{ theme: CitizenTheme; changeTheme: (theme: CitizenTheme) => void }>({ theme: "classic", changeTheme: () => {} });


export function CitizenThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<CitizenTheme>("classic");

  useLayoutEffect(() => {
    try { setTheme(parseCitizenTheme(localStorage.getItem(STORAGE_KEY))); } catch { /* The selector still works if storage is unavailable. */ }
  }, []);

  useLayoutEffect(() => {
    if (isThemedRoute(pathname) && theme !== "classic") document.documentElement.dataset.citizenTheme = theme;
    else delete document.documentElement.dataset.citizenTheme;
  }, [theme, pathname]);

  useEffect(() => {
    const syncTheme = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) setTheme(parseCitizenTheme(event.newValue));
    };
    window.addEventListener("storage", syncTheme);
    return () => window.removeEventListener("storage", syncTheme);
  }, []);

  const changeTheme = (value: CitizenTheme) => {
    setTheme(value);
    try { localStorage.setItem(STORAGE_KEY, value); } catch { /* Keep the in-memory preference. */ }
  };

  return <ThemeContext.Provider value={{ theme, changeTheme }}>{children}</ThemeContext.Provider>;
}

export function useCitizenTheme(): CitizenTheme {
  const { theme } = useContext(ThemeContext);
  const pathname = usePathname();
  return isThemedRoute(pathname) ? theme : "classic";
}

export function CitizenThemeSelect({ className = "" }: { className?: string }) {
  const { theme, changeTheme } = useContext(ThemeContext);
  const pathname = usePathname();
  if (!isThemedRoute(pathname)) return null;

  const themes: CitizenTheme[] = ["classic", "blue", "dark"];
  const labels = { classic: "Klasik", blue: "Biru", dark: "Gelap" };
  const nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length];
  const Icon = theme === "dark" ? Moon : theme === "blue" ? CloudSun : Sun;
  const label = `Tema ${labels[theme]}. Ganti ke tema ${labels[nextTheme]}`;

  return <button type="button" className={`citizen-theme-control citizen-theme-button ${className}`} aria-label={label} title={label} onClick={() => changeTheme(nextTheme)}>
    <Icon size={20} aria-hidden="true" />
  </button>;
}
