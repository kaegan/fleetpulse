"use client";

import { useState, useEffect } from "react";

function formatClock(date: Date): string {
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${weekday}, ${month} ${day} \u00B7 ${time}`;
}

export function useClock(): string {
  const [display, setDisplay] = useState(() => formatClock(new Date()));

  useEffect(() => {
    const id = setInterval(() => setDisplay(formatClock(new Date())), 60_000);
    return () => clearInterval(id);
  }, []);

  return display;
}
