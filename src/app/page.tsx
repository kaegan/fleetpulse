"use client";

import { useRole } from "@/hooks/use-role";
import { MechanicView } from "@/components/mechanic/mechanic-view";
import { OpsView } from "@/components/ops/ops-view";

export default function Home() {
  const { role } = useRole();
  return (
    <div key={role}>
      {role === "mechanic" ? <MechanicView /> : <OpsView />}
    </div>
  );
}
