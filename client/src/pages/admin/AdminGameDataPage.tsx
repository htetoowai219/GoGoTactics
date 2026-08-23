import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, CheckSquare, Database, ImagePlus, Loader2, Pencil, Plus, Square, Trash2 } from "lucide-react";
import {
  adminApi,
  getApiErrorMessage,
  uploadsApi,
} from "../../api/endpoints";
import { useGameData } from "../../hooks/useGameData";
import { heroFaction, heroRoles } from "../../lib/heroSynergies";
import { cn } from "../../lib/utils";
import type { GameDataBundle, Synergy } from "../../types";
import { Seo } from "../../components/Seo";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

type EntityKey =
  | "seasons"
  | "game-modes"
  | "commanders"
  | "heroes"
  | "synergies"
  | "equipment"
  | "gogo-cards";

const ENTITIES: { key: EntityKey; label: string; singular: string }[] = [
  { key: "seasons", label: "Seasons", singular: "season" },
  { key: "game-modes", label: "Game modes", singular: "game mode" },
  { key: "commanders", label: "Commanders", singular: "commander" },
  { key: "heroes", label: "Heroes", singular: "hero" },
  { key: "synergies", label: "Synergies", singular: "synergy" },
  { key: "equipment", label: "Equipment", singular: "equipment" },
  { key: "gogo-cards", label: "GoGo cards", singular: "gogo card" },
];

const IMAGE_ENTITIES: EntityKey[] = [
  "commanders",
  "heroes",
  "synergies",
  "equipment",
  "gogo-cards",
];

const RARITY_BADGE = {
  power: "danger",
  orange: "gold",
  purple: "default",
  blue: "cyan",
} as const;

function synergyId(v: unknown): string {
  if (v && typeof v === "object" && "_id" in v) return String((v as { _id: unknown })._id);
  return String(v ?? "");
}

interface ImagePickerProps {
  shape: "circle" | "card";
  previewUrl: string | null;
  onSelect: (file: File | null) => void;
}

function ImagePicker({ shape, previewUrl, onSelect }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const frame =
    shape === "circle"
      ? "h-16 w-16 rounded-full"
      : "h-[76px] w-14 rounded-lg";

  return (
    <div className="space-y-1.5">
      <Label>Image</Label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`${frame} relative shrink-0 overflow-hidden border border-border bg-surface transition-opacity hover:opacity-80`}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center text-muted">
              <ImagePlus className={shape === "circle" ? "h-5 w-5" : "h-4 w-4"} />
            </span>
          )}
        </button>
        <div className="text-xs text-muted">
          <p>{shape === "circle" ? "Square image, shown circular." : "Portrait image, shown as a card."}</p>
          {previewUrl && (
            <button
              type="button"
              className="mt-1 text-danger hover:underline"
              onClick={() => {
                onSelect(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              Remove selection
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

interface EntityFormProps {
  entity: EntityKey;
  initial?: Record<string, unknown>;
  onSubmit: (body: Record<string, unknown>) => void;
  submitting: boolean;
}

function EntityForm({ entity, initial, onSubmit, submitting }: EntityFormProps) {
  const { data: gameData } = useGameData();
  const synergies = (gameData?.synergies ?? []) as Synergy[];
  const factions = synergies.filter((s) => s.type === "faction");
  const roles = synergies.filter((s) => s.type === "role");

  const [name, setName] = useState(String(initial?.name ?? ""));
  const [description, setDescription] = useState(String(initial?.description ?? ""));
  const [commanderType, setCommanderType] = useState(String(initial?.type ?? ""));
  const [number, setNumber] = useState(String(initial?.number ?? ""));
  const [rows, setRows] = useState(
    String((initial?.boardConfig as { rows?: number } | undefined)?.rows ?? 3),
  );
  const [cols, setCols] = useState(
    String((initial?.boardConfig as { cols?: number } | undefined)?.cols ?? 7),
  );
  const [cost, setCost] = useState(String(initial?.cost ?? 1));
  const existingSynergyIds: string[] = Array.isArray(initial?.synergies)
    ? (initial?.synergies as unknown[]).map(synergyId)
    : [];
  const [factionId, setFactionId] = useState(
    existingSynergyIds.find((id) => factions.some((f) => f._id === id)) ?? "",
  );
  const [roleIds, setRoleIds] = useState<string[]>(
    existingSynergyIds.filter((id) => roles.some((r) => r._id === id)),
  );
  const [synType, setSynType] = useState<"faction" | "role">(
    (initial?.type as "faction" | "role") ?? "faction",
  );
  const [tier, setTier] = useState(String(initial?.tier ?? ""));
  const [statType, setStatType] = useState(String(initial?.statType ?? "attack"));
  const [category, setCategory] = useState(
    String(initial?.category ?? "regular"),
  );
  const [rarity, setRarity] = useState(String(initial?.rarity ?? "power"));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initial?.image ? String(initial.image) : null,
  );
  const [uploading, setUploading] = useState(false);

  const hasImage = IMAGE_ENTITIES.includes(entity);
  const imageShape = entity === "gogo-cards" ? "card" : "circle";

  const heroesValid =
    entity !== "heroes" ||
    (factionId !== "" && roleIds.length >= 1 && roleIds.length <= 2);

  const toggleRole = (id: string) =>
    setRoleIds((prev) =>
      prev.includes(id)
        ? prev.filter((r) => r !== id)
        : prev.length < 2
          ? [...prev, id]
          : prev,
    );

  const submit = async () => {
    const body: Record<string, unknown> =
      entity === "commanders"
        ? { name, type: commanderType }
        : entity === "synergies"
          ? { name }
          : { name, description };
    if (entity === "seasons" && number) body.number = Number(number);
    if (entity === "game-modes") body.boardConfig = { rows: Number(rows), cols: Number(cols) };
    if (entity === "heroes") {
      body.cost = Number(cost);
      body.synergies = [factionId, ...roleIds];
    }
    if (entity === "synergies") {
      body.type = synType;
    }
    if (entity === "equipment") {
      if (tier) body.tier = Number(tier);
      body.statType = statType;
      body.category = category;
    }
    if (entity === "gogo-cards") {
      body.rarity = rarity;
    }
    if (imageFile) {
      try {
        setUploading(true);
        const res = await uploadsApi.image(imageFile, "game-data");
        body.image = res.data.data.url;
        body.imagePublicId = res.data.data.publicId;
      } catch (e) {
        toast.error(getApiErrorMessage(e));
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    onSubmit(body);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      {hasImage && (
        <ImagePicker
          shape={imageShape}
          previewUrl={previewUrl}
          onSelect={(file) => {
            setImageFile(file);
            setPreviewUrl(file ? URL.createObjectURL(file) : initial?.image ? String(initial.image) : null);
          }}
        />
      )}

      {entity === "commanders" ? (
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Input
            value={commanderType}
            onChange={(e) => setCommanderType(e.target.value)}
            placeholder="e.g. Defense, Magic, Support"
          />
        </div>
      ) : entity !== "synergies" && (
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-16" />
        </div>
      )}

      {entity === "seasons" && (
        <div className="space-y-1.5">
          <Label>Number</Label>
          <Input type="number" value={number} onChange={(e) => setNumber(e.target.value)} />
        </div>
      )}

      {entity === "game-modes" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Board rows</Label>
            <Input type="number" min={1} max={8} value={rows} onChange={(e) => setRows(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Board columns</Label>
            <Input type="number" min={1} max={10} value={cols} onChange={(e) => setCols(e.target.value)} />
          </div>
        </div>
      )}

      {entity === "heroes" && (
        <>
          <div className="space-y-1.5">
            <Label>Cost</Label>
            <Input type="number" min={1} max={9} value={cost} onChange={(e) => setCost(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Faction synergy</Label>
            <select
              value={factionId}
              onChange={(e) => setFactionId(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm"
            >
              <option value="">Select a faction…</option>
              {factions.map((f) => (
                <option key={f._id} value={f._id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Role synergies (pick 1–2)</Label>
            <div className="flex flex-wrap gap-1.5">
              {roles.map((r) => (
                <button
                  key={r._id}
                  type="button"
                  onClick={() => toggleRole(r._id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    roleIds.includes(r._id)
                      ? "border-gold/50 bg-gold/15 text-amber-300"
                      : "border-border bg-surface text-muted hover:text-foreground"
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {entity === "synergies" && (
        <div className="space-y-1.5">
          <Label>Type</Label>
          <div className="flex gap-2">
            {(["faction", "role"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSynType(t)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                  synType === t
                    ? "border-primary/50 bg-primary/15 text-foreground"
                    : "border-border bg-surface text-muted hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {entity === "equipment" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tier</Label>
              <Input type="number" min={1} max={3} value={tier} onChange={(e) => setTier(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Stat type</Label>
              <select
                value={statType}
                onChange={(e) => setStatType(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm"
              >
                {["attack", "magic", "defense", "utility"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm"
            >
              {[
                "regular",
                "magic-crystal",
                "commander-exclusive",
                "synergy-exclusive",
                "special",
              ].map((c) => (
                <option key={c} value={c}>
                  {c.replace(/-/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {entity === "gogo-cards" && (
        <div className="space-y-1.5">
          <Label>Rarity</Label>
          <select
            value={rarity}
            onChange={(e) => setRarity(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm"
          >
            {["power", "orange", "purple", "blue"].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      )}

      {!heroesValid && (
        <p className="text-xs text-danger">
          Pick one faction synergy and 1–2 role synergies.
        </p>
      )}

      <Button
        onClick={() => void submit()}
        disabled={!name.trim() || !heroesValid || submitting || uploading}
        className="w-full"
      >
        {submitting || uploading ? "Saving…" : initial ? "Save changes" : "Create"}
      </Button>
    </div>
  );
}

function EntityThumb({
  entityKey,
  item,
}: {
  entityKey: EntityKey;
  item: Record<string, unknown>;
}) {
  const image = item.image ? String(item.image) : null;

  if (!["commanders", "heroes", "synergies", "equipment", "gogo-cards"].includes(entityKey)) {
    return null;
  }

  if (entityKey === "gogo-cards") {
    return (
      <span className="block h-[52px] w-10 shrink-0 overflow-hidden rounded-md border border-border bg-surface">
        {image ? (
          <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-muted">
            <ImagePlus className="h-3.5 w-3.5" />
          </span>
        )}
      </span>
    );
  }

  return (
    <span className="block h-11 w-11 shrink-0 overflow-hidden rounded-full border border-border bg-surface">
      {image ? (
        <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <span className="grid h-full w-full place-items-center text-sm font-bold text-muted">
          {String(item.name).slice(0, 1)}
        </span>
      )}
    </span>
  );
}

export default function AdminGameDataPage() {
  const queryClient = useQueryClient();
  const { data } = useGameData();
  const [dialogEntity, setDialogEntity] = useState<EntityKey | null>(null);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<{
    entity: EntityKey;
    ids: string[];
    label: string;
  } | null>(null);

  const refetchGameData = async () => {
    await queryClient.invalidateQueries({ queryKey: ["game-data"] });
    await queryClient.refetchQueries({ queryKey: ["game-data"], type: "active" });
  };

  const createMutation = useMutation({
    mutationFn: ({ entity, body }: { entity: EntityKey; body: Record<string, unknown> }) =>
      adminApi.createEntity(entity, body),
    onSuccess: () => {
      toast.success("Created");
      setDialogEntity(null);
      void refetchGameData();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      entity,
      id,
      body,
    }: {
      entity: EntityKey;
      id: string;
      body: Record<string, unknown>;
    }) => adminApi.updateEntity(entity, id, body),
    onSuccess: () => {
      toast.success("Updated");
      setDialogEntity(null);
      setEditing(null);
      void refetchGameData();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ entity, id }: { entity: EntityKey; id: string }) =>
      adminApi.deleteEntity(entity, id),
    onSuccess: async () => {
      await refetchGameData();
      toast.success("Deleted");
      setConfirmDelete(null);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: ({ entity, ids }: { entity: EntityKey; ids: string[] }) =>
      adminApi.deleteEntities(entity, ids),
    onSuccess: async (res, vars) => {
      await refetchGameData();
      setSelected(new Set());
      setSelectMode(false);
      toast.success(
        `Deleted ${res.data.data.deletedCount} ${vars.entity.replace(/-/g, " ")}`,
      );
      setConfirmDelete(null);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const lists: Record<EntityKey, Array<Record<string, unknown>>> = data
    ? {
        seasons: data.seasons as unknown as Array<Record<string, unknown>>,
        "game-modes": data.gameModes as unknown as Array<Record<string, unknown>>,
        commanders: data.commanders as unknown as Array<Record<string, unknown>>,
        heroes: data.heroes as unknown as Array<Record<string, unknown>>,
        synergies: data.synergies as unknown as Array<Record<string, unknown>>,
        equipment: data.equipment as unknown as Array<Record<string, unknown>>,
        "gogo-cards": data.gogoCards as unknown as Array<Record<string, unknown>>,
      }
    : {
        seasons: [],
        "game-modes": [],
        commanders: [],
        heroes: [],
        synergies: [],
        equipment: [],
        "gogo-cards": [],
      };

  const activeMeta = ENTITIES.find((e) => e.key === dialogEntity);

  return (
    <>
      <Seo title="Admin · Game data" noIndex />
      <h1 className="mb-1 flex items-center gap-2 text-xl font-bold">
        <Database className="h-5 w-5 text-accent" /> Game data
      </h1>
      <p className="mb-6 text-sm text-muted">
        Add new seasons, heroes and gear without touching code — the whole site renders
        dynamically from these entities.
      </p>

      <Tabs
        defaultValue="heroes"
        onValueChange={() => exitSelectMode()}
      >
        <TabsList className="mb-4 w-full justify-start overflow-x-auto">
          {ENTITIES.map((entity) => (
            <TabsTrigger key={entity.key} value={entity.key}>
              {entity.label}
              <span className="ml-1.5 rounded bg-elevated px-1.5 py-0.5 text-[10px] text-muted">
                {lists[entity.key].length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {ENTITIES.map((entity) => {
          const tabItems = lists[entity.key];
          const tabIds = tabItems.map((item) => String(item._id));
          const selectedCount = tabIds.filter((id) => selected.has(id)).length;
          const allSelected = tabIds.length > 0 && selectedCount === tabIds.length;

          return (
          <TabsContent key={entity.key} value={entity.key}>
            <div className="mb-3 flex items-center justify-end gap-2">
              {selectMode ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={tabIds.length === 0}
                    onClick={() =>
                      setSelected((prev) => {
                        const next = new Set(prev);
                        for (const id of tabIds) {
                          if (allSelected) next.delete(id);
                          else next.add(id);
                        }
                        return next;
                      })
                    }
                  >
                    {allSelected ? <Square /> : <CheckSquare />}
                    {allSelected ? "Deselect all" : "Select all"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={exitSelectMode}
                    disabled={
                      deleteMutation.isPending || bulkDeleteMutation.isPending
                    }
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={
                      selectedCount === 0 ||
                      deleteMutation.isPending ||
                      bulkDeleteMutation.isPending
                    }
                    onClick={() =>
                      setConfirmDelete({
                        entity: entity.key,
                        ids: [...selected].filter((id) =>
                          lists[entity.key].some((item) => String(item._id) === id),
                        ),
                        label: `${selectedCount} selected ${entity.singular}${selectedCount === 1 ? "" : "s"}`,
                      })
                    }
                  >
                    <Trash2 /> Delete selected ({selectedCount})
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectMode(true)}
                  >
                    <Trash2 /> Delete
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => { setEditing(null); setDialogEntity(entity.key); }}
                  >
                    <Plus /> New {entity.singular}
                  </Button>
                </>
              )}
            </div>

            {lists[entity.key].length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
                No {entity.label.toLowerCase()} yet.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {lists[entity.key].map((item) => {
                  const itemId = String(item._id);
                  const isSelected = selected.has(itemId);
                  return (
                  <div
                    key={itemId}
                    onClick={selectMode ? () => toggleSelected(itemId) : undefined}
                    className={cn(
                      "group relative flex gap-3 rounded-lg border border-border bg-card p-3 pr-16 transition-colors",
                      selectMode && [
                        "cursor-pointer select-none pl-10 hover:border-primary/50",
                        isSelected && "border-primary/60 bg-primary/10",
                      ],
                    )}
                  >
                    {selectMode && (
                      <input
                        type="checkbox"
                        aria-label={`Select ${String(item.name)}`}
                        checked={isSelected}
                        onChange={() => toggleSelected(itemId)}
                        className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 accent-primary"
                      />
                    )}
                    <EntityThumb entityKey={entity.key} item={item} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{String(item.name)}</p>
                      {item.description ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted">{String(item.description)}</p>
                      ) : null}
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {entity.key === "heroes" && (
                          <>
                            <Badge variant="secondary">cost {String(item.cost)}</Badge>
                            {heroFaction(item as never) && (
                              <Badge variant="cyan">
                                {heroFaction(item as never)!.name}
                              </Badge>
                            )}
                            {heroRoles(item as never).map((r) => (
                              <Badge key={r._id} variant="gold">
                                {r.name}
                              </Badge>
                            ))}
                          </>
                        )}
                        {entity.key === "synergies" && (
                          <Badge variant={item.type === "role" ? "gold" : "cyan"}>
                            {String(item.type ?? "faction")}
                          </Badge>
                        )}
                        {entity.key === "game-modes" && (
                          <Badge variant="cyan">
                            {(item.boardConfig as { rows?: number })?.rows ?? 3}×
                            {(item.boardConfig as { cols?: number })?.cols ?? 7}
                          </Badge>
                        )}
                        {entity.key === "seasons" && (item.isActive as boolean) && (
                          <Badge variant="success">active</Badge>
                        )}
                        {entity.key === "equipment" && (
                          <>
                            {item.tier ? (
                              <Badge variant="gold">T{String(item.tier)}</Badge>
                            ) : null}
                            <Badge variant="secondary">
                              {String(item.category ?? "regular").replace(/-/g, " ")}
                            </Badge>
                          </>
                        )}
                        {entity.key === "gogo-cards" && (
                          <Badge variant={RARITY_BADGE[String(item.rarity) as keyof typeof RARITY_BADGE] ?? "secondary"}>
                            {String(item.rarity)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {!selectMode && (
                      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => { setEditing(item); setDialogEntity(entity.key); }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-danger hover:text-danger"
                          onClick={() =>
                            setConfirmDelete({
                              entity: entity.key,
                              ids: [String(item._id)],
                              label: String(item.name),
                            })
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
          );
        })}
      </Tabs>

      <Dialog
        open={confirmDelete !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-danger" /> Delete{" "}
              {confirmDelete
                ? ENTITIES.find((e) => e.key === confirmDelete.entity)?.label
                : ""}
              ?
            </DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold text-foreground">
                {confirmDelete?.label ?? ""}
              </span>
              . Any uploaded image for it is removed from Cloudinary as well. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setConfirmDelete(null)}
              disabled={
                deleteMutation.isPending || bulkDeleteMutation.isPending
              }
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={deleteMutation.isPending || bulkDeleteMutation.isPending}
              onClick={() => {
                if (!confirmDelete) return;
                if (confirmDelete.ids.length === 1) {
                  deleteMutation.mutate({
                    entity: confirmDelete.entity,
                    id: confirmDelete.ids[0],
                  });
                } else {
                  bulkDeleteMutation.mutate({
                    entity: confirmDelete.entity,
                    ids: confirmDelete.ids,
                  });
                }
              }}
            >
              {(deleteMutation.isPending || bulkDeleteMutation.isPending) && (
                <Loader2 className="animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogEntity !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDialogEntity(null);
            setEditing(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit" : "New"} {activeMeta?.singular}
            </DialogTitle>
          </DialogHeader>
          {dialogEntity && (
            <EntityForm
              key={editing ? String(editing._id) : "new"}
              entity={dialogEntity}
              initial={editing ?? undefined}
              submitting={createMutation.isPending || updateMutation.isPending}
              onSubmit={(body) => {
                if (editing?._id) {
                  updateMutation.mutate({
                    entity: dialogEntity,
                    id: String(editing._id),
                    body,
                  });
                } else {
                  createMutation.mutate({ entity: dialogEntity, body });
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
