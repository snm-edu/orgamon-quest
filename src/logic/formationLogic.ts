import type { BattleStats, Companion, Hero } from "../types";
import { applyStatBonus, getTitleBonus } from "./titleLogic";

/**
 * レベルに応じたステータスボーナスを計算する
 * レベル1を基準に、レベルが上がるごとにATK+2, DEF+1.5, SPD+1
 */
export function getLevelStatBonus(level: number): BattleStats {
  const lvl = Math.max(1, level) - 1; // レベル1では0ボーナス
  return {
    atk: Math.floor(lvl * 2),
    def: Math.floor(lvl * 1.5),
    spd: Math.floor(lvl * 1),
  };
}

function applyLevelBonus(stats: BattleStats, level: number): BattleStats {
  const bonus = getLevelStatBonus(level);
  return {
    atk: (stats.atk || 10) + bonus.atk,
    def: (stats.def || 10) + bonus.def,
    spd: (stats.spd || 12) + bonus.spd,
  };
}

type PositionModifier = {
  atkMultiplier: number;
  defMultiplier: number;
  spdMultiplier: number;
};

export const MAX_FORMATION_SIZE = 3;

export const POSITION_LABELS = ["1番手", "2番手", "3番手"] as const;

const POSITION_MODIFIERS: PositionModifier[] = [
  { atkMultiplier: 1.2, defMultiplier: 0.9, spdMultiplier: 1.05 },
  { atkMultiplier: 1.0, defMultiplier: 1.05, spdMultiplier: 1.0 },
  { atkMultiplier: 0.9, defMultiplier: 1.2, spdMultiplier: 0.95 },
];

export const POSITION_EFFECT_LABELS = POSITION_MODIFIERS.map(
  (modifier) =>
    `ATK x${modifier.atkMultiplier.toFixed(2)} / DEF x${modifier.defMultiplier.toFixed(2)} / SPD x${modifier.spdMultiplier.toFixed(2)}`
);

export type FormationMember = {
  id: string;
  name: string;
  role: "hero" | "companion";
  slot: number;
  baseStats: BattleStats;
  effectiveStats: BattleStats;
  companionType?: Companion["type"];
};

function applyPositionModifier(stats: BattleStats, slot: number): BattleStats {
  const modifier = POSITION_MODIFIERS[Math.min(slot, POSITION_MODIFIERS.length - 1)];
  return {
    atk: Math.max(1, Math.round(stats.atk * modifier.atkMultiplier)),
    def: Math.max(1, Math.round(stats.def * modifier.defMultiplier)),
    spd: Math.max(1, Math.round(stats.spd * modifier.spdMultiplier)),
  };
}

export function normalizeBattleFormationIds(
  heroId: string,
  companions: Companion[],
  battleFormationIds?: string[]
): string[] {
  const availableIds = [heroId, ...companions.slice(0, 2).map((member) => member.id)];
  const availableIdSet = new Set(availableIds);
  const normalized: string[] = [];

  (battleFormationIds || []).forEach((id) => {
    if (!availableIdSet.has(id)) return;
    if (normalized.includes(id)) return;
    normalized.push(id);
  });

  availableIds.forEach((id) => {
    if (!normalized.includes(id)) normalized.push(id);
  });

  return normalized.slice(0, Math.min(MAX_FORMATION_SIZE, availableIds.length));
}

export function buildFormation(
  hero: Hero,
  companions: Companion[],
  activeTitle: string,
  battleFormationIds?: string[],
  playerLevel: number = 1,
  playerName?: string
): FormationMember[] {
  const titleBonus = getTitleBonus(activeTitle);
  const heroWithTitle = applyStatBonus(hero.baseStats, titleBonus);
  // レベルボーナスをヒーローに適用
  const heroWithLevel = applyLevelBonus(heroWithTitle, playerLevel);

  const memberById = new Map<
    string,
    Omit<FormationMember, "slot" | "effectiveStats">
  >();

  memberById.set(hero.id, {
    id: hero.id,
    name: playerName || hero.name,
    role: "hero",
    baseStats: heroWithLevel,
  });

  companions.slice(0, 2).forEach((member) => {
    const memberSpeed = typeof member.baseStats.spd === "number" ? member.baseStats.spd : 12;
    const normalizedStats = { atk: member.baseStats.atk, def: member.baseStats.def, spd: memberSpeed };
    // 仲間キャラのレベル（未設定時は1として扱う）に基づいてステータス増強
    const leveledStats = applyLevelBonus(normalizedStats, member.level || 1);
    memberById.set(member.id, {
      id: member.id,
      name: member.name,
      role: "companion",
      baseStats: leveledStats,
      companionType: member.type,
    });
  });

  const formationIds = normalizeBattleFormationIds(hero.id, companions, battleFormationIds);
  const party: FormationMember[] = [];

  formationIds.forEach((id, slot) => {
    const baseMember = memberById.get(id);
    if (!baseMember) return;
    party.push({
      ...baseMember,
      slot,
      effectiveStats: applyPositionModifier(baseMember.baseStats, slot),
    });
  });

  return party;
}

export function buildSpeedTurnQueue(party: FormationMember[], turns: number): string[] {
  if (party.length === 0 || turns <= 0) return [];

  const timeline = party.map((member) => ({
    id: member.id,
    slot: member.slot,
    speed: Math.max(1, member.effectiveStats.spd),
    nextTick: 100 / Math.max(1, member.effectiveStats.spd),
  }));

  const queue: string[] = [];

  for (let turn = 0; turn < turns; turn++) {
    timeline.sort((a, b) => {
      if (a.nextTick === b.nextTick) return a.slot - b.slot;
      return a.nextTick - b.nextTick;
    });

    const actor = timeline[0];
    queue.push(actor.id);
    actor.nextTick += 100 / actor.speed;
  }

  return queue;
}

export function getPartyDefense(party: FormationMember[]): number {
  if (party.length === 0) return 0;
  const totalDefense = party.reduce((sum, member) => sum + member.effectiveStats.def, 0);
  return Math.round(totalDefense / party.length);
}
