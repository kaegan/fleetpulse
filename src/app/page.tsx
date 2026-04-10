"use client";

import { RoleProvider, useRole } from "@/hooks/use-role";
import { TopBar } from "@/components/top-bar";
import { NavRail } from "@/components/nav-rail";
import { MechanicView } from "@/components/mechanic/mechanic-view";
import { OpsView } from "@/components/ops/ops-view";

function ViewSwitch() {
  const { role } = useRole();

  return (
    <main style={{ flex: 1, overflow: "auto" }}>
      <div key={role}>
        {role === "mechanic" ? <MechanicView /> : <OpsView />}
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <RoleProvider>
      <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <TopBar />
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <NavRail />
          <ViewSwitch />
        </div>
      </div>
    </RoleProvider>
  );
}
