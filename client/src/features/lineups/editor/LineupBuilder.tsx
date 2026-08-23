import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  ArrowLeft,
  ChevronRight,
  Eraser,
  Loader2,
  Save,
  Shield,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { getApiErrorMessage, lineupsApi, uploadsApi } from "../../../api/endpoints";
import { useGameData } from "../../../hooks/useGameData";
import type {
  Commander,
  Equipment,
  GameMode,
  GoGoCard,
  GoGoCardRarity,
  Hero,
  Season,
} from "../../../types";
import { HeroToken, RAINBOW_GRADIENT, costColor } from "../../../components/Board";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Textarea } from "../../../components/ui/textarea";
import { cn } from "../../../lib/utils";
import { heroRoles } from "../../../lib/heroSynergies";
import {
  EditorState,
  computeSynergyCounts,
  emptyEditorState,
  toPayload,
  validateBoard,
  validateDetails,
} from "./editorState";

const ITEM_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "regular", label: "Regular" },
  { value: "magic-crystal", label: "Magic crystal" },
  { value: "commander-exclusive", label: "Commander exclusive" },
  { value: "synergy-exclusive", label: "Synergy exclusive" },
  { value: "special", label: "Special" },
] as const;

const RARITY_META: Record<GoGoCardRarity, { label: string; color: string }> = {
  power: { label: "Power", color: "#f87171" },
  orange: { label: "Orange", color: "#fb923c" },
  purple: { label: "Purple", color: "#a78bfa" },
  blue: { label: "Blue", color: "#38bdf8" },
};

type DragKind = "hero" | "item";

interface DragData {
  kind: DragKind;
  id: string;
}

function DraggableChip({
  dragData,
  disabled,
  className,
  children,
}: {
  dragData: DragData;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${dragData.kind}:${dragData.id}`,
    data: dragData,
    disabled,
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "touch-none",
        !disabled && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface BuilderCellProps {
  row: number;
  col: number;
  hero?: Hero;
  items: Equipment[];
  onRemoveHero: () => void;
  onRemoveItem: (itemId: string) => void;
  onClick: () => void;
}

function BuilderCell({ row, col, hero, items, onRemoveHero, onRemoveItem, onClick }: BuilderCellProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `cell:${row}:${col}`,
    data: { row, col },
  });
  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        "group/cell relative flex aspect-square cursor-pointer items-center justify-center rounded-md border transition-colors",
        hero ? "border-primary/50 bg-primary/10" : "border-border/60 bg-background/40",
        isOver && "border-accent bg-accent/15",
      )}
    >
      {hero && (
        <>
          <PlacedHero hero={hero} />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveHero();
            }}
            className="absolute -right-1.5 -top-1.5 z-20 grid h-4 w-4 place-items-center rounded-full bg-danger text-white opacity-100 transition-opacity hover:opacity-80 sm:opacity-0 sm:group-hover/cell:opacity-100"
            aria-label={`Remove ${hero.name}`}
          >
            <X className="h-2.5 w-2.5" />
          </button>
          {items.length > 0 && (
            <span className="absolute inset-x-0 -bottom-1 z-10 flex justify-center gap-0.5">
              {items.map((eq) => (
                <button
                  key={eq._id}
                  title={`${eq.name} — click to remove`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(eq._id);
                  }}
                  className="grid h-3.5 w-3.5 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full border border-background bg-elevated shadow-sm transition-transform hover:scale-125"
                >
                  {eq.image ? (
                    <img src={eq.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-black text-muted" style={{ fontSize: 7 }}>
                      {eq.name.slice(0, 1)}
                    </span>
                  )}
                </button>
              ))}
            </span>
          )}
        </>
      )}
    </div>
  );
}

function PlacedHero({ hero }: { hero: Hero }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `placed-hero:${hero._id}`,
    data: { kind: "hero", id: hero._id } satisfies DragData,
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => e.stopPropagation()}
      className={cn("cursor-grab touch-none active:cursor-grabbing", isDragging && "opacity-30")}
    >
      <HeroToken hero={hero} />
    </div>
  );
}

function SynergyMeter({
  name,
  image,
  color,
  current,
  max,
}: {
  name: string;
  image?: string;
  color?: string;
  current: number;
  max: number;
}) {
  const c = color ?? "#8b5cf6";
  const active = current >= max;
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-surface p-2">
      {image ? (
        <img
          src={image}
          alt=""
          loading="lazy"
          className="h-8 w-8 shrink-0 rounded-full object-cover"
          style={{ boxShadow: `0 0 0 2px ${c}` }}
        />
      ) : (
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black"
          style={{ backgroundColor: `${c}22`, color: c, boxShadow: `0 0 0 2px ${c}` }}
        >
          {name.slice(0, 1)}
        </span>
      )}
      <p className="min-w-0 flex-1 truncate text-xs font-medium">{name}</p>
      <span
        className={cn("shrink-0 text-sm font-black", active ? "" : "opacity-70")}
        style={{ color: active ? c : undefined }}
      >
        {current}/{max}
      </span>
    </div>
  );
}

export function LineupBuilder({
  lineupId,
  initialState,
}: {
  lineupId?: string | null;
  initialState?: EditorState | null;
}) {
  const navigate = useNavigate();
  const { data: gameData } = useGameData();
  const [state, setState] = useState<EditorState>(initialState ?? emptyEditorState);
  const [step, setStep] = useState<"board" | "details">("board");
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [synergyFilter, setSynergyFilter] = useState("all");
  const [costFilter, setCostFilter] = useState("all");
  const [itemCategory, setItemCategory] = useState("all");
  const [commanderOpen, setCommanderOpen] = useState(false);
  const [gogoOpen, setGogoOpen] = useState(false);
  const [gogoRarity, setGogoRarity] = useState<"all" | GoGoCardRarity>("all");
  const [tagInput, setTagInput] = useState(initialState?.tags.join(", ") ?? "");
  const [savingStatus, setSavingStatus] = useState<"draft" | "published">("published");

  useEffect(() => {
    if (!gameData) return;
    setState((s) => ({
      ...s,
      seasonId: s.seasonId || gameData.seasons[0]?._id || "",
      gameModeId: s.gameModeId || gameData.gameModes[0]?._id || "",
    }));
  }, [gameData]);

  const rows =
    gameData?.gameModes.find((m) => m._id === state.gameModeId)?.boardConfig?.rows ?? 3;
  const cols =
    gameData?.gameModes.find((m) => m._id === state.gameModeId)?.boardConfig?.cols ?? 7;

  const heroById = useMemo(
    () => new Map((gameData?.heroes ?? []).map((h) => [h._id, h])),
    [gameData],
  );
  const synergyById = useMemo(
    () => new Map((gameData?.synergies ?? []).map((s) => [s._id, s])),
    [gameData],
  );
  const commanderById = useMemo(
    () => new Map((gameData?.commanders ?? []).map((c) => [c._id, c])),
    [gameData],
  );
  const gogoById = useMemo(
    () => new Map((gameData?.gogoCards ?? []).map((c) => [c._id, c])),
    [gameData],
  );

  const update = (patch: Partial<EditorState>) => setState((s) => ({ ...s, ...patch }));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  const heroAt = (row: number, col: number): string | null => {
    for (const [hid, pos] of Object.entries(state.placements)) {
      if (pos.row === row && pos.col === col) return hid;
    }
    return null;
  };

  const placeHero = (heroId: string, row: number, col: number) => {
    setState((s) => {
      const placements = { ...s.placements };
      const occupant = Object.entries(placements).find(
        ([, p]) => p.row === row && p.col === col,
      );
      if (occupant) delete placements[occupant[0]];
      delete placements[heroId];
      placements[heroId] = { row, col };
      return { ...s, placements };
    });
    setSelectedHeroId(null);
  };

  const removeAt = (row: number, col: number) => {
    setState((s) => {
      const placements = { ...s.placements };
      for (const [hid, p] of Object.entries(placements)) {
        if (p.row === row && p.col === col) delete placements[hid];
      }
      return { ...s, placements };
    });
  };

  const attachItem = (itemId: string, row: number, col: number) => {
    const targetHero = heroAt(row, col);
    if (!targetHero) {
      toast.error("Drop items onto a hero that's already on the board");
      return;
    }
    setState((s) => {
      const equipmentByHero: Record<string, string[]> = {};
      for (const [hid, list] of Object.entries(s.equipmentByHero)) {
        equipmentByHero[hid] = list.filter((id) => id !== itemId);
      }
      const current = equipmentByHero[targetHero] ?? [];
      if (current.length >= 3) {
        toast.error(`${heroById.get(targetHero)?.name ?? "This hero"} already has 3 items`);
        return s;
      }
      equipmentByHero[targetHero] = [...current, itemId];
      return { ...s, equipmentByHero };
    });
  };

  const removeItemFrom = (heroId: string, itemId: string) => {
    setState((s) => ({
      ...s,
      equipmentByHero: {
        ...s.equipmentByHero,
        [heroId]: (s.equipmentByHero[heroId] ?? []).filter((id) => id !== itemId),
      },
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const data = active.data.current as DragData | undefined;
    const cell = over.data.current as { row: number; col: number } | undefined;
    if (!data || !cell) return;
    if (data.kind === "hero") placeHero(data.id, cell.row, cell.col);
    else attachItem(data.id, cell.row, cell.col);
  };

  const clearBoard = () => {
    if (Object.keys(state.placements).length === 0) return;
    if (window.confirm("Clear all placed heroes and their items?")) {
      update({ placements: {}, equipmentByHero: {} });
      setSelectedHeroId(null);
    }
  };

  const importLineup = async () => {
    const raw = window.prompt(
      "Paste a lineup URL, slug or id to import its composition:",
    );
    if (!raw) return;
    const slug = raw.split("/").filter(Boolean).pop();
    if (!slug) return;
    try {
      const res = await lineupsApi.bySlug(slug);
      const lineup = res.data.data.lineup;
      const placements: EditorState["placements"] = {};
      const equipmentByHero: EditorState["equipmentByHero"] = {};
      for (const h of lineup.heroes) {
        placements[h.hero._id] = { row: h.position.row, col: h.position.col };
        equipmentByHero[h.hero._id] = h.equipment.map((e) => e._id);
      }
      const recs = [
        ...(lineup.commander ? [lineup.commander._id] : []),
        ...(lineup.recommendedCommanders ?? [])
          .map((c) => c._id)
          .filter((id) => !lineup.commander || id !== lineup.commander._id),
      ];
      setState((s) => ({
        ...s,
        seasonId: lineup.season._id,
        gameModeId: lineup.gameMode._id,
        placements,
        equipmentByHero,
        commanderMode: recs.length > 0 ? "recommended" : "all",
        recommendedCommanders: recs.slice(0, 3),
        gogoCards: (lineup.gogoCards ?? []).map((c) => c._id),
      }));
      toast.success(`Imported "${lineup.title}" — strategy text was left blank`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not import that lineup"));
    }
  };

  const saveMutation = useMutation({
    mutationFn: (status: "draft" | "published") =>
      lineupId
        ? lineupsApi.update(lineupId, toPayload(state, status))
        : lineupsApi.create(toPayload(state, status)),
    onSuccess: (res) => {
      toast.success(lineupId ? "Lineup updated" : "Lineup published!");
      navigate(`/lineups/${res.data.data.lineup.slug}`);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const submitDetails = (status: "draft" | "published") => {
    const problem = validateDetails(state);
    if (problem) {
      toast.error(problem);
      return;
    }
    setSavingStatus(status);
    saveMutation.mutate(status);
  };

  const onSaveClicked = () => {
    const problem = validateBoard(state);
    if (problem) {
      toast.error(problem);
      return;
    }
    setStep("details");
  };

  const synergies = useMemo(() => {
    const counts = computeSynergyCounts(state.placements, heroById);
    return [...counts.entries()]
      .map(([id, count]) => ({ synergy: synergyById.get(id), count }))
      .filter((e) => e.synergy)
      .sort((a, b) => b.count - a.count);
  }, [state.placements, heroById, synergyById]);

  const filteredHeroes = (gameData?.heroes ?? []).filter((h) => {
    if (costFilter !== "all") {
      const c = costFilter === "6" ? 6 : Number(costFilter);
      if ((h.cost ?? 1) < Math.min(c, 6) || (c === 6 ? h.cost < 6 : h.cost !== c))
        return false;
    }
    if (synergyFilter !== "all") {
      const has = (h.synergies as unknown[]).some(
        (s) => s && typeof s !== "string" && (s as { _id?: string })._id === synergyFilter,
      );
      if (!has) return false;
    }
    return true;
  });

  const filteredItems = (gameData?.equipment ?? []).filter((e) => {
    if (itemCategory === "all") return true;
    return (e.category ?? "regular") === itemCategory;
  });

  const itemUsedBy = useMemo(() => {
    const map = new Map<string, string>();
    for (const [hid, list] of Object.entries(state.equipmentByHero)) {
      for (const itemId of list) map.set(itemId, hid);
    }
    return map;
  }, [state.equipmentByHero]);

  if (step === "details") {
    return (
      <DetailsStep
        state={state}
        update={update}
        tagInput={tagInput}
        setTagInput={setTagInput}
        onBack={() => setStep("board")}
        onSubmit={submitDetails}
        saving={saveMutation.isPending}
        savingStatus={savingStatus}
        isEdit={Boolean(lineupId)}
      />
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      {/* Top bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => history.back()}>
          <ArrowLeft /> Back
        </Button>
        <Select value={state.seasonId} onValueChange={(v) => update({ seasonId: v })}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder="Season" />
          </SelectTrigger>
          <SelectContent>
            {(gameData?.seasons ?? []).map((s: Season) => (
              <SelectItem key={s._id} value={s._id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={state.gameModeId} onValueChange={(v) => update({ gameModeId: v })}>
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="Mode" />
          </SelectTrigger>
          <SelectContent>
            {(gameData?.gameModes ?? []).map((m: GameMode) => (
              <SelectItem key={m._id} value={m._id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="ml-auto flex items-center gap-2 text-sm">
          <span className="rounded-none bg-primary px-2.5 py-1 font-bold uppercase border-2 border-foreground shadow-comic-sm">
            {Object.keys(state.placements).length}/{(gameData?.heroes ?? []).length > 0 ? heroesOnBoardCap(rows, cols) : "?"} on board
          </span>
        </span>
        <Button variant="secondary" size="sm" onClick={clearBoard}>
          <Eraser /> Clear
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void importLineup()}>
          <Upload /> Import
        </Button>
        <Button size="sm" onClick={onSaveClicked}>
          <Save /> Save
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        {/* [1,1] Board */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="overflow-x-auto pb-2">
              <div
                className="mx-auto grid w-max min-w-full gap-1.5 rounded-xl border border-border bg-gradient-to-b from-surface to-card p-3 sm:gap-2 sm:p-4"
                style={{
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                  maxWidth: cols * 84,
                }}
              >
                {Array.from({ length: rows }, (_, row) =>
                  Array.from({ length: cols }, (_, col) => {
                    const hid = heroAt(row, col);
                    const hero = hid ? heroById.get(hid) : undefined;
                    return (
                      <BuilderCell
                        key={`${row}-${col}`}
                        row={row}
                        col={col}
                        hero={hero}
                        items={
                          hid
                            ? (state.equipmentByHero[hid] ?? [])
                                .map((id) => (gameData?.equipment ?? []).find((e) => e._id === id))
                                .filter(Boolean as unknown as (v: Equipment | undefined) => v is Equipment)
                            : []
                        }
                        onRemoveHero={() => removeAt(row, col)}
                        onRemoveItem={(itemId) => hid && removeItemFrom(hid, itemId)}
                        onClick={() => selectedHeroId && placeHero(selectedHeroId, row, col)}
                      />
                    );
                  }),
                )}
              </div>
            </div>
            <p className="mt-1 text-center text-[11px] text-muted">
              Front line at the top · drag heroes &amp; items onto tiles · click an item dot to remove it
            </p>
          </CardContent>
        </Card>

        {/* [1,2] Synergies */}
        <Card>
          <CardContent className="flex max-h-[420px] flex-col p-3 sm:p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
              <Sparkles className="h-3.5 w-3.5" /> Synergies
            </p>
            <div className="space-y-1.5 overflow-y-auto pr-1">
              {synergies.length === 0 && (
                <p className="py-6 text-center text-sm text-muted">
                  Place heroes to see active synergies here.
                </p>
              )}
              {synergies.map(({ synergy, count }) => {
                const levels = [...(synergy!.activationLevels ?? [])].sort(
                  (a, b) => a.count - b.count,
                );
                const max = levels.length > 0 ? levels[levels.length - 1].count : count;
                return (
                  <SynergyMeter
                    key={synergy!._id}
                    name={synergy!.name}
                    image={synergy!.image}
                    color={synergy!.color}
                    current={count}
                    max={max}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* [2,1] Palette tabs */}
        <Card className="lg:col-span-1">
          <CardContent className="p-3 sm:p-4">
            <Tabs defaultValue="heroes">
              <TabsList className="mb-3 w-full">
                <TabsTrigger value="heroes" className="flex-1">Heroes</TabsTrigger>
                <TabsTrigger value="items" className="flex-1">Items</TabsTrigger>
              </TabsList>

              <TabsContent value="heroes" className="mt-0 space-y-2">
                <div className="flex gap-2">
                  <Select value={synergyFilter} onValueChange={setSynergyFilter}>
                    <SelectTrigger className="h-8 flex-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All synergies</SelectItem>
                      {(gameData?.synergies ?? []).map((s) => (
                        <SelectItem key={s._id} value={s._id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={costFilter} onValueChange={setCostFilter}>
                    <SelectTrigger className="h-8 w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any cost</SelectItem>
                      {[1, 2, 3, 4, 5].map((c) => (
                        <SelectItem key={c} value={String(c)}>
                          Cost {c}
                        </SelectItem>
                      ))}
                      <SelectItem value="6">6+ rainbow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid max-h-[300px] grid-cols-2 gap-1.5 overflow-y-auto pr-1 xl:grid-cols-3">
                  {filteredHeroes.map((hero: Hero) => {
                    const placed = Boolean(state.placements[hero._id]);
                    return (
                      <div key={hero._id} className="relative">
                        <DraggableChip dragData={{ kind: "hero", id: hero._id }}>
                          <button
                            onClick={() =>
                              setSelectedHeroId(selectedHeroId === hero._id ? null : hero._id)
                            }
                            className={cn(
                              "w-full rounded-lg border p-1.5 text-left transition-colors",
                              placed
                                ? "border-primary/50 bg-primary/10"
                                : "border-border bg-surface hover:bg-elevated",
                              selectedHeroId === hero._id && "ring-2 ring-accent",
                            )}
                          >
                            <span className="flex items-center gap-1.5">
                              <HeroToken hero={hero} size="sm" />
                              <span className="min-w-0">
                                <span className="block truncate text-[11px] font-medium leading-tight">
                                  {hero.name}
                                </span>
                                <span className="block text-[9px] capitalize text-muted">
                                  cost {hero.cost}
                                  {heroRoles(hero).length > 0 &&
                                    ` · ${heroRoles(hero)
                                      .map((s) => s.name)
                                      .join(" / ")}`}
                                </span>
                              </span>
                            </span>
                          </button>
                        </DraggableChip>
                      </div>
                    );
                  })}
                  {filteredHeroes.length === 0 && (
                    <p className="col-span-full py-6 text-center text-sm text-muted">
                      No heroes match these filters.
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="items" className="mt-0 space-y-2">
                <Select value={itemCategory} onValueChange={setItemCategory}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="grid max-h-[300px] grid-cols-1 gap-1.5 overflow-y-auto pr-1 xl:grid-cols-2">
                  {filteredItems.map((eq: Equipment) => {
                    const holder = itemUsedBy.get(eq._id);
                    return (
                      <DraggableChip key={eq._id} dragData={{ kind: "item", id: eq._id }}>
                        <div
                          className={cn(
                            "flex w-full items-center gap-2 rounded-lg border p-1.5",
                            holder
                              ? "border-primary/40 bg-primary/10"
                              : "border-border bg-surface hover:bg-elevated",
                          )}
                        >
                          <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-elevated">
                            {eq.image ? (
                              <img src={eq.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-xs font-black text-muted">{eq.name.slice(0, 1)}</span>
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[11px] font-medium leading-tight">
                              {eq.name}
                            </span>
                            <span className="block text-[9px] capitalize text-muted">
                              {holder
                                ? `equipped by ${heroById.get(holder)?.name ?? "hero"}`
                                : (eq.category ?? "regular").replace(/-/g, " ")}
                            </span>
                          </span>
                        </div>
                      </DraggableChip>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <p className="col-span-full py-6 text-center text-sm text-muted">
                      No items in this category.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {selectedHeroId && (
              <p className="mt-2 rounded-lg bg-accent/10 px-3 py-2 text-xs text-cyan-200">
                Tap any tile to place{" "}
                <strong>{heroById.get(selectedHeroId)?.name}</strong>
              </p>
            )}
          </CardContent>
        </Card>

        {/* [2,2] Commander + gogo cards */}
        <Card>
          <CardContent className="flex h-full flex-col gap-2 p-3 sm:p-4">
            <Button variant="secondary" className="justify-start" onClick={() => setCommanderOpen(true)}>
              <Shield /> Commanders
              <span className="ml-auto text-xs text-muted">
                {state.commanderMode === "all"
                  ? "Any works"
                  : `${state.recommendedCommanders.length} picked`}
              </span>
            </Button>
            <Button variant="secondary" className="justify-start" onClick={() => setGogoOpen(true)}>
              <Sparkles /> GoGo cards
              <span className="ml-auto text-xs text-muted">{state.gogoCards.length}/10</span>
            </Button>

            <div className="mt-1 space-y-1.5 overflow-y-auto">
              {state.commanderMode === "recommended" &&
                state.recommendedCommanders.map((cid, i) => {
                  const c = commanderById.get(cid);
                  if (!c) return null;
                  return (
                    <div key={cid} className="flex items-center gap-2 rounded-lg border border-border bg-surface p-1.5">
                      <span className="text-[10px] font-black text-muted">#{i + 1}</span>
                      <CommanderAvatar commander={c} size="h-7 w-7" />
                      <span className="min-w-0 flex-1 truncate text-xs font-medium">{c.name}</span>
                      <button
                        className="cursor-pointer text-muted hover:text-danger"
                        onClick={() =>
                          update({
                            recommendedCommanders: state.recommendedCommanders.filter((id) => id !== cid),
                          })
                        }
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              {state.gogoCards.map((gid, i) => {
                const card = gogoById.get(gid);
                if (!card) return null;
                return (
                  <div key={gid} className="flex items-center gap-2 rounded-lg border border-border bg-surface p-1.5">
                    <ChevronRight className="h-3 w-3 shrink-0 text-accent" />
                    <span className="text-[10px] font-black text-muted">{i + 1}</span>
                    <span
                      className="shrink-0 rounded px-1 py-0.5 text-[9px] font-bold uppercase"
                      style={{
                        backgroundColor: `${RARITY_META[card.rarity].color}22`,
                        color: RARITY_META[card.rarity].color,
                      }}
                    >
                      {RARITY_META[card.rarity].label}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">{card.name}</span>
                    <button
                      className="cursor-pointer text-muted hover:text-danger"
                      onClick={() =>
                        update({ gogoCards: state.gogoCards.filter((id) => id !== gid) })
                      }
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <CommanderDialog
        open={commanderOpen}
        onClose={() => setCommanderOpen(false)}
        commanders={gameData?.commanders ?? []}
        mode={state.commanderMode}
        selected={state.recommendedCommanders}
        onMode={(m) => update({ commanderMode: m })}
        onToggle={(id) => {
          if (state.recommendedCommanders.includes(id)) {
            update({ recommendedCommanders: state.recommendedCommanders.filter((c) => c !== id) });
          } else if (state.recommendedCommanders.length < 3) {
            update({ recommendedCommanders: [...state.recommendedCommanders, id] });
          } else {
            toast.error("You can recommend up to 3 commanders");
          }
        }}
      />

      <GogoDialog
        open={gogoOpen}
        onClose={() => setGogoOpen(false)}
        cards={gameData?.gogoCards ?? []}
        selected={state.gogoCards}
        rarity={gogoRarity}
        onRarity={setGogoRarity}
        onAdd={(id) => {
          if (state.gogoCards.includes(id)) return;
          if (state.gogoCards.length >= 10) {
            toast.error("You can prioritize up to 10 gogo cards");
            return;
          }
          update({ gogoCards: [...state.gogoCards, id] });
        }}
        onRemove={(id) => update({ gogoCards: state.gogoCards.filter((c) => c !== id) })}
      />
    </DndContext>
  );
}

function heroesOnBoardCap(_rows: number, _cols: number): number {
  return 30;
}

function CommanderAvatar({ commander, size }: { commander: Commander; size: string }) {
  return commander.image ? (
    <img
      src={commander.image}
      alt=""
      loading="lazy"
      className={cn("shrink-0 rounded-lg object-cover ring-1 ring-primary/40", size)}
    />
  ) : (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-lg bg-primary/15 text-xs font-black text-primary",
        size,
      )}
    >
      {commander.name.slice(0, 1)}
    </span>
  );
}

function CommanderDialog({
  open,
  onClose,
  commanders,
  mode,
  selected,
  onMode,
  onToggle,
}: {
  open: boolean;
  onClose: () => void;
  commanders: Commander[];
  mode: "all" | "recommended";
  selected: string[];
  onMode: (m: "all" | "recommended") => void;
  onToggle: (id: string) => void;
}) {
  const commanderTypes = useMemo(
    () =>
      Array.from(new Set(commanders.map((c) => c.type).filter(Boolean) as string[])).sort(),
    [commanders],
  );
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const visibleCommanders =
    typeFilter === "all"
      ? commanders
      : commanders.filter((c) => c.type === typeFilter);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Commanders</DialogTitle>
        </DialogHeader>

        <div className="space-y-1.5">
          <label
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border p-3",
              mode === "all" ? "border-primary bg-primary/10" : "border-border bg-surface",
            )}
          >
            <input
              type="radio"
              checked={mode === "all"}
              onChange={() => onMode("all")}
              className="accent-primary"
            />
            <span className="text-sm font-medium">
              Any commander works
              <span className="block text-xs font-normal text-muted">
                This lineup is not tied to a specific commander.
              </span>
            </span>
          </label>
          <label
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border p-3",
              mode === "recommended" ? "border-primary bg-primary/10" : "border-border bg-surface",
            )}
          >
            <input
              type="radio"
              checked={mode === "recommended"}
              onChange={() => onMode("recommended")}
              className="accent-primary"
            />
            <span className="text-sm font-medium">
              Recommended commanders
              <span className="block text-xs font-normal text-muted">
                Pick up to 3 commanders that are viable with this strategy.
              </span>
            </span>
          </label>
        </div>

        {commanderTypes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setTypeFilter("all")}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                typeFilter === "all"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted hover:border-primary/40",
              )}
            >
              All types
            </button>
            {commanderTypes.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(typeFilter === t ? "all" : t)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  typeFilter === t
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted hover:border-primary/40",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {mode === "recommended" && (
          <div className="space-y-1.5">
            {visibleCommanders.map((c) => {
              const checked = selected.includes(c._id);
              const full = selected.length >= 3 && !checked;
              return (
                <label
                  key={c._id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-2.5",
                    checked ? "border-primary/60 bg-primary/10" : "border-border bg-surface",
                    full ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(c._id)}
                    disabled={full}
                    className="accent-primary"
                  />
                  <CommanderAvatar commander={c} size="h-9 w-9" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{c.name}</span>
                    {c.type && (
                      <span className="block truncate text-xs text-muted">{c.type}</span>
                    )}
                  </span>
                  {selected.indexOf(c._id) >= 0 && (
                    <span className="ml-auto text-[10px] font-black text-muted">
                      #{selected.indexOf(c._id) + 1}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function GogoDialog({
  open,
  onClose,
  cards,
  selected,
  rarity,
  onRarity,
  onAdd,
  onRemove,
}: {
  open: boolean;
  onClose: () => void;
  cards: GoGoCard[];
  selected: string[];
  rarity: "all" | GoGoCardRarity;
  onRarity: (r: "all" | GoGoCardRarity) => void;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const filtered = cards.filter((c) => rarity === "all" || c.rarity === rarity);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[80vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Prioritize gogo cards</span>
            <span className="text-xs font-normal text-muted">{selected.length}/10</span>
          </DialogTitle>
        </DialogHeader>

        {selected.length > 0 && (
          <div className="space-y-1.5">
            {[...selected].sort((a, b) => selected.indexOf(a) - selected.indexOf(b)).map((id, i) => {
              const card = cards.find((c) => c._id === id);
              if (!card) return null;
              return (
                <div key={id} className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 p-2">
                  <ChevronRight className="h-3.5 w-3.5 text-accent" />
                  <span className="w-5 text-xs font-black">{i + 1}</span>
                  <span
                    className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
                    style={{
                      backgroundColor: `${RARITY_META[card.rarity].color}22`,
                      color: RARITY_META[card.rarity].color,
                    }}
                  >
                    {RARITY_META[card.rarity].label}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{card.name}</span>
                  <button className="cursor-pointer text-muted hover:text-danger" onClick={() => onRemove(id)}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {(["all", "power", "orange", "purple", "blue"] as const).map((r) => (
            <button
              key={r}
              onClick={() => onRarity(r)}
              className={cn(
                "cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                rarity === r ? "bg-primary/20 text-foreground" : "text-muted hover:bg-elevated",
              )}
              style={
                r !== "all" && rarity !== r
                  ? { color: `${RARITY_META[r].color}aa` }
                  : undefined
              }
            >
              {r}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {filtered.map((card) => {
            const added = selected.includes(card._id);
            const meta = RARITY_META[card.rarity];
            return (
              <div
                key={card._id}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border p-2.5",
                  added ? "border-primary/50 bg-primary/10" : "border-border bg-surface",
                )}
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg text-sm font-black"
                  style={{
                    backgroundColor: `${meta.color}1f`,
                    color: meta.color,
                    boxShadow: `0 0 0 2px ${meta.color}`,
                    ...(card.rarity === "power"
                      ? { backgroundImage: RAINBOW_GRADIENT, color: "#111" }
                      : {}),
                  }}
                >
                  {card.image ? (
                    <img src={card.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : card.rarity === "power" ? (
                    <span className="rounded-md bg-white/85 px-1">P</span>
                  ) : (
                    card.name.slice(0, 1)
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{card.name}</span>
                  {card.description && (
                    <span className="line-clamp-2 block text-[11px] leading-snug text-muted">
                      {card.description}
                    </span>
                  )}
                </span>
                <button
                  title={added ? "Already prioritized" : "Prioritize this card"}
                  onClick={() => onAdd(card._id)}
                  disabled={added}
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-lg border transition-colors",
                    added
                      ? "cursor-not-allowed border-border text-muted opacity-50"
                      : "cursor-pointer border-border text-accent hover:border-accent hover:bg-accent/10",
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailsStep({
  state,
  update,
  tagInput,
  setTagInput,
  onBack,
  onSubmit,
  saving,
  savingStatus,
  isEdit,
}: {
  state: EditorState;
  update: (patch: Partial<EditorState>) => void;
  tagInput: string;
  setTagInput: (v: string) => void;
  onBack: () => void;
  onSubmit: (status: "draft" | "published") => void;
  saving: boolean;
  savingStatus: string;
  isEdit: boolean;
}) {
  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadsApi.image(file, "lineups"),
    onSuccess: (res) =>
      update({ thumbnailUrl: res.data.data.url, thumbnailPublicId: res.data.data.publicId }),
    onError: (err) => toast.error(getApiErrorMessage(err, "Thumbnail upload failed")),
  });

  const STRATEGY_FIELDS: Array<[keyof EditorState["strategy"], string]> = [
    ["earlyGame", "Early game"],
    ["midGame", "Mid game"],
    ["lateGame", "Late game"],
    ["economy", "Economy"],
    ["leveling", "Leveling"],
    ["positioning", "Positioning"],
    ["tips", "Tips"],
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-16">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft /> Back to board
        </Button>
        <span className="ml-auto text-sm text-muted">
          Final step — describe how to play this comp.
        </span>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input
              value={state.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="e.g. Emberbound reroll into Tempest carry"
              maxLength={120}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <Select
                value={state.difficulty}
                onValueChange={(v) => update({ difficulty: v as EditorState["difficulty"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner friendly</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tags (comma separated)</Label>
              <Input
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  update({
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .slice(0, 10),
                  });
                }}
                placeholder="reroll, fast-9, burn"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={state.description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="One or two sentences summarizing the comp…"
              maxLength={2000}
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="cursor-pointer text-sm text-accent hover:underline">
              {uploadMutation.isPending ? (
                <Loader2 className="inline h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Upload className="mr-1 inline h-4 w-4" />
                  {state.thumbnailUrl ? "Replace thumbnail" : "Upload thumbnail"}
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadMutation.mutate(f);
                }}
              />
            </label>
            {state.thumbnailUrl && (
              <img src={state.thumbnailUrl} alt="" className="h-12 w-20 rounded-lg object-cover" />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <p className="text-sm font-semibold">Strategy</p>
          {STRATEGY_FIELDS.map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <Label>{label}</Label>
              <Textarea
                value={state.strategy[key]}
                onChange={(e) =>
                  update({ strategy: { ...state.strategy, [key]: e.target.value } })
                }
                className="min-h-20"
                placeholder={`Markdown supported…`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="sticky bottom-4 flex justify-end gap-2 rounded-none border-[3px] border-foreground bg-card p-3 shadow-comic-lg">
        <Button
          variant="secondary"
          onClick={() => onSubmit("draft")}
          disabled={saving}
        >
          {saving && savingStatus === "draft" && <Loader2 className="animate-spin" />}
          {isEdit ? "Save changes" : "Save as draft"}
        </Button>
        <Button onClick={() => onSubmit("published")} disabled={saving}>
          {saving && savingStatus === "published" && <Loader2 className="animate-spin" />}
          {isEdit ? "Update lineup" : "Publish lineup"}
        </Button>
      </div>
    </div>
  );
}
