import type { TeamCombo, Companion, HeroId } from "../types";
import combosData from "../data/combos.json";

const combos = combosData as TeamCombo[];

export function getAllCombos(): TeamCombo[] {
  return combos;
}

export function checkTeamCombo(
  heroId: string,
  team: Companion[]
): TeamCombo | null {
  const teamHeroIds: string[] = [heroId, ...(team.map((c) => c.heroRef).filter(Boolean) as string[])];

  const prioritizedCombos = [...combos].sort(
    (a, b) => b.requiredHeroes.length - a.requiredHeroes.length
  );

  for (const combo of prioritizedCombos) {
    if (combo.id === "all_four") continue; // Exclude all_four from regular checks
    const allRequired = combo.requiredHeroes.every((id) =>
      teamHeroIds.includes(id)
    );
    if (allRequired) return combo;
  }

  return null;
}

export function checkAllFourPossible(
  heroId: string,
  team: Companion[],
  ownedCompanions: Companion[] = []
): boolean {
  const teamHeroIds: string[] = [heroId, ...(team.map((c) => c.heroRef).filter(Boolean) as string[])];
  if (teamHeroIds.length !== 3) return false;

  const ownedHeroRefs = ownedCompanions.map(c => c.heroRef).filter(Boolean);
  const allFour = ["minato", "hikari", "kotoha", "leon"];
  const missingHero = allFour.find(h => !teamHeroIds.includes(h));

  if (missingHero && ownedHeroRefs.includes(missingHero as HeroId)) {
    return true;
  }
  return false;
}

export function getComboBonus(combo: TeamCombo | null): number {
  if (!combo) return 0;

  let bonus = 0;
  for (const effect of combo.effects) {
    if (effect.type === "heal_homeostasis") bonus += effect.value;
  }
  return bonus;
}

export function applyComboEffects(
  combo: TeamCombo
): {
  healHomeostasis: number;
  reduceChoices: number;
  reduceCooldowns: number;
  blockMisinformation: boolean;
  xpBoost: number;
  showHint: boolean;
  timeExtend: number;
  masteryBoost: number;
  reducePenalty: number;
  safeNet: boolean;
} {
  const result = {
    healHomeostasis: 0,
    reduceChoices: 0,
    reduceCooldowns: 0,
    blockMisinformation: false,
    xpBoost: 0,
    showHint: false,
    timeExtend: 0,
    masteryBoost: 0,
    reducePenalty: 0,
    safeNet: false,
  };

  for (const effect of combo.effects) {
    switch (effect.type) {
      case "heal_homeostasis":
        result.healHomeostasis += effect.value;
        break;
      case "reduce_choices":
        result.reduceChoices += effect.value;
        break;
      case "reduce_cd":
        result.reduceCooldowns += effect.value;
        break;
      case "safe_net":
        if (effect.condition === "block_misinformation")
          result.blockMisinformation = true;
        else
          result.safeNet = true;
        break;
      case "xp_boost":
        result.xpBoost += effect.value;
        break;
      case "hint":
        result.showHint = true;
        break;
      case "time_extend":
        result.timeExtend += effect.value;
        break;
      case "mastery_boost":
        result.masteryBoost += effect.value;
        break;
      case "reduce_penalty":
        result.reducePenalty += effect.value;
        break;
    }
  }

  return result;
}
