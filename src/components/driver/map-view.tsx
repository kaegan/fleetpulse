"use client";

import { cn } from "@/lib/utils";

/**
 * Stylized street-grid map. NOT a real map — no tiles, no API key, no
 * geolocation. Exists so the Trip tab reads as a directions surface at a
 * glance, matching the visual language of the real Spare Driver app.
 *
 * The scene is fixed: driver position bottom-left, destination upper-right,
 * a curved route line between. Intent is to feel credible in a screenshot
 * without pretending to be real navigation.
 */
export function MapView({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-[#eef2ef]",
        className
      )}
      aria-label="Map preview — route to destination"
    >
      <svg
        viewBox="0 0 390 500"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        role="img"
      >
        {/* Base wash */}
        <rect width="390" height="500" fill="#eef2ef" />

        {/* Parks / green spaces */}
        <rect x="248" y="36" width="110" height="140" rx="4" fill="#d7e6d6" />
        <rect x="24" y="340" width="150" height="96" rx="4" fill="#d7e6d6" />

        {/* Water sliver (river) */}
        <path
          d="M 0 260 Q 90 248 180 262 T 390 258 L 390 280 Q 290 274 180 282 T 0 278 Z"
          fill="#cfe1ec"
        />

        {/* Building blocks (white) */}
        <g fill="#ffffff">
          <rect x="18" y="16" width="96" height="78" rx="3" />
          <rect x="128" y="16" width="104" height="78" rx="3" />
          <rect x="18" y="110" width="96" height="78" rx="3" />
          <rect x="128" y="110" width="104" height="78" rx="3" />
          <rect x="248" y="186" width="110" height="62" rx="3" />
          <rect x="18" y="204" width="96" height="44" rx="3" />
          <rect x="128" y="204" width="104" height="44" rx="3" />
          <rect x="24" y="300" width="70" height="28" rx="3" />
          <rect x="108" y="300" width="60" height="28" rx="3" />
          <rect x="190" y="300" width="82" height="108" rx="3" />
          <rect x="286" y="300" width="72" height="108" rx="3" />
          <rect x="24" y="448" width="150" height="40" rx="3" />
          <rect x="190" y="422" width="82" height="66" rx="3" />
          <rect x="286" y="422" width="72" height="66" rx="3" />
        </g>

        {/* Faint street labels */}
        <g fill="#a0aca3" fontFamily="Inter, sans-serif" fontSize="9">
          <text x="125" y="207" textAnchor="middle">MAPLE DR</text>
          <text x="240" y="295" textAnchor="middle" transform="rotate(-90, 240, 295)">
            HOSPITAL DR
          </text>
        </g>

        {/* Route line */}
        <path
          d="M 78 448 L 78 300 Q 78 290 88 290 L 236 290 Q 246 290 246 280 L 246 196 Q 246 186 256 186 L 304 186"
          stroke="#3b82f6"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />

        {/* Driver position (you are here) */}
        <g>
          <circle cx="78" cy="448" r="14" fill="#3b82f6" opacity="0.18" />
          <circle cx="78" cy="448" r="8" fill="#ffffff" stroke="#3b82f6" strokeWidth="3" />
          <circle cx="78" cy="448" r="3.5" fill="#3b82f6" />
        </g>

        {/* Destination pin */}
        <g transform="translate(304, 186)">
          <path
            d="M 0 -22 C -9 -22 -16 -15 -16 -6 C -16 2 0 18 0 18 C 0 18 16 2 16 -6 C 16 -15 9 -22 0 -22 Z"
            fill="#d4654a"
          />
          <circle cx="0" cy="-8" r="5" fill="#ffffff" />
        </g>
      </svg>
    </div>
  );
}
