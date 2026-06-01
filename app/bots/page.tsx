import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { BotsPanel } from "@/components/BotsPanel";

export default async function BotsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <DashboardLayout>
      <BotsPanel />
    </DashboardLayout>
  );
}
