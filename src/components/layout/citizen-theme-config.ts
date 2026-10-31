export type CitizenTheme = "classic" | "blue" | "dark";
export const CITIZEN_THEME_STORAGE_KEY = "sijago-citizen-theme";
export const parseCitizenTheme = (value: string | null): CitizenTheme => value === "blue" || value === "dark" ? value : "classic";
export const isCitizenRoute = (path: string) => path === "/" || path === "/lapor" || path === "/lacak" || path.startsWith("/laporan/");
export const isDashboardRoute = (path: string) => path === "/admin" || path.startsWith("/admin/") || path === "/instansi" || path.startsWith("/instansi/");
export const isThemedRoute = (path: string) => isCitizenRoute(path) || isDashboardRoute(path);
// Restore the shared preference before paint on public pages and dashboards.
export const citizenThemeScript = `(function(){try{var p=location.pathname,t=localStorage.getItem('${CITIZEN_THEME_STORAGE_KEY}');if((p==='/'||p==='/lapor'||p==='/lacak'||p.indexOf('/laporan/')===0||p==='/admin'||p.indexOf('/admin/')===0||p==='/instansi'||p.indexOf('/instansi/')===0)&&(t==='blue'||t==='dark')){document.documentElement.dataset.citizenTheme=t}}catch(e){}})();`;
