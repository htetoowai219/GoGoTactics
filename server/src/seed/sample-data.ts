/**
 * SAMPLE / FICTIONAL GAME DATA
 * All commanders, heroes, synergies and equipment below are invented for
 * development and demo purposes. They do NOT represent real Magic Chess:
 * Go Go statistics or official game content.
 */

export interface SeedUser {
  username: string;
  email: string;
  role: "user" | "admin";
  bio: string;
}

export const seedUsers: SeedUser[] = [
  {
    username: "gogoadmin",
    email: "admin@gogotactics.dev",
    role: "admin",
    bio: "Platform administrator. Keeping the arena fair.",
  },
  {
    username: "tactifox",
    email: "fox@gogotactics.dev",
    role: "user",
    bio: "Aggro enthusiast. If it explodes turn 2, I play it. (sample account)",
  },
  {
    username: "moonwarden",
    email: "moon@gogotactics.dev",
    role: "user",
    bio: "Control player. Patience wins games. (sample account)",
  },
  {
    username: "shadowstep",
    email: "shadow@gogotactics.dev",
    role: "user",
    bio: "Assassin connoisseur. Backline? Gone. (sample account)",
  },
  {
    username: "oakheart",
    email: "oak@gogotactics.dev",
    role: "user",
    bio: "Slow and steady ramp builds. (sample account)",
  },
];

export const seedSeason = {
  name: "Season 1 · Sample",
  slug: "season-1-sample",
  number: 1,
  description:
    "SAMPLE DATA — fictional first season used for development and demos.",
};

export const seedGameModes = [
  {
    name: "Classic",
    slug: "classic",
    description: "SAMPLE DATA — standard mode on the full 3x7 board.",
    boardConfig: { rows: 3, cols: 7 },
  },
  {
    name: "Blitz",
    slug: "blitz",
    description: "SAMPLE DATA — faster matches on a smaller 3x5 board.",
    boardConfig: { rows: 3, cols: 5 },
  },
];

export const seedSynergies = [
  {
    name: "Emberbound",
    slug: "emberbound",
    type: "faction" as const,
    color: "#f97316",
    activationLevels: [
      { count: 2, effect: "Attacks apply a small burn." },
      { count: 4, effect: "Burns spread to adjacent enemies." },
      { count: 6, effect: "Burns deal double damage and stack." },
    ],
  },
  {
    name: "Tidal Pact",
    slug: "tidal-pact",
    type: "faction" as const,
    color: "#38bdf8",
    activationLevels: [
      { count: 2, effect: "Allies regenerate 1% HP per second." },
      { count: 4, effect: "Regeneration increased to 2% per second." },
      { count: 6, effect: "Healing also cleanses debuffs." },
    ],
  },
  {
    name: "Verdant Circle",
    slug: "verdant-circle",
    type: "faction" as const,
    color: "#22c55e",
    activationLevels: [
      { count: 2, effect: "+5% max HP to Verdant units." },
      { count: 4, effect: "+10% max HP and +10% attack speed." },
      { count: 6, effect: "Fallen Verdant units revive once at 30% HP." },
    ],
  },
  {
    name: "Shadow Covenant",
    slug: "shadow-covenant",
    type: "faction" as const,
    color: "#a78bfa",
    activationLevels: [
      { count: 2, effect: "Shadow units gain 15% crit chance." },
      { count: 4, effect: "Shadow units open fights in stealth." },
      { count: 6, effect: "Stealth attacks always crit." },
    ],
  },
  {
    name: "Ironclad Legion",
    slug: "ironclad-legion",
    type: "role" as const,
    color: "#94a3b8",
    activationLevels: [
      { count: 2, effect: "Allies gain a 100-point shield." },
      { count: 4, effect: "Shield increased to 250 points." },
      { count: 6, effect: "Shields refresh every round." },
    ],
  },
  {
    name: "Storm Callers",
    slug: "storm-callers",
    type: "role" as const,
    color: "#facc15",
    activationLevels: [
      { count: 2, effect: "Every 4th attack chains lightning." },
      { count: 4, effect: "Chains hit 2 extra enemies." },
      { count: 6, effect: "Chains stun for 0.5s." },
    ],
  },
  {
    name: "Arcane Weavers",
    slug: "arcane-weavers",
    type: "role" as const,
    color: "#e879f9",
    activationLevels: [
      { count: 2, effect: "-10% enemy magic resist." },
      { count: 4, effect: "-20% enemy magic resist." },
      { count: 6, effect: "Spells also refund 15 mana on cast." },
    ],
  },
  {
    name: "Beast Kin",
    slug: "beast-kin",
    type: "role" as const,
    color: "#fb923c",
    activationLevels: [
      { count: 2, effect: "Below 50% HP: +20% attack damage." },
      { count: 4, effect: "Below 60% HP: +35% attack damage and lifesteal." },
      { count: 6, effect: "Enrage also grants 30% damage reduction." },
    ],
  },
];

export const seedCommanders = [
  { name: "Lyra Moonveil", slug: "lyra-moonveil", type: "Defense" },
  { name: "Warlord Kazrak", slug: "warlord-kazrak", type: "Aggression" },
  { name: "Archmage Cindralis", slug: "archmage-cindralis", type: "Magic" },
  { name: "Captain Bramblehart", slug: "captain-bramblehart", type: "Growth" },
  { name: "Nightblade Sera", slug: "nightblade-sera", type: "Assassin" },
  { name: "High Templar Aurelion", slug: "high-templar-aurelion", type: "Support" },
];

export interface SeedHero {
  name: string;
  slug: string;
  cost: number;
  synergies: string[];
  description: string;
}

export const seedHeroes: SeedHero[] = [
  { name: "Cinder Imp", slug: "cinder-imp", cost: 1, synergies: ["emberbound", "arcane-weavers"], description: "SAMPLE — fragile early-game burner." },
  { name: "Tidecaller Nix", slug: "tidecaller-nix", cost: 1, synergies: ["tidal-pact", "storm-callers"], description: "SAMPLE — minor heals and mana support." },
  { name: "Sapling Guard", slug: "sapling-guard", cost: 1, synergies: ["verdant-circle", "ironclad-legion"], description: "SAMPLE — cheap frontline holder." },
  { name: "Dusk Rat", slug: "dusk-rat", cost: 1, synergies: ["shadow-covenant", "beast-kin"], description: "SAMPLE — sneaky chip damage." },
  { name: "Forge Sentinel", slug: "forge-sentinel", cost: 2, synergies: ["emberbound", "ironclad-legion"], description: "SAMPLE — durable bruiser with burn." },
  { name: "Mist Warden", slug: "mist-warden", cost: 2, synergies: ["tidal-pact", "ironclad-legion"], description: "SAMPLE — shields and sustain." },
  { name: "Gloom Stalker", slug: "gloom-stalker", cost: 2, synergies: ["shadow-covenant", "beast-kin"], description: "SAMPLE — ranged poke from the dark." },
  { name: "Static Sprite", slug: "static-sprite", cost: 2, synergies: ["emberbound", "arcane-weavers"], description: "SAMPLE — cheap chain-lightning caster." },
  { name: "Magma Brute", slug: "magma-brute", cost: 3, synergies: ["emberbound", "beast-kin"], description: "SAMPLE — angry burning brawler." },
  { name: "Coral Oracle", slug: "coral-oracle", cost: 3, synergies: ["tidal-pact", "arcane-weavers"], description: "SAMPLE — team-wide mana battery." },
  { name: "Oakshield Elder", slug: "oakshield-elder", cost: 3, synergies: ["verdant-circle", "ironclad-legion"], description: "SAMPLE — mid-game anchor tank." },
  { name: "Thunderhawk", slug: "thunderhawk", cost: 3, synergies: ["shadow-covenant", "storm-callers", "beast-kin"], description: "SAMPLE — high-tempo ranged carry." },
  { name: "Pyrelord Vashka", slug: "pyrelord-vashka", cost: 4, synergies: ["emberbound", "arcane-weavers"], description: "SAMPLE — heavy AoE fire mage." },
  { name: "Leviathan Prime", slug: "leviathan-prime", cost: 4, synergies: ["tidal-pact", "storm-callers"], description: "SAMPLE — massive crowd-control tank." },
  { name: "Nightshade Queen", slug: "nightshade-queen", cost: 4, synergies: ["shadow-covenant", "beast-kin"], description: "SAMPLE — elite backline executioner." },
  { name: "Stormforged Colossus", slug: "stormforged-colossus", cost: 4, synergies: ["verdant-circle", "ironclad-legion"], description: "SAMPLE — armored lightning bruiser." },
  { name: "Worldflame Dragon", slug: "worldflame-dragon", cost: 5, synergies: ["emberbound", "beast-kin"], description: "SAMPLE — legendary board-wiping dragon." },
  { name: "Abyssal Titan", slug: "abyssal-titan", cost: 5, synergies: ["tidal-pact", "ironclad-legion"], description: "SAMPLE — unkillable deep-sea colossus." },
  { name: "Verdant Ancient", slug: "verdant-ancient", cost: 5, synergies: ["verdant-circle", "arcane-weavers"], description: "SAMPLE — legendary growth enabler." },
  { name: "Tempest Sovereign", slug: "tempest-sovereign", cost: 5, synergies: ["tidal-pact", "storm-callers", "arcane-weavers"], description: "SAMPLE — legendary storm archer carry." },
];

export const seedEquipment = [
  { name: "Bloodfang Blade", slug: "bloodfang-blade", tier: 3, statType: "attack" as const, category: "regular" as const, description: "SAMPLE — big physical damage plus lifesteal." },
  { name: "Stormpiercer Lance", slug: "stormpiercer-lance", tier: 3, statType: "attack" as const, category: "regular" as const, description: "SAMPLE — attacks pierce through targets." },
  { name: "Hunter's Bow", slug: "hunters-bow", tier: 2, statType: "attack" as const, category: "regular" as const, description: "SAMPLE — flat attack speed boost." },
  { name: "Void Scepter", slug: "void-scepter", tier: 3, statType: "magic" as const, category: "magic-crystal" as const, description: "SAMPLE — spells ignore part of magic resist." },
  { name: "Ember Grimoire", slug: "ember-grimoire", tier: 2, statType: "magic" as const, category: "magic-crystal" as const, description: "SAMPLE — boosts spell power and adds burn." },
  { name: "Frost Orb", slug: "frost-orb", tier: 1, statType: "magic" as const, category: "magic-crystal" as const, description: "SAMPLE — small spell power bump." },
  { name: "Aegis Plate", slug: "aegis-plate", tier: 3, statType: "defense" as const, category: "regular" as const, description: "SAMPLE — large armor and a starting shield." },
  { name: "Guardian's Bulwark", slug: "guardians-bulwark", tier: 2, statType: "defense" as const, category: "regular" as const, description: "SAMPLE — solid armor increase." },
  { name: "Thornmail Vest", slug: "thornmail-vest", tier: 1, statType: "defense" as const, category: "regular" as const, description: "SAMPLE — reflects a bit of damage." },
  { name: "Swift Boots", slug: "swift-boots", tier: 2, statType: "utility" as const, category: "regular" as const, description: "SAMPLE — movement and attack speed." },
  { name: "Chrono Pendant", slug: "chrono-pendant", tier: 3, statType: "utility" as const, category: "special" as const, description: "SAMPLE — starts combat with bonus mana." },
  { name: "Scout's Charm", slug: "scouts-charm", tier: 1, statType: "utility" as const, category: "special" as const, description: "SAMPLE — small dodge chance." },
  { name: "Sovereign's Scepter", slug: "sovereigns-scepter", tier: 3, statType: "utility" as const, category: "commander-exclusive" as const, description: "SAMPLE — only commanders can wield this royal relic." },
  { name: "Warhorn of the Legion", slug: "warhorn-of-the-legion", tier: 3, statType: "defense" as const, category: "commander-exclusive" as const, description: "SAMPLE — commander-only aura item that rallies nearby allies." },
  { name: "Emberbound Sigil", slug: "emberbound-sigil", tier: 3, statType: "attack" as const, category: "synergy-exclusive" as const, description: "SAMPLE — only Emberbound heroes can ignite with this sigil." },
  { name: "Tidal Pact Pearl", slug: "tidal-pact-pearl", tier: 3, statType: "magic" as const, category: "synergy-exclusive" as const, description: "SAMPLE — only Tidal Pact heroes can channel this pearl." },
];

export interface SeedGoGoCard {
  name: string;
  slug: string;
  rarity: "power" | "orange" | "purple" | "blue";
  description?: string;
}

export const seedGogoCards: SeedGoGoCard[] = [
  { name: "Overwhelming Force", slug: "overwhelming-force", rarity: "power", description: "SAMPLE — all allies gain a huge attack boost for one round." },
  { name: "Golden Treasury", slug: "golden-treasury", rarity: "power", description: "SAMPLE — instantly gain a large amount of gold." },
  { name: "Phoenix Blessing", slug: "phoenix-blessing", rarity: "orange", description: "SAMPLE — the first ally to fall revives once." },
  { name: "Arcane Surge", slug: "arcane-surge", rarity: "orange", description: "SAMPLE — mages cast their ultimate twice per round." },
  { name: "Iron Wall Doctrine", slug: "iron-wall-doctrine", rarity: "purple", description: "SAMPLE — frontline units take reduced damage." },
  { name: "Swift Maneuvers", slug: "swift-maneuvers", rarity: "purple", description: "SAMPLE — assassins jump at battle start." },
  { name: "Mana Springs", slug: "mana-springs", rarity: "blue", description: "SAMPLE — all units start with extra mana." },
  { name: "Scouting Report", slug: "scouting-report", rarity: "blue", description: "SAMPLE — see your next opponent's board." },
  { name: "Reinforcements", slug: "reinforcements", rarity: "blue", description: "SAMPLE — free unit slot for the next two rounds." },
];
