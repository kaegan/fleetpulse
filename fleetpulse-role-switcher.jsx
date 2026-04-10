import { useState } from "react";

const FleetPulseRoleSwitcher = () => {
  const [role, setRole] = useState("mechanic");

  // Mechanic KDS Board Data
  const workOrders = [
    { id: "WO-1247", bus: "Bus #147", issue: "Brake pad replacement", severity: "critical", bay: "Bay 3", timeInStatus: "2h 15m", stage: 3, mechanic: "Torres, M." },
    { id: "WO-1248", bus: "Bus #203", issue: "Transmission fluid leak", severity: "critical", bay: "Bay 1", timeInStatus: "4h 30m", stage: 2, mechanic: "Chen, R." },
    { id: "WO-1249", bus: "Bus #089", issue: "HVAC compressor failure", severity: "high", bay: "Bay 5", timeInStatus: "1h 45m", stage: 4, mechanic: "Okafor, E." },
    { id: "WO-1250", bus: "Bus #312", issue: "Wheelchair ramp hydraulic", severity: "high", bay: null, timeInStatus: "45m", stage: 1, mechanic: null },
    { id: "WO-1251", bus: "Bus #078", issue: "Engine oil change (PM)", severity: "routine", bay: "Bay 7", timeInStatus: "35m", stage: 4, mechanic: "Torres, M." },
    { id: "WO-1252", bus: "Bus #195", issue: "Tire rotation + inspect", severity: "routine", bay: null, timeInStatus: "2h", stage: 0, mechanic: null },
    { id: "WO-1253", bus: "Bus #267", issue: "Alternator replacement", severity: "high", bay: "Bay 2", timeInStatus: "3h 10m", stage: 3, mechanic: "Chen, R." },
    { id: "WO-1254", bus: "Bus #041", issue: "Coolant system flush (PM)", severity: "routine", bay: null, timeInStatus: "1d 2h", stage: 0, mechanic: null },
  ];

  const stages = ["Queued", "Diagnosed", "Parts Ready", "In Repair", "QA Check"];

  const severityColor = {
    critical: { bg: "rgba(239, 68, 68, 0.15)", border: "#ef4444", dot: "#ef4444" },
    high: { bg: "rgba(245, 158, 11, 0.15)", border: "#f59e0b", dot: "#f59e0b" },
    routine: { bg: "rgba(34, 197, 94, 0.15)", border: "#22c55e", dot: "#22c55e" },
  };

  // Ops Manager Fleet Data
  const fleetData = Array.from({ length: 300 }, (_, i) => {
    const rand = Math.random();
    let status, garage;
    if (rand < 0.07) status = "breakdown";
    else if (rand < 0.17) status = "in-maintenance";
    else if (rand < 0.27) status = "pm-due";
    else status = "running";
    garage = i < 175 ? "north" : "south";
    return { id: i + 1, status, garage, busNum: String(i + 1).padStart(3, "0") };
  });

  const statusColors = {
    running: "#22c55e",
    "pm-due": "#f59e0b",
    "in-maintenance": "#ef4444",
    breakdown: "#1e1e1e",
  };

  const getStatusCounts = (garage) => {
    const buses = garage ? fleetData.filter((b) => b.garage === garage) : fleetData;
    return {
      total: buses.length,
      running: buses.filter((b) => b.status === "running").length,
      pmDue: buses.filter((b) => b.status === "pm-due").length,
      inMaint: buses.filter((b) => b.status === "in-maintenance").length,
      breakdown: buses.filter((b) => b.status === "breakdown").length,
    };
  };

  const allCounts = getStatusCounts();
  const northCounts = getStatusCounts("north");
  const southCounts = getStatusCounts("south");

  const availRate = ((allCounts.running / allCounts.total) * 100).toFixed(1);

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: "#e5e5e5" }}>
      {/* Top Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", borderBottom: "1px solid #262626", background: "#111111" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e66" }} />
            <span style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", color: "#ffffff" }}>FleetPulse</span>
          </div>
          <span style={{ color: "#525252", fontSize: "14px" }}>|</span>
          <span style={{ color: "#a3a3a3", fontSize: "13px" }}>North Garage</span>
        </div>

        {/* Role Switcher */}
        <div style={{ display: "flex", background: "#1a1a1a", borderRadius: "8px", padding: "3px", border: "1px solid #262626" }}>
          <button
            onClick={() => setRole("mechanic")}
            style={{
              padding: "7px 18px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              transition: "all 0.2s",
              background: role === "mechanic" ? "#f59e0b" : "transparent",
              color: role === "mechanic" ? "#0a0a0a" : "#737373",
            }}
          >
            Mechanic
          </button>
          <button
            onClick={() => setRole("ops")}
            style={{
              padding: "7px 18px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              transition: "all 0.2s",
              background: role === "ops" ? "#3b82f6" : "transparent",
              color: role === "ops" ? "#ffffff" : "#737373",
            }}
          >
            Ops Manager
          </button>
        </div>

        <div style={{ fontSize: "13px", color: "#525252" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {/* Mechanic View — KDS Board */}
      {role === "mechanic" && (
        <div style={{ padding: "20px 24px" }}>
          {/* Bay Status Strip */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px", overflowX: "auto" }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((bay) => {
              const occupant = workOrders.find((wo) => wo.bay === `Bay ${bay}`);
              return (
                <div
                  key={bay}
                  style={{
                    flex: "1",
                    minWidth: "100px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: occupant ? "#1a1a1a" : "#0f1f0f",
                    border: `1px solid ${occupant ? "#333" : "#1a3a1a"}`,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "#737373", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Bay {bay}</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: occupant ? "#e5e5e5" : "#22c55e", marginTop: "4px" }}>
                    {occupant ? occupant.bus.replace("Bus ", "#") : "Open"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* KDS Columns */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", minHeight: "500px" }}>
            {stages.map((stage, stageIdx) => {
              const stageOrders = workOrders.filter((wo) => wo.stage === stageIdx);
              return (
                <div key={stage} style={{ background: "#111111", borderRadius: "10px", padding: "12px", border: "1px solid #1e1e1e" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid #1e1e1e" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#a3a3a3" }}>{stage}</span>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      background: stageOrders.length > 0 ? "#262626" : "transparent",
                      color: "#737373",
                      padding: "2px 8px",
                      borderRadius: "10px",
                    }}>
                      {stageOrders.length}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {stageOrders.map((wo) => {
                      const sev = severityColor[wo.severity];
                      return (
                        <div
                          key={wo.id}
                          style={{
                            background: sev.bg,
                            borderLeft: `3px solid ${sev.border}`,
                            borderRadius: "6px",
                            padding: "10px",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>{wo.bus}</span>
                            <span style={{ fontSize: "11px", color: "#737373" }}>{wo.timeInStatus}</span>
                          </div>
                          <div style={{ fontSize: "12px", color: "#d4d4d4", marginBottom: "6px" }}>{wo.issue}</div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "10px", color: "#525252", fontFamily: "monospace" }}>{wo.id}</span>
                            {wo.bay && <span style={{ fontSize: "10px", color: "#737373", background: "#1a1a1a", padding: "2px 6px", borderRadius: "4px" }}>{wo.bay}</span>}
                          </div>
                        </div>
                      );
                    })}
                    {stageOrders.length === 0 && (
                      <div style={{ padding: "20px", textAlign: "center", color: "#333", fontSize: "12px" }}>No work orders</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ops Manager View — Fleet Wall + Tracker */}
      {role === "ops" && (
        <div style={{ padding: "20px 24px" }}>
          {/* KPI Strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "20px" }}>
            {[
              { label: "Fleet Availability", value: `${availRate}%`, color: parseFloat(availRate) > 80 ? "#22c55e" : "#f59e0b" },
              { label: "Running", value: allCounts.running, color: "#22c55e" },
              { label: "PM Due", value: allCounts.pmDue, color: "#f59e0b" },
              { label: "In Maintenance", value: allCounts.inMaint, color: "#ef4444" },
              { label: "Road Calls", value: allCounts.breakdown, color: "#ffffff" },
            ].map((kpi) => (
              <div key={kpi.label} style={{ background: "#111111", borderRadius: "10px", padding: "16px", border: "1px solid #1e1e1e" }}>
                <div style={{ fontSize: "11px", color: "#737373", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>{kpi.label}</div>
                <div style={{ fontSize: "28px", fontWeight: 700, color: kpi.color, letterSpacing: "-0.02em" }}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Fleet Wall — Split by Garage */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            {[
              { name: "North Garage", filter: "north", counts: northCounts },
              { name: "South Garage", filter: "south", counts: southCounts },
            ].map((garage) => (
              <div key={garage.name} style={{ background: "#111111", borderRadius: "10px", padding: "16px", border: "1px solid #1e1e1e" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>{garage.name}</span>
                  <span style={{ fontSize: "12px", color: "#737373" }}>{garage.counts.total} buses · {garage.counts.running} available</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {fleetData
                    .filter((b) => b.garage === garage.filter)
                    .map((bus) => (
                      <div
                        key={bus.id}
                        title={`Bus #${bus.busNum} — ${bus.status}`}
                        style={{
                          width: "14px",
                          height: "14px",
                          borderRadius: "3px",
                          background: statusColors[bus.status],
                          opacity: bus.status === "breakdown" ? 1 : 0.85,
                          border: bus.status === "breakdown" ? "1.5px solid #ef4444" : "none",
                          cursor: "pointer",
                          transition: "transform 0.15s",
                        }}
                        onMouseEnter={(e) => { e.target.style.transform = "scale(1.6)"; e.target.style.opacity = "1"; }}
                        onMouseLeave={(e) => { e.target.style.transform = "scale(1)"; e.target.style.opacity = bus.status === "breakdown" ? "1" : "0.85"; }}
                      />
                    ))}
                </div>
                {/* Legend */}
                <div style={{ display: "flex", gap: "12px", marginTop: "10px", paddingTop: "8px", borderTop: "1px solid #1e1e1e" }}>
                  {[
                    { label: "Running", color: "#22c55e" },
                    { label: "PM Due", color: "#f59e0b" },
                    { label: "In Maint", color: "#ef4444" },
                    { label: "Road Call", color: "#1e1e1e", border: true },
                  ].map((item) => (
                    <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: item.color, border: item.border ? "1px solid #ef4444" : "none" }} />
                      <span style={{ fontSize: "10px", color: "#525252" }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Active Work Orders — Domino's Tracker Style */}
          <div style={{ background: "#111111", borderRadius: "10px", padding: "16px", border: "1px solid #1e1e1e" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", marginBottom: "12px" }}>Active Work Orders</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {workOrders.filter(wo => wo.stage > 0).map((wo) => {
                const sev = severityColor[wo.severity];
                return (
                  <div key={wo.id} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px", background: "#0a0a0a", borderRadius: "8px", border: "1px solid #1e1e1e" }}>
                    <div style={{ minWidth: "80px" }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>{wo.bus}</div>
                      <div style={{ fontSize: "11px", color: "#525252", fontFamily: "monospace" }}>{wo.id}</div>
                    </div>
                    <div style={{ minWidth: "160px", fontSize: "12px", color: "#a3a3a3" }}>{wo.issue}</div>
                    {/* Progress tracker */}
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0" }}>
                      {stages.map((stage, idx) => {
                        const isComplete = idx < wo.stage;
                        const isCurrent = idx === wo.stage;
                        return (
                          <div key={stage} style={{ flex: 1, display: "flex", alignItems: "center" }}>
                            <div style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "10px",
                              fontWeight: 700,
                              background: isComplete ? sev.dot : isCurrent ? sev.bg : "#1a1a1a",
                              border: isCurrent ? `2px solid ${sev.border}` : isComplete ? "none" : "1px solid #333",
                              color: isComplete ? "#0a0a0a" : isCurrent ? sev.dot : "#525252",
                            }}>
                              {isComplete ? "✓" : idx + 1}
                            </div>
                            {idx < stages.length - 1 && (
                              <div style={{ flex: 1, height: "2px", background: isComplete ? sev.dot : "#262626" }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ minWidth: "60px", textAlign: "right", fontSize: "12px", color: "#737373" }}>{wo.timeInStatus}</div>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: sev.dot }} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetPulseRoleSwitcher;