import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { RouteDetail } from "@/components/RouteDetail";

export default async function RouteDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { slug } = await params;

  return (
    <DashboardLayout>
      <RouteDetail slug={slug} />
    </DashboardLayout>
  );
}
