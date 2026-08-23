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
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = { sm: "h-8 w-8", md: "h-11 w-11", lg: "h-14 w-14" }[size];
  const cost = hero?.cost ?? 1;
  const rainbow = cost >= 6;
  const color = costColor(cost);
  return (
    <div
      className={cn("relative shrink-0", dims, "rounded-full", className)}
      style={rainbow ? { padding: 3, backgroundImage: RAINBOW_GRADIENT } : undefined}
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
        className="relative h-full w-full overflow-hidden rounded-full border-[3px] border-foreground bg-surface"
        style={rainbow ? { borderColor: "#0d0d0d" } : { borderColor: "#0d0d0d", boxShadow: `inset 0 0 0 2px ${color}` }}
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
            style={{ backgroundColor: `${color}55`, fontSize: size === "sm" ? 12 : 15 }}
          >
            {hero?.name?.slice(0, 1) ?? "?"}
          </span>
        )}
      </div>
      <span
        className="absolute -bottom-1 left-1/2 z-10 -translate-x-1/2 rounded-none border-2 border-foreground px-1 text-[9px] font-black leading-tight text-foreground"
        style={{ backgroundColor: color }}
      >
        {hero?.cost ?? "?"}
      </span>
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
    <div className={cn("overflow-x-auto pb-2", className)}>
      <div
        className="mx-auto grid w-max min-w-full gap-1.5 rounded-xl border border-border bg-gradient-to-b from-surface to-card p-3 sm:gap-2 sm:p-4"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          maxWidth: cols * 84,
        }}
      >
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
                    <HeroToken hero={cell.hero} />
                    {(cell.equipment?.length ?? 0) > 0 && (
                      <span className="absolute inset-x-0 -bottom-1 z-10 flex justify-center gap-0.5">
                        {cell.equipment!.slice(0, 3).map((eq) => (
                          <span
                            key={eq._id}
                            title={eq.name}
                            className="grid h-3 w-3 shrink-0 place-items-center overflow-hidden rounded-full border border-background bg-elevated shadow-sm"
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
      </div>
      <p className="mt-1 text-center text-[11px] text-muted">
        Front line at the top · the small dots below a hero are its equipped items
      </p>
    </div>
  );
}
