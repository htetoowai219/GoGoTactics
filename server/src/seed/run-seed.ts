/**
 * Seed script — wipes and repopulates the database with SAMPLE data.
 * Run with: npm run seed (inside /server)
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { User } from "../models/user.model.js";
import { Season } from "../models/season.model.js";
import { GameMode } from "../models/gameMode.model.js";
import { Commander } from "../models/commander.model.js";
import { Hero } from "../models/hero.model.js";
import { Synergy } from "../models/synergy.model.js";
import { Equipment } from "../models/equipment.model.js";
import { GoGoCard } from "../models/gogocard.model.js";
import { Lineup } from "../models/lineup.model.js";
import { Comment } from "../models/comment.model.js";
import { Rating } from "../models/rating.model.js";
import { Like } from "../models/like.model.js";
import { SavedLineup } from "../models/savedLineup.model.js";
import {
  seedUsers,
  seedSeason,
  seedGameModes,
  seedSynergies,
  seedCommanders,
  seedHeroes,
  seedEquipment,
  seedGogoCards,
} from "./sample-data.js";

interface LineupSeedSpec {
  title: string;
  description: string;
  author: string;
  commander: string;
  commanderSkillName: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
  daysAgo: number;
  featured?: boolean;
  heroes: Array<{
    hero: string;
    row: number;
    col: number;
    equipment?: string[];
    note?: string;
  }>;
  strategy: {
    earlyGame: string;
    midGame: string;
    lateGame: string;
    economy: string;
    leveling: string;
    positioning: string;
    tips: string;
  };
}

const lineupSpecs: LineupSeedSpec[] = [
  {
    title: "Ember Rush Aggro",
    description:
      "SAMPLE lineup — burn the board down before round 10. Built around early Emberbound activation and Kazrak's stun to snowball a lead.",
    author: "tactifox",
    commander: "warlord-kazrak",
    commanderSkillName: "Earthshatter",
    difficulty: "beginner",
    tags: ["aggro", "emberbound", "early-game"],
    daysAgo: 2,
    featured: true,
    heroes: [
      { hero: "sapling-guard", row: 0, col: 3, equipment: ["thornmail-vest"], note: "Sacrificial front anchor." },
      { hero: "forge-sentinel", row: 0, col: 2, equipment: ["guardians-bulwark"] },
      { hero: "magma-brute", row: 0, col: 4, equipment: ["bloodfang-blade"], note: "Secondary brawler." },
      { hero: "cinder-imp", row: 1, col: 3 },
      { hero: "dusk-rat", row: 1, col: 5 },
      { hero: "gloom-stalker", row: 2, col: 4 },
      { hero: "pyrelord-vashka", row: 2, col: 3, equipment: ["ember-grimoire", "void-scepter"], note: "Main carry." },
      { hero: "worldflame-dragon", row: 2, col: 5, equipment: ["void-scepter"], note: "Late-game win condition." },
    ],
    strategy: {
      earlyGame:
        "Buy every **Emberbound** unit you see. Cinder Imp + Forge Sentinel is a fine opening pair. Don't level yet — hold gold and lose rounds on purpose if needed.",
      midGame:
        "At level 5 slot in **Magma Brute** and push Emberbound 4. Use Kazrak's Earthshatter on clumped enemies right after their tank engages.",
      lateGame:
        "Find **Worldflame Dragon** — it single-handedly ends games. Position it center-back so the burn spreads across both flanks.",
      economy:
        "Hard econ until round 8. Keep at least 20 gold for interest, then spend down to find your 4-costs.",
      leveling:
        "Level on 5 → round 9 (level 6) → round 13 (level 7). Skip level 8 unless you're already winning.",
      positioning:
        "Tanks front-center, Vashka one tile behind them, Dragon dead last. Keep Dusk Rat on the flank opposite the enemy carry.",
      tips:
        "- Earthshatter is best used *second* — let the enemy commit first.\n- Sell Sapling Guard late; it's only there to protect your streak.",
    },
  },
  {
    title: "Tidal Control Sustain",
    description:
      "SAMPLE lineup — outlast everything with Tidal Pact regeneration and Lyra's healing. Wins by attrition in long rounds.",
    author: "moonwarden",
    commander: "lyra-moonveil",
    commanderSkillName: "Lunar Blessing",
    difficulty: "intermediate",
    tags: ["control", "tidal-pact", "late-game"],
    daysAgo: 5,
    heroes: [
      { hero: "leviathan-prime", row: 0, col: 3, equipment: ["aegis-plate"], note: "Primary frontline." },
      { hero: "sapling-guard", row: 0, col: 2 },
      { hero: "oakshield-elder", row: 0, col: 4, equipment: ["guardians-bulwark"] },
      { hero: "mist-warden", row: 1, col: 2 },
      { hero: "tidecaller-nix", row: 1, col: 4 },
      { hero: "coral-oracle", row: 2, col: 3, equipment: ["chrono-pendant"] },
      { hero: "static-sprite", row: 2, col: 2 },
      { hero: "tempest-sovereign", row: 2, col: 4, equipment: ["stormpiercer-lance", "swift-boots"], note: "Main carry." },
    ],
    strategy: {
      earlyGame:
        "Grab **Tidecaller Nix** and any Tidal units. It's fine to take chip damage — your comp scales hard.",
      midGame:
        "Activate Tidal Pact 4 with Mist Warden + Coral Oracle. Save Lunar Blessing for the round after the enemy uses their big AoE.",
      lateGame:
        "**Leviathan Prime** + **Tempest Sovereign** is the dream duo. Leviathan soaks and groups enemies while Sovereign cleans up.",
      economy:
        "Standard 5-streak econ. You want to hit level 8 comfortably, not fast.",
      leveling:
        "Slow-level every round you can afford it. This comp wants levels more than 3-star units.",
      positioning:
        "Triangle formation: tanks front, supports middle ring, Sovereign corner-back away from assassins.",
      tips:
        "- Lunar Blessing also cleanses burns — save it vs Emberbound.\n- Coral Oracle's mana feed makes Sovereign cast twice per fight.",
    },
  },
  {
    title: "Shadow Assassins Backline Dive",
    description:
      "SAMPLE lineup — Shadow Covenant 4 with Sera's Umbral Step deletes the enemy carry before the fight starts. High risk, high reward.",
    author: "shadowstep",
    commander: "nightblade-sera",
    commanderSkillName: "Umbral Step",
    difficulty: "advanced",
    tags: ["assassin", "shadow-covenant", "burst"],
    daysAgo: 1,
    featured: true,
    heroes: [
      { hero: "abyssal-titan", row: 0, col: 3, equipment: ["aegis-plate"], note: "Lone distraction tank." },
      { hero: "dusk-rat", row: 0, col: 0 },
      { hero: "nightshade-queen", row: 1, col: 6, equipment: ["bloodfang-blade", "swift-boots"], note: "Main carry — dives backline." },
      { hero: "gloom-stalker", row: 2, col: 6 },
      { hero: "magma-brute", row: 0, col: 5 },
      { hero: "pyrelord-vashka", row: 2, col: 2, equipment: ["ember-grimoire"] },
      { hero: "worldflame-dragon", row: 2, col: 3 },
    ],
    strategy: {
      earlyGame:
        "Take Dusk Rat early but don't commit items. Scout lobbies — this comp struggles vs heavy frontline comps.",
      midGame:
        "With Shadow Covenant 4, your units open in stealth. Time Umbral Step to land *after* stealth breaks for a guaranteed execute mark.",
      lateGame:
        "Queen needs Bloodfang + Swift Boots. She should one-shot any unit below 60% HP on engage.",
      economy:
        "Roll at level 7 once you have Queen 2-star. This is a hit-and-hope comp — know when to pivot.",
      leveling:
        "Fast level 7 by round 11. Levels matter less than hitting Nightshade Queen 2-star.",
      positioning:
        "Everything except Titan hugs the far corners. Titan alone front-center baits the enemy engage.",
      tips:
        "- If two players run backline carries, target the stronger one with Umbral Step.\n- Pivot to Tempest Sovereign carry if Queen never hits 2-star.",
    },
  },
  {
    title: "Verdant Ramp Midgame",
    description:
      "SAMPLE lineup — Verdant Circle growth scaling with Bramblehart shields. The longer the game goes, the harder you are to kill.",
    author: "oakheart",
    commander: "captain-bramblehart",
    commanderSkillName: "Rally the Grove",
    difficulty: "beginner",
    tags: ["verdant-circle", "ramp", "defensive"],
    daysAgo: 8,
    heroes: [
      { hero: "sapling-guard", row: 0, col: 3 },
      { hero: "oakshield-elder", row: 0, col: 2, equipment: ["aegis-plate"], note: "Frontline anchor." },
      { hero: "mist-warden", row: 1, col: 3 },
      { hero: "nightshade-queen", row: 1, col: 5 },
      { hero: "verdant-ancient", row: 2, col: 3, equipment: ["chrono-pendant"], note: "Scaling engine." },
      { hero: "thunderhawk", row: 2, col: 2, equipment: ["hunters-bow", "swift-boots"], note: "Carry." },
      { hero: "tempest-sovereign", row: 2, col: 4 },
    ],
    strategy: {
      earlyGame:
        "Verdant units are cheap and available. Take small losses — Rally the Grove keeps your HP healthy.",
      midGame:
        "Verdant Circle 4 comes online around round 12. From here your units out-stat everyone each round.",
      lateGame:
        "Add **Verdant Ancient** — its revive plus Bramblehart shields makes your board nearly unkillable.",
      economy:
        "Econ hard to 50 gold, then slow-roll interest above 30.",
      leveling:
        "Natural leveling pace. Don't fast-level — this comp wants 3-star Oakshield Elder more than level 9.",
      positioning:
        "Elder front-corner to soak dive, Ancient center, carries split between both back corners.",
      tips:
        "- Thornskin reflects assassin damage — position Elder where divers land.\n- Revive from Verdant 6 is a trap vs burst comps; stay at Verdant 4 and add Ironclad instead.",
    },
  },
  {
    title: "Arcane Burst Mage Combo",
    description:
      "SAMPLE lineup — Arcane Weavers shred magic resist while Cindralis' meteors delete grouped boards. One good cast wins the round.",
    author: "moonwarden",
    commander: "archmage-cindralis",
    commanderSkillName: "Meteor Cascade",
    difficulty: "intermediate",
    tags: ["mage", "arcane-weavers", "aoe"],
    daysAgo: 3,
    heroes: [
      { hero: "leviathan-prime", row: 0, col: 3, equipment: ["aegis-plate"], note: "Groups enemies with CC." },
      { hero: "forge-sentinel", row: 0, col: 2 },
      { hero: "cinder-imp", row: 1, col: 3 },
      { hero: "coral-oracle", row: 2, col: 2, equipment: ["chrono-pendant"] },
      { hero: "static-sprite", row: 2, col: 4 },
      { hero: "pyrelord-vashka", row: 2, col: 3, equipment: ["void-scepter", "ember-grimoire"], note: "Main caster." },
      { hero: "verdant-ancient", row: 2, col: 5 },
    ],
    strategy: {
      earlyGame:
        "Cinder Imp + Static Sprite carry you surprisingly far. Stack mana items on whoever casts most.",
      midGame:
        "Arcane Weavers 4 (-20% MR) turns Vashka's AoE into a board-wipe. Cast Meteor Cascade when Leviathan has grouped 4+ enemies.",
      lateGame:
        "Verdant Ancient gives the mana regen to double-cast Vashka in long fights.",
      economy:
        "Save-past-50 style. You need Void Scepter more than you need stars.",
      leveling:
        "Level 7 by round 12, then decide: roll for Vashka 2-star or push level 8 for Ancient.",
      positioning:
        "Leviathan dead center-front. Casters form a diamond behind him so meteors hit the same cluster your CC creates.",
      tips:
        "- Meteor Cascade targets the densest enemy cluster — bait with Leviathan's pull.\n- Against assassin comps, corner both casters and put Thornmail on Sentinel.",
    },
  },
  {
    title: "Ironclad Fortress Defense",
    description:
      "SAMPLE lineup — six shielded units that simply refuse to die. Aurelion's Judgment scales with all the damage your shields absorb.",
    author: "oakheart",
    commander: "high-templar-aurelion",
    commanderSkillName: "Judgment of Light",
    difficulty: "beginner",
    tags: ["ironclad-legion", "defense", "beginner-friendly"],
    daysAgo: 11,
    heroes: [
      { hero: "oakshield-elder", row: 0, col: 2, equipment: ["aegis-plate"] },
      { hero: "stormforged-colossus", row: 0, col: 3, equipment: ["guardians-bulwark"], note: "Best Ironclad unit." },
      { hero: "sapling-guard", row: 0, col: 4 },
      { hero: "forge-sentinel", row: 1, col: 3, equipment: ["thornmail-vest"] },
      { hero: "mist-warden", row: 2, col: 3 },
      { hero: "gloom-stalker", row: 2, col: 2, equipment: ["hunters-bow"] },
      { hero: "thunderhawk", row: 2, col: 4, equipment: ["stormpiercer-lance"], note: "Carry." },
    ],
    strategy: {
      earlyGame:
        "Any two Ironclad units give a free shield. Play whatever else you hit — defense first, damage later.",
      midGame:
        "Ironclad 4 = 250-point team-wide shields. Most comps can't break through before Thunderhawk picks them off.",
      lateGame:
        "Stormforged Colossus 2-star + Aegis Plate is the wall. Judgment of Light detonates for huge damage in long rounds.",
      economy:
        "Very forgiving econ. Hold pairs, don't force rolls before round 13.",
      leveling:
        "Level on curve. This comp punishes greedy players who skip defense.",
      positioning:
        "Three tanks spread across the front, Sentinel as second wave, carries protected center-back.",
      tips:
        "- Shields refresh with Ironclad 6 — worth it in slow lobbies.\n- Judgment counts absorbed damage: the longer the fight, the bigger the boom.",
    },
  },
  {
    title: "Storm Callers Tempo Blitz",
    description:
      "SAMPLE lineup — Blitz-mode storm tempo. Chain lightning every fourth attack means your whole board contributes damage constantly.",
    author: "tactifox",
    commander: "warlord-kazrak",
    commanderSkillName: "Bloodrage",
    difficulty: "advanced",
    tags: ["storm-callers", "tempo", "blitz"],
    daysAgo: 6,
    heroes: [
      { hero: "stormforged-colossus", row: 0, col: 2, equipment: ["aegis-plate"] },
      { hero: "leviathan-prime", row: 0, col: 3 },
      { hero: "tidecaller-nix", row: 1, col: 2 },
      { hero: "static-sprite", row: 1, col: 4 },
      { hero: "thunderhawk", row: 2, col: 3, equipment: ["stormpiercer-lance", "swift-boots"], note: "Carry." },
      { hero: "tempest-sovereign", row: 2, col: 4, equipment: ["hunters-bow"] },
    ],
    strategy: {
      earlyGame:
        "In Blitz you see fewer shops — take Storm units on sight and play strongest board.",
      midGame:
        "Storm Callers 4 by round 8 or pivot. Every fourth attack chaining to 2 extra enemies adds silent DPS everywhere.",
      lateGame:
        "Tempest Sovereign + Thunderhawk double-carry. Chains + stuns lock boards down completely.",
      economy:
        "Blitz econ is tight: keep ~15 gold banked, spend the rest on tempo.",
      leveling:
        "Level aggressively — tempo comps die to levels, not stars.",
      positioning:
        "Colossus + Leviathan split fronts. Carries diagonal from each other so AoE can't hit both.",
      tips:
        "- Bloodrage procs constantly in Blitz's faster fights.\n- Chains stun at Storm 6 — worth sacrificing a carry item slot for Chrono Pendant on Sovereign.",
    },
  },
  {
    title: "Beast Kin Enrage Brawl",
    description:
      "SAMPLE lineup — Beast Kin units get scarier as they take damage. Pair with Kazrak and watch wounded beasts carry fights alone.",
    author: "shadowstep",
    commander: "warlord-kazrak",
    commanderSkillName: "Earthshatter",
    difficulty: "intermediate",
    tags: ["beast-kin", "brawl", "scaling"],
    daysAgo: 14,
    heroes: [
      { hero: "magma-brute", row: 0, col: 2, equipment: ["bloodfang-blade"], note: "Enrage abuser." },
      { hero: "worldflame-dragon", row: 0, col: 3, equipment: ["void-scepter"], note: "Win condition." },
      { hero: "abyssal-titan", row: 0, col: 4 },
      { hero: "dusk-rat", row: 1, col: 1 },
      { hero: "gloom-stalker", row: 1, col: 5 },
      { hero: "thunderhawk", row: 2, col: 3, equipment: ["hunters-bow"] },
      { hero: "nightshade-queen", row: 1, col: 6 },
    ],
    strategy: {
      earlyGame:
        "Dusk Rat + Gloom Stalker are your cheap Beast core. Don't itemize them — they're placeholders.",
      midGame:
        "Beast Kin 4 around round 10. Magma Brute below 60% HP with Bloodfang is a monster — protect his approach, not his HP bar.",
      lateGame:
        "Worldflame Dragon counts as Beast: Emberbound 2 + Beast 4 is your end-state power spike.",
      economy:
        "Roll at 7 for Brute 2-star, then econ again. Stars on brutes > levels here.",
      leveling:
        "Skip fast-leveling. Your power spikes are 3-star Magma Brute and finding the Dragon.",
      positioning:
        "Full brawl box: three front, three mid-flanks, Queen back-center for cleanup.",
      tips:
        "- Lifesteal from Beast 4 means Brute heals *while enraged* — he doesn't need a healer.\n- Earthshatter after the enemy engages your beasts = maximum enrage uptime during the stun.",
    },
  },
];

const commentSeeds: Array<{
  lineupTitle: string;
  author: string;
  content: string;
  replies?: Array<{ author: string; content: string }>;
}> = [
  {
    lineupTitle: "Ember Rush Aggro",
    author: "moonwarden",
    content: "Tried this in my lobby and went 2nd. The Dragon really is the whole plan huh",
    replies: [
      { author: "tactifox", content: "Dragon is love, dragon is life. Glad it worked!" },
    ],
  },
  {
    lineupTitle: "Ember Rush Aggro",
    author: "oakheart",
    content: "What do you do when two other players contest Emberbound?",
    replies: [
      {
        author: "tactifox",
        content: "Pivot to Beast Kin brawl — half the units overlap early anyway.",
      },
    ],
  },
  {
    lineupTitle: "Shadow Assassins Backline Dive",
    author: "tactifox",
    content: "Got deleted by this yesterday. Can confirm it works. Reportingly fun though",
    replies: [],
  },
  {
    lineupTitle: "Tidal Control Sustain",
    author: "shadowstep",
    content: "Assassin player here: this comp made me sad. 10/10 would lose again",
    replies: [{ author: "moonwarden", content: "That's the plan 😌" }],
  },
  {
    lineupTitle: "Ironclad Fortress Defense",
    author: "moonwarden",
    content: "Great write-up for beginners. The Judgment timing tip is underrated.",
    replies: [],
  },
];

async function main() {
  await connectDatabase();
  console.log("Seeding database with SAMPLE data...");

  await Promise.all([
    User.deleteMany({}),
    Season.deleteMany({}),
    GameMode.deleteMany({}),
    Commander.deleteMany({}),
    Hero.deleteMany({}),
    Synergy.deleteMany({}),
    Equipment.deleteMany({}),
    GoGoCard.deleteMany({}),
    Lineup.deleteMany({}),
    Comment.deleteMany({}),
    Rating.deleteMany({}),
    Like.deleteMany({}),
    SavedLineup.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash("password123", 12);
  const users = await User.insertMany(
    seedUsers.map((u) => ({ ...u, passwordHash })),
  );
  const userByName = new Map(users.map((u) => [u.username, u]));
  console.log(`  users: ${users.length}`);

  const season = await Season.create(seedSeason);
  const gameModes = await GameMode.insertMany(seedGameModes);
  const classicMode = gameModes.find((m) => m.slug === "classic")!;
  const blitzMode = gameModes.find((m) => m.slug === "blitz")!;

  const synergies = await Synergy.insertMany(seedSynergies);
  const synergyByName = new Map(synergies.map((s) => [s.slug, s]));

  const commanders = await Commander.insertMany(seedCommanders);
  const commanderBySlug = new Map(commanders.map((c) => [c.slug, c]));

  const heroes = await Hero.insertMany(
    seedHeroes.map((h) => ({
      ...h,
      synergies: h.synergies
        .map((slug) => synergyByName.get(slug)?._id)
        .filter(Boolean),
    })),
  );
  const heroBySlug = new Map(heroes.map((h) => [h.slug, h]));

  const equipment = await Equipment.insertMany(seedEquipment);
  const equipByName = new Map(equipment.map((e) => [e.slug, e]));

  const gogoCards = await GoGoCard.insertMany(seedGogoCards);
  console.log(`  gogo cards: ${gogoCards.length}`);

  const now = Date.now();
  const lineups = [];

  for (const spec of lineupSpecs) {
    const commander = commanderBySlug.get(spec.commander)!;
    const createdAt = new Date(now - spec.daysAgo * 24 * 60 * 60 * 1000);

    const synergyCounts = new Map<string, number>();
    for (const h of spec.heroes) {
      const hero = heroBySlug.get(h.hero)!;
      for (const synId of hero.synergies) {
        const slug = synergies.find((s) => String(s._id) === String(synId))!.slug;
        synergyCounts.set(slug, (synergyCounts.get(slug) ?? 0) + 1);
      }
    }

    const lineup = await Lineup.create({
      title: spec.title,
      slug: spec.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
      description: spec.description,
      author: userByName.get(spec.author)!._id,
      season: season._id,
      gameMode: spec.tags.includes("blitz") ? blitzMode : classicMode,
      difficulty: spec.difficulty,
      commander: commander._id,
      commanderSkill: {
        name: spec.commanderSkillName,
        description: "",
      },
      heroes: spec.heroes.map((h) => ({
        hero: heroBySlug.get(h.hero)!._id,
        position: { row: h.row, col: h.col },
        equipment: (h.equipment ?? [])
          .map((slug) => equipByName.get(slug)?._id)
          .filter(Boolean),
        note: h.note,
      })),
      synergies: [...synergyCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([slug, count]) => ({
          synergy: synergyByName.get(slug)!._id,
          count,
        })),
      strategy: spec.strategy,
      tags: spec.tags,
      status: "published",
      featured: spec.featured ?? false,
      viewsCount: Math.floor(Math.random() * 900) + 100,
      createdAt,
      updatedAt: createdAt,
    });
    lineups.push(lineup);
  }
  console.log(`  lineups: ${lineups.length}`);

  const usernames = users.map((u) => u.username);

  for (let i = 0; i < lineups.length; i++) {
    const lineup = lineups[i];
    for (let j = 0; j < usernames.length; j++) {
      if ((i + j) % 3 !== 0 && j % 2 === 0) continue;
      await Like.create({
        lineup: lineup._id,
        user: userByName.get(usernames[j])!._id,
      });
    }
    for (let j = 0; j < usernames.length; j++) {
      if ((i * 2 + j) % 4 === 0) continue;
      await SavedLineup.create({
        lineup: lineup._id,
        user: userByName.get(usernames[j])!._id,
      });
    }
  }

  for (const cs of commentSeeds) {
    const lineup = lineups.find((l) => l.title === cs.lineupTitle);
    if (!lineup) continue;
    const parent = await Comment.create({
      lineup: lineup._id,
      author: userByName.get(cs.author)!._id,
      content: cs.content,
    });
    for (const reply of cs.replies ?? []) {
      await Comment.create({
        lineup: lineup._id,
        author: userByName.get(reply.author)!._id,
        content: reply.content,
        parentComment: parent._id,
      });
    }
  }

  const ratingPool = [5, 4, 5, 3, 4, 5, 4, 2, 5, 4, 3, 5];
  let ratingIdx = 0;
  for (const lineup of lineups) {
    for (const username of usernames) {
      ratingIdx++;
      if ((ratingIdx + lineup.title.length) % 5 === 0) continue;
      await Rating.create({
        lineup: lineup._id,
        user: userByName.get(username)!._id,
        rating: ratingPool[ratingIdx % ratingPool.length],
      });
    }
  }

  for (const lineup of lineups) {
    const ratings = await Rating.find({ lineup: lineup._id });
    const total = ratings.length;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of ratings) {
      distribution[r.rating] = (distribution[r.rating] ?? 0) + 1;
    }
    lineup.ratingsCount = total;
    lineup.averageRating = total ? Math.round((sum / total) * 10) / 10 : 0;
    lineup.ratingDistribution = distribution;
    lineup.likesCount = await Like.countDocuments({ lineup: lineup._id });
    lineup.savesCount = await SavedLineup.countDocuments({
      lineup: lineup._id,
    });
    lineup.commentsCount = await Comment.countDocuments({
      lineup: lineup._id,
    });
    await lineup.save();
  }

  const followPairs: Array<[string, string]> = [
    ["moonwarden", "tactifox"],
    ["oakheart", "tactifox"],
    ["shadowstep", "moonwarden"],
    ["tactifox", "shadowstep"],
    ["gogoadmin", "moonwarden"],
  ];
  for (const [follower, followee] of followPairs) {
    await User.updateOne(
      { username: follower },
      { $addToSet: { following: userByName.get(followee)!._id } },
    );
    await User.updateOne(
      { username: followee },
      { $addToSet: { followers: userByName.get(follower)!._id } },
    );
  }

  console.log("Seed complete.");
  console.log("  Sample logins (password: password123):");
  console.log("    admin@gogotactics.dev / gogoadmin");
  console.log("    fox@gogotactics.dev   / tactifox");

  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDatabase();
  process.exit(1);
});
