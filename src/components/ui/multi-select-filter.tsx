"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface MultiSelectFilterProps<T extends string> {
  /** Button label when nothing is selected ("Category", "Status", "Stage"). */
  label: string;
  /** Available options. Labels are human-readable; values are the filter key. */
  options: ReadonlyArray<Option<T>>;
  selected: Set<T>;
  onToggle: (value: T) => void;
  onClear: () => void;
  /** Optional plural noun used when multiple are selected ("3 categories"). */
  pluralLabel?: string;
}

/**
 * Shadcn DropdownMenu multi-select for filter chrome. Shows the default label
 * when empty, the single option label when one is picked, or "N plural" when
 * many are selected. Always includes a Clear affordance in the header.
 */
export function MultiSelectFilter<T extends string>({
  label,
  options,
  selected,
  onToggle,
  onClear,
  pluralLabel,
}: MultiSelectFilterProps<T>) {
  const count = selected.size;
  const buttonLabel =
    count === 0
      ? label
      : count === 1
        ? options.find((o) => o.value === Array.from(selected)[0])?.label ??
          label
        : `${count} ${pluralLabel ?? label.toLowerCase()}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 rounded-full px-3.5 font-semibold"
        >
          {buttonLabel}
          <ChevronDown className="size-3.5 text-text-faint" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-80 min-w-[220px] overflow-y-auto"
      >
        <DropdownMenuLabel className="flex items-center justify-between gap-2 py-1.5">
          <span>{label}</span>
          {count > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="text-[11px] font-semibold text-brand hover:underline"
            >
              Clear
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt.value}
            checked={selected.has(opt.value)}
            onCheckedChange={() => onToggle(opt.value)}
            onSelect={(e) => e.preventDefault()}
          >
            {opt.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
