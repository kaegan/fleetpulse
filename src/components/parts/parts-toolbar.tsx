"use client";

import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type PartsFilter = "all" | "at-risk";

interface PartsToolbarProps {
  query: string;
  onQueryChange: (next: string) => void;
  filter: PartsFilter;
  onFilterChange: (next: PartsFilter) => void;
  atRiskCount: number;
  categories: string[];
  selectedCategories: Set<string>;
  onToggleCategory: (category: string) => void;
  onClearCategories: () => void;
}

export function PartsToolbar({
  query,
  onQueryChange,
  filter,
  onFilterChange,
  atRiskCount,
  categories,
  selectedCategories,
  onToggleCategory,
  onClearCategories,
}: PartsToolbarProps) {
  const selectedCount = selectedCategories.size;
  const categoryLabel =
    selectedCount === 0
      ? "Category"
      : selectedCount === 1
        ? Array.from(selectedCategories)[0]
        : `${selectedCount} categories`;

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="relative flex-1 sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-faint" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search parts"
          aria-label="Search parts"
          className="pl-10"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 rounded-full px-3.5 font-semibold"
            >
              {categoryLabel}
              <ChevronDown className="size-3.5 text-text-faint" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="max-h-80 min-w-[220px] overflow-y-auto"
          >
            <DropdownMenuLabel className="flex items-center justify-between gap-2 py-1.5">
              <span>Categories</span>
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={onClearCategories}
                  className="text-[11px] font-semibold text-brand hover:underline"
                >
                  Clear
                </button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {categories.map((cat) => (
              <DropdownMenuCheckboxItem
                key={cat}
                checked={selectedCategories.has(cat)}
                onCheckedChange={() => onToggleCategory(cat)}
                onSelect={(e) => e.preventDefault()}
              >
                {cat}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={(val) => val && onFilterChange(val as PartsFilter)}
          aria-label="Filter parts"
        >
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="at-risk">
            At risk
            {atRiskCount > 0 && (
              <span className="ml-1 text-text-faint">· {atRiskCount}</span>
            )}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
