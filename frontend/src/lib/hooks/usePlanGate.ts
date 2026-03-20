import { useAuth } from "@/lib/auth/AuthProvider";

export function usePlanGate() {
  const { workspace } = useAuth();
  const tier = workspace?.plan?.tier ?? "starter";
  const isStarter = tier === "starter";
  const isPaid = !isStarter;
  return { tier, isStarter, isPaid };
}
