import type { CSSProperties, ReactNode } from "react";
import { cn } from "../lib/utils";
import { heroRoles } from "../lib/heroSynergies";
import type { Hero } from "../types";

export const COST_COLORS: Record<number, string> = {
  1: "#d1d5db",
  2: "#4ade80",
  3: "#38bdf8",
  4: "#c084fc",
  5: "#facc15",
};

export const RAINBOW_GRADIENT =
  "conic-gradient(#f87171, #fb923c, #fde047, #4ade80, #22d3ee, #818cf8, #e879f9, #f87171)";

export function costColor(cost?: number): string {
  return COST_COLORS[cost ?? 1] ?? "#9ca3af";
}

export function HeroToken({
  hero,
  size = "md",
  className,
}: {
  hero?: Partial<Hero> | null;
  size?: "sm" | "md" | "lg" | "cell";
  className?: string;
}) {
  // "cell" scales with the board tile (mobile) but never exceeds the 44px
  // desktop token, so the desktop board renders exactly as it always has.
  const dims: Record<typeof size, string> = {
    sm: "h-8 w-8",
    md: "h-11 w-11",
    lg: "h-14 w-14",
    cell: "",
  };
  const fixedDims = dims[size];
  const cost = hero?.cost ?? 1;
  const rainbow = cost >= 6;
  const color = costColor(cost);
  const cellSizing = size === "cell";
  return (
    <div
      data-hero-token=""
      data-hero={hero?._id}
      className={cn(
        "relative shrink-0",
        cellSizing ? "aspect-square w-[min(86%,2.75rem)]" : fixedDims,
        "rounded-full",
        className,
      )}
      style={rainbow ? { padding: cellSizing ? 2 : 3, backgroundImage: RAINBOW_GRADIENT } : undefined}
      title={
        hero
          ? `${hero.name} · Cost ${hero.cost}${
              heroRoles(hero).length > 0
                ? ` · ${heroRoles(hero).map((s) => s.name).join(" / ")}`
                : ""
            }`
          : undefined
      }
    >
      <div
        className={cn(
          "relative h-full w-full overflow-hidden rounded-full border-foreground bg-surface",
          cellSizing ? "border-2" : "border-[3px]",
        )}
        style={{
          borderColor: "var(--color-foreground)",
          ...(rainbow ? {} : { boxShadow: `inset 0 0 0 ${cellSizing ? 1.5 : 2}px ${color}` }),
        }}
      >
        {hero?.image ? (
          <img
            src={hero.image}
            alt={hero.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center font-bold text-foreground"
            style={{
              backgroundColor: `${color}55`,
              fontSize: size === "sm" ? 12 : cellSizing ? 11 : 15,
            }}
          >
            {hero?.name?.slice(0, 1) ?? "?"}
          </span>
        )}
      </div>
      <span
        className={cn(
          "absolute -bottom-1 left-1/2 z-10 -translate-x-1/2 rounded-none border-2 border-foreground font-black leading-tight text-bright-ink",
          cellSizing ? "px-0.5 text-[8px]" : "px-1 text-[9px]",
        )}
        style={{ backgroundColor: color }}
      >
        {hero?.cost ?? "?"}
      </span>
    </div>
  );
}

/**
 * Shared board grid. Width is driven by the container (`w-full`) and only
 * capped on wide screens — it is never sized by its contents, which is what
 * used to make the board jump horizontally as heroes were placed.
 */
export function BoardGrid({
  rows,
  cols,
  className,
  style,
  children,
}: {
  rows: number;
  cols: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      data-board-grid=""
      className={cn(
        "grid w-full gap-1 rounded-xl border border-border bg-gradient-to-b from-surface to-card p-2 sm:gap-2 sm:p-4",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: cols * 84, ...style }}
    >
      {children}
    </div>
  );
}

export interface BoardCellItem {
  _id: string;
  name: string;
  image?: string | null;
}

export interface BoardCellData {
  hero: Partial<Hero>;
  note?: string;
  equipment?: BoardCellItem[];
}

interface BoardProps {
  rows?: number;
  cols?: number;
  cells: Map<string, BoardCellData>;
  className?: string;
}

export function Board({ rows = 3, cols = 7, cells, className }: BoardProps) {
  const rowList = Array.from({ length: rows }, (_, i) => i);
  const colList = Array.from({ length: cols }, (_, i) => i);

  return (
    <div className={className}>
      <BoardGrid rows={rows} cols={cols} className="mx-auto">
        {rowList.map((row) =>
          colList.map((col) => {
            const cell = cells.get(`${row}-${col}`);
            return (
              <div
                key={`${row}-${col}`}
                className={cn(
                  "relative flex aspect-square items-center justify-center rounded-md border",
                  cell
                    ? "border-primary/50 bg-primary/10"
                    : "border-border/60 bg-background/40",
                )}
              >
                {cell && (
                  <>
                    <HeroToken hero={cell.hero} size="cell" />
                    {(cell.equipment?.length ?? 0) > 0 && (
                      <span className="absolute inset-x-0 -bottom-1 z-10 flex justify-center gap-0.5">
                        {cell.equipment!.slice(0, 3).map((eq) => (
                          <span
                            key={eq._id}
                            title={eq.name}
                            className="grid h-2.5 w-2.5 shrink-0 place-items-center overflow-hidden rounded-full border border-background bg-elevated shadow-sm sm:h-3 sm:w-3"
                          >
                            {eq.image ? (
                              <img src={eq.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                            ) : (
                              <span className="font-black text-muted" style={{ fontSize: 6 }}>
                                {eq.name.slice(0, 1)}
                              </span>
                            )}
                          </span>
                        ))}
                      </span>
                    )}
                  </>
                )}
              </div>
            );
          }),
        )}
      </BoardGrid>
      <p className="mt-2 text-center text-[11px] text-muted">
        Front line at the top · the small dots below a hero are its equipped items
      </p>
    </div>
  );
}
