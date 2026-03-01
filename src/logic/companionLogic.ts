import type { Companion, HeroId } from "../types";
import companionsData from "../data/companions.json";
import heroesData from "../data/heroes.json";
import evolutionsData from "../data/evolutions.json";
import type { Hero } from "../types";

const companions = companionsData as unknown as Companion[];
const heroes = heroesData as Hero[];

export function getAllCompanions(): Companion[] {
  return companions;
}

export function getCompanionById(id: string): Companion | undefined {
  return companions.find((c) => c.id === id);
}

export function createHeroCompanion(heroId: HeroId): Companion {
  const hero = heroes.find((h) => h.id === heroId);
  if (!hero) throw new Error(`Hero not found: ${heroId}`);

  return {
    id: `companion_${heroId}`,
    name: hero.name,
    heroRef: heroId,
    type: "hero",
    rarity: "Epic",
    level: 1,
    exp: 0,
    baseStats: { hp: 100, atk: hero.baseStats.atk, def: hero.baseStats.def, spd: hero.baseStats.spd },
    skills: [hero.skills[0]],
    evolutionLine: hero.evolutionLine,
    evolutionStage: 0,
  };
}

export function rollCompanionAppear(
  chapter: number,
  selectedHeroId: HeroId,
  ownedCompanionIds: string[]
): Companion | null {
  const baseRate = 0.15 + chapter * 0.03;

  if (Math.random() > baseRate) return null;

  const heroCompanionRate = 0.3;
  if (Math.random() < heroCompanionRate) {
    const availableHeroes = (["minato", "hikari", "kotoha", "leon"] as HeroId[])
      .filter((id) => id !== selectedHeroId)
      .filter((id) => !ownedCompanionIds.includes(`companion_${id}`));

    if (availableHeroes.length > 0) {
      const pickedHeroId =
        availableHeroes[Math.floor(Math.random() * availableHeroes.length)];
      return createHeroCompanion(pickedHeroId);
    }
  }

  const availableNPC = companions.filter(
    (c) => !ownedCompanionIds.includes(c.id)
  );

  if (availableNPC.length === 0) return null;

  return {
    ...availableNPC[Math.floor(Math.random() * availableNPC.length)],
    level: 1,
    exp: 0,
    evolutionStage: 0,
  };
}

export function addCompanionExp(
  companion: Companion,
  expGain: number
): Companion {
  const updated = { ...companion, exp: companion.exp + expGain };
  const newLevel = Math.floor(updated.exp / 100) + 1;
  if (newLevel > updated.level) {
    updated.level = Math.min(newLevel, 30);
  }
  return updated;
}

export function checkCompanionEvolution(companion: Companion): boolean {
  const reqs = evolutionsData.companionEvolution.requirements;
  const stage = companion.evolutionStage;

  if (stage >= 3) return false;

  if (stage === 0 && companion.exp >= reqs.stage0_to_1.exp) return true;
  if (stage === 1 && companion.exp >= reqs.stage1_to_2.exp) return true;
  if (stage === 2 && companion.exp >= reqs.stage2_to_3.exp) return true;

  return false;
}

export function evolveCompanion(companion: Companion): Companion {
  if (companion.evolutionStage >= 3) return companion;
  const bonus = evolutionsData.companionEvolution.statBonusPerStage;
  const speedBonus = 2;
  const currentSpeed = typeof companion.baseStats.spd === "number" ? companion.baseStats.spd : 12;
  return {
    ...companion,
    evolutionStage: companion.evolutionStage + 1,
    baseStats: {
      hp: companion.baseStats.hp + bonus.hp,
      atk: companion.baseStats.atk + bonus.atk,
      def: companion.baseStats.def + bonus.def,
      spd: currentSpeed + speedBonus,
    },
  };
}

export function getCompanionTypeName(type: string): string {
  switch (type) {
    case "nurse":
      return "ナースタイプ";
    case "researcher":
      return "リサーチャータイプ";
    case "guardian":
      return "ガーディアンタイプ";
    case "hero":
      return "主人公タイプ";
    default:
      return type;
  }
}
