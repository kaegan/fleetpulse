"use client";

import { Search } from "lucide-react";
import type { Severity, WorkOrderStage } from "@/data/types";
import { Input } from "@/components/ui/input";
import { MultiSelectFilter } from "@/components/ui/multi-select-filter";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  SEVERITY_LABELS,
  STAGE_LABELS,
  STAGE_ORDER,
} from "@/lib/constants";

export type WorkOrdersFilter = "all" | "held";

const STAGE_OPTIONS = STAGE_ORDER.map((stage) => ({
  value: stage,
  label: STAGE_LABELS[stage],
}));

const SEVERITY_OPTIONS: ReadonlyArray<{ value: Severity; label: string }> = [
  { value: "critical", label: SEVERITY_LABELS.critical },
  { value: "high", label: SEVERITY_LABELS.high },
  { value: "routine", label: SEVERITY_LABELS.routine },
];

interface WorkOrdersToolbarProps {
  query: string;
  onQueryChange: (next: string) => void;
  filter: WorkOrdersFilter;
  onFilterChange: (next: WorkOrdersFilter) => void;
  heldCount: number;

  selectedStages: Set<WorkOrderStage>;
  onToggleStage: (stage: WorkOrderStage) => void;
  onClearStages: () => void;

  selectedSeverities: Set<Severity>;
  onToggleSeverity: (severity: Severity) => void;
  onClearSeverities: () => void;

  mechanicOptions: ReadonlyArray<{ value: string; label: string }>;
  selectedMechanics: Set<string>;
  onToggleMechanic: (mechanic: string) => void;
  onClearMechanics: () => void;
}

export function WorkOrdersToolbar({
  query,
  onQueryChange,
  filter,
  onFilterChange,
  heldCount,
  selectedStages,
  onToggleStage,
  onClearStages,
  selectedSeverities,
  onToggleSeverity,
  onClearSeverities,
  mechanicOptions,
  selectedMechanics,
  onToggleMechanic,
  onClearMechanics,
}: WorkOrdersToolbarProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="relative flex-1 sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-faint" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search work orders"
          aria-label="Search work orders"
          className="pl-10"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <MultiSelectFilter<WorkOrderStage>
          label="Stage"
          options={STAGE_OPTIONS}
          selected={selectedStages}
          onToggle={onToggleStage}
          onClear={onClearStages}
          pluralLabel="stages"
        />
        <MultiSelectFilter<Severity>
          label="Severity"
          options={SEVERITY_OPTIONS}
          selected={selectedSeverities}
          onToggle={onToggleSeverity}
          onClear={onClearSeverities}
          pluralLabel="severities"
        />
        <MultiSelectFilter<string>
          label="Mechanic"
          options={mechanicOptions}
          selected={selectedMechanics}
          onToggle={onToggleMechanic}
          onClear={onClearMechanics}
          pluralLabel="mechanics"
        />
        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={(val) =>
            val && onFilterChange(val as WorkOrdersFilter)
          }
          aria-label="Filter work orders"
        >
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="held">
            Held
            {heldCount > 0 && (
              <span className="ml-1 text-text-faint">· {heldCount}</span>
            )}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
