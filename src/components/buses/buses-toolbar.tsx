"use client";

import { Search } from "lucide-react";
import type { BusStatus } from "@/data/types";
import { Input } from "@/components/ui/input";
import {
  MultiSelectFilter,
} from "@/components/ui/multi-select-filter";
import { STATUS_LABELS } from "@/lib/constants";

const STATUS_OPTIONS: ReadonlyArray<{ value: BusStatus; label: string }> = [
  { value: "running", label: STATUS_LABELS.running },
  { value: "pm-due", label: STATUS_LABELS["pm-due"] },
  { value: "in-maintenance", label: STATUS_LABELS["in-maintenance"] },
  { value: "road-call", label: STATUS_LABELS["road-call"] },
];

interface BusesToolbarProps {
  query: string;
  onQueryChange: (next: string) => void;
  selectedStatuses: Set<BusStatus>;
  onToggleStatus: (status: BusStatus) => void;
  onClearStatuses: () => void;
}

export function BusesToolbar({
  query,
  onQueryChange,
  selectedStatuses,
  onToggleStatus,
  onClearStatuses,
}: BusesToolbarProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="relative flex-1 sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-faint" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search buses"
          aria-label="Search buses"
          className="pl-10"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <MultiSelectFilter<BusStatus>
          label="Status"
          options={STATUS_OPTIONS}
          selected={selectedStatuses}
          onToggle={onToggleStatus}
          onClear={onClearStatuses}
          pluralLabel="statuses"
        />
      </div>
    </div>
  );
}
