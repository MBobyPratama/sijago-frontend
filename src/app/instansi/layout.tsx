import { requirePortalUser } from "@/lib/auth-server";
export default async function AgencyLayout({ children }: { children: React.ReactNode }) {
  await requirePortalUser("agency");
  return children;
}
