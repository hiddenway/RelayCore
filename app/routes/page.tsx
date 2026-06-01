import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { RoutesPanel } from "@/components/RoutesPanel";

export default async function RoutesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <DashboardLayout>
      <RoutesPanel />
    </DashboardLayout>
  );
}
