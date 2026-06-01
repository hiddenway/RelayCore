import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { LogsPanel } from "@/components/LogsPanel";

export default async function LogsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <DashboardLayout>
      <LogsPanel />
    </DashboardLayout>
  );
}
