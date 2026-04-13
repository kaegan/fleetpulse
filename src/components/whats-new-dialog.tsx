"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import releaseNotes from "@/data/release-notes.json";

type Category = "feature" | "improvement" | "fix";

interface ReleaseEntry {
  id: string;
  date: string;
  title: string;
  body: string;
  category: Category;
  prNumber?: number;
}

const CATEGORY_LABEL: Record<Category, string> = {
  feature: "New",
  improvement: "Improved",
  fix: "Fixed",
};

const CATEGORY_CLASSES: Record<Category, string> = {
  feature: "bg-[#fdf0ed] text-[#d4654a]",
  improvement: "bg-[#eff6ff] text-[#3b82f6]",
  fix: "bg-[#f0fdf4] text-[#22c55e]",
};

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface WhatsNewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WhatsNewDialog({ open, onOpenChange }: WhatsNewDialogProps) {
  const entries = (releaseNotes.entries as ReleaseEntry[]) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton aria-describedby={undefined} className="p-0">
        <div className="px-7 pt-7 pb-6">
          {/* Header */}
          <div className="mb-5">
            <Badge className={CATEGORY_CLASSES.feature} size="default">
              What&apos;s new
            </Badge>
            <DialogTitle className="mt-2.5 text-[22px] font-bold tracking-[-0.03em] text-foreground">
              Latest updates
            </DialogTitle>
            <p className="mt-1 text-sm font-medium text-[#929292]">
              Recent changes that affect what you see and do in FleetPulse.
            </p>
          </div>

          {/* Entries */}
          {entries.length === 0 ? (
            <p className="text-sm text-[#929292]">Nothing new to report yet.</p>
          ) : (
            <ul className="flex flex-col">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="border-t border-[rgba(0,0,0,0.06)] py-4 first:border-t-0 first:pt-0"
                >
                  <div className="mb-2 flex items-center gap-2.5">
                    <Badge
                      className={CATEGORY_CLASSES[entry.category]}
                      size="sm"
                    >
                      {CATEGORY_LABEL[entry.category]}
                    </Badge>
                    <span className="text-xs font-medium text-[#b5b5b5]">
                      {formatDate(entry.date)}
                    </span>
                  </div>
                  <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
                    {entry.title}
                  </h3>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-[#6a6a6a]">
                    {entry.body}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {/* Footer */}
          <div className="mt-5 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
