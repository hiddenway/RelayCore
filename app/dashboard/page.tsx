import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardHome } from "@/components/DashboardHome";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <DashboardLayout>
      <DashboardHome />
    </DashboardLayout>
  );
}
