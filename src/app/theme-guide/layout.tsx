import { requirePortalUser } from "@/lib/auth-server";

export default async function ThemeGuideLayout({ children }: { children: React.ReactNode }) {
  await requirePortalUser("admin", "/theme-guide");
  return children;
}
