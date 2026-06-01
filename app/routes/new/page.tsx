import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { NewRouteForm } from "@/components/NewRouteForm";

export default async function NewRoutePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <DashboardLayout>
      <NewRouteForm />
    </DashboardLayout>
  );
}
