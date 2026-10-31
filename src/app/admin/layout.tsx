import { requirePortalUser } from "@/lib/auth-server";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePortalUser("admin");
  return children;
}
