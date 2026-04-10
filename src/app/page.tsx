"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RoleProvider, useRole } from "@/hooks/use-role";
import { TopBar } from "@/components/top-bar";
import { MechanicView } from "@/components/mechanic/mechanic-view";
import { OpsView } from "@/components/ops/ops-view";

function ViewSwitch() {
  const { role } = useRole();

  return (
    <main style={{ flex: 1, overflow: "auto" }}>
      <AnimatePresence mode="wait">
        {role === "mechanic" ? (
          <motion.div
            key="mechanic"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <MechanicView />
          </motion.div>
        ) : (
          <motion.div
            key="ops"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <OpsView />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function Home() {
  return (
    <RoleProvider>
      <TopBar />
      <ViewSwitch />
    </RoleProvider>
  );
}
