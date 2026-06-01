import { redirect } from "next/navigation";
import { isRedisConfigured, isSetupCompleted } from "@/lib/redis";
import { StorageCoreOffline } from "@/components/StorageCoreOffline";

export default async function RootPage() {
  if (!isRedisConfigured()) {
    return <StorageCoreOffline />;
  }

  const setupDone = await isSetupCompleted();
  if (!setupDone) {
    redirect("/setup");
  }

  redirect("/dashboard");
}
