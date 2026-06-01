import { redirect } from "next/navigation";
import { isRedisConfigured, isSetupCompleted } from "@/lib/redis";
import { SetupWizard } from "@/components/SetupWizard";

export default async function SetupPage() {
  if (!isRedisConfigured()) redirect("/");

  const done = await isSetupCompleted();
  if (done) redirect("/dashboard");

  return <SetupWizard />;
}
