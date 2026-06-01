import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { NewBotForm } from "@/components/NewBotForm";

export default async function NewBotPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <DashboardLayout>
      <NewBotForm />
    </DashboardLayout>
  );
}
