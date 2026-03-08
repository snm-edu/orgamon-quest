import type { OwnedCard } from "../types";
import evolutionsData from "../data/evolutions.json";

type HeroEvoData = typeof evolutionsData.heroEvolution;

export function getCardEvolutionRequirements() {
  return evolutionsData.cardEvolution.requirements;
}

export function getCardAttackBonus(stage: number): number {
  const bonuses = evolutionsData.cardEvolution.attackPowerBonus;
  switch (stage) {
    case 0:
      return bonuses.stage0;
    case 1:
      return bonuses.stage1;
    case 2:
      return bonuses.stage2;
    case 3:
      return bonuses.stage3;
    default:
      return 0;
  }
}

export function getEvolutionMultiplier(stage: number): number {
  switch (stage) {
    case 0:
      return 1.0;
    case 1:
      return 1.2;
    case 2:
      return 1.5;
    case 3:
      return 2.0;
    default:
      return 1.0;
  }
}

export function getCardCountMultiplier(count: number): number {
  if (count >= 5) return 1.5;
  if (count === 4) return 1.3;
  if (count === 3) return 1.2;
  if (count === 2) return 1.1;
  return 1.0;
}

export function canEvolveCard(
  card: OwnedCard,
  playerLevel: number,
  playerMP: number,
  playerItems: Record<string, number>
): { canEvolve: boolean; reason?: string } {
  const reqs = evolutionsData.cardEvolution.requirements;

  if (card.stage >= 3) return { canEvolve: false, reason: "最大段階です" };

  let requirement: { level: number; items: string[]; mp: number };

  if (card.stage === 0) {
    requirement = reqs.stage0_to_1;
  } else if (card.stage === 1) {
    requirement = reqs.stage1_to_2;
  } else {
    requirement = reqs.stage2_to_3;
  }

  if (playerLevel < requirement.level)
    return { canEvolve: false, reason: `レベル${requirement.level}が必要` };

  if (playerMP < requirement.mp)
    return { canEvolve: false, reason: `${requirement.mp}MPが必要` };

  for (const itemId of requirement.items) {
    if (!playerItems[itemId] || playerItems[itemId] <= 0) {
      return { canEvolve: false, reason: `${itemId}が必要です` };
    }
  }

  return { canEvolve: true };
}

export function getEvolutionCost(
  stage: number
): { level: number; items: string[]; mp: number } {
  const reqs = evolutionsData.cardEvolution.requirements;
  if (stage === 0) return reqs.stage0_to_1;
  if (stage === 1) return reqs.stage1_to_2;
  return reqs.stage2_to_3;
}

export function getHeroEvolutionData(): HeroEvoData {
  return evolutionsData.heroEvolution;
}
