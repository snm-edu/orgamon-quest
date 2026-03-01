import type { Skill, SkillEffect, Debuff, ActiveBuff, UserCurrentRun, QuizFormat } from "../types";
import heroesData from "../data/heroes.json";
import type { Hero } from "../types";

const heroes = heroesData as Hero[];
const DEFAULT_LEARN_COST_MP = 120;

function uniqueSkillIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

export function getSkillSetMax(hero: Hero): number {
  return Math.max(1, hero.skills.length);
}

export function getHeroById(heroId: string): Hero | undefined {
  return heroes.find((h) => h.id === heroId);
}

export function getHeroActiveSkillPool(hero: Hero): Skill[] {
  return [...hero.skills, ...(hero.learnableSkills || [])];
}

export function getHeroSkills(heroId: string): Skill[] {
  const hero = getHeroById(heroId);
  if (!hero) return [];
  return [...getHeroActiveSkillPool(hero), hero.ultimate];
}

export type HeroSkillLoadout = {
  skillSetMax: number;
  allActiveSkills: Skill[];
  learnedSkillIds: string[];
  equippedSkillIds: string[];
  learnedSkills: Skill[];
  equippedSkills: Skill[];
  unlearnedSkills: Skill[];
};

export function getHeroSkillLoadout(
  hero: Hero,
  currentRun?: Pick<UserCurrentRun, "learnedSkillIds" | "equippedSkillIds"> | null
): HeroSkillLoadout {
  const allActiveSkills = getHeroActiveSkillPool(hero);
  const skillSetMax = getSkillSetMax(hero);
  const skillsById = new Map(allActiveSkills.map((skill) => [skill.id, skill]));
  const allowedIds = new Set(allActiveSkills.map((skill) => skill.id));

  const starterSkillIds = uniqueSkillIds(hero.skills.map((skill) => skill.id));
  const persistedLearned = uniqueSkillIds(
    (currentRun?.learnedSkillIds || []).filter((id) => allowedIds.has(id))
  );
  const learnedSkillIds = uniqueSkillIds([...starterSkillIds, ...persistedLearned]);
  const learnedSet = new Set(learnedSkillIds);

  const persistedEquipped = uniqueSkillIds(
    (currentRun?.equippedSkillIds || []).filter((id) => learnedSet.has(id))
  );
  let equippedSkillIds = persistedEquipped.slice(0, skillSetMax);

  if (equippedSkillIds.length === 0) {
    equippedSkillIds = starterSkillIds.slice(0, skillSetMax);
  }

  for (const starterId of starterSkillIds) {
    if (equippedSkillIds.length >= skillSetMax) break;
    if (!equippedSkillIds.includes(starterId)) equippedSkillIds.push(starterId);
  }

  for (const learnedId of learnedSkillIds) {
    if (equippedSkillIds.length >= skillSetMax) break;
    if (!equippedSkillIds.includes(learnedId)) equippedSkillIds.push(learnedId);
  }

  const learnedSkills = learnedSkillIds
    .map((id) => skillsById.get(id))
    .filter((skill): skill is Skill => Boolean(skill));
  const equippedSkills = equippedSkillIds
    .map((id) => skillsById.get(id))
    .filter((skill): skill is Skill => Boolean(skill));
  const unlearnedSkills = allActiveSkills.filter((skill) => !learnedSet.has(skill.id));

  return {
    skillSetMax,
    allActiveSkills,
    learnedSkillIds,
    equippedSkillIds,
    learnedSkills,
    equippedSkills,
    unlearnedSkills,
  };
}

export function getSkillLearnCostMp(skill: Skill): number {
  return Math.max(1, skill.learnCostMp ?? DEFAULT_LEARN_COST_MP);
}

export function canUseSkill(
  skillId: string,
  cooldowns: Record<string, number>,
  ultimateCharge: number,
  skill: Skill
): boolean {
  if (cooldowns[skillId] && cooldowns[skillId] > 0) return false;
  if (skill.type === "ultimate" && skill.chargeRequired && ultimateCharge < skill.chargeRequired) {
    return false;
  }
  return true;
}

function isQuizSingleChoiceFormat(format: QuizFormat): boolean {
  return format === "multiple_choice" || format === "speed" || format === "true_false";
}

function hasAnyActiveCooldown(cooldowns: Record<string, number>): boolean {
  return Object.values(cooldowns).some((value) => value > 0);
}

export type QuizSkillContext = {
  format: QuizFormat;
  choiceCount: number;
  debuffs: Debuff[];
  hasKeyword: boolean;
  hintVisible: boolean;
  safeNetActive: boolean;
  cooldowns: Record<string, number>;
};

export type SkillAvailability = {
  usable: boolean;
  reason?: string;
};

export function hasApplicableEffectInQuiz(skill: Skill, context: QuizSkillContext): boolean {
  return skill.effects.some((effect) => {
    switch (effect.type) {
      case "hint":
        return context.hasKeyword && !context.hintVisible;
      case "reduce_choices":
        return isQuizSingleChoiceFormat(context.format) && context.choiceCount > 2;
      case "cleanse_debuff":
        if (effect.condition) {
          return context.debuffs.some((debuff) => debuff.type === effect.condition);
        }
        return context.debuffs.length > 0;
      case "safe_net":
        return !context.safeNetActive;
      case "reduce_cd":
        return hasAnyActiveCooldown(context.cooldowns);
      default:
        return false;
    }
  });
}

export function getQuizSkillAvailability(
  skillId: string,
  cooldowns: Record<string, number>,
  ultimateCharge: number,
  skill: Skill,
  context: QuizSkillContext
): SkillAvailability {
  const cooldown = cooldowns[skillId] || 0;
  if (cooldown > 0) {
    return { usable: false, reason: `CD中 (${cooldown})` };
  }

  if (skill.type === "ultimate" && skill.chargeRequired && ultimateCharge < skill.chargeRequired) {
    return { usable: false, reason: `チャージ不足 (${ultimateCharge}/${skill.chargeRequired})` };
  }

  if (!hasApplicableEffectInQuiz(skill, context)) {
    return { usable: false, reason: "この問題では効果なし" };
  }

  return { usable: true };
}

export type SkillApplicationResult = {
  healHomeostasis: number;
  cleansedDebuffs: string[];
  reducedChoicesBy: number;
  showHint: boolean;
  safeNet: boolean;
  timeExtend: number;
  xpBoost: number;
  reducedCooldowns: number;
  autoHighlightTurns: number;
  accuracyBuff: number;
  accuracyBuffTurns: number;
  showRelated: boolean;
  masteryBoost: number;
  hotHeal: { amount: number; turns: number } | null;
  showGraph: boolean;
  skillPowerUp: number;
  reducePenalty: number;
  newBuffs: ActiveBuff[];
};

export function applySkillEffects(
  effects: SkillEffect[],
  currentDebuffs: Debuff[]
): SkillApplicationResult {
  const result: SkillApplicationResult = {
    healHomeostasis: 0,
    cleansedDebuffs: [],
    reducedChoicesBy: 0,
    showHint: false,
    safeNet: false,
    timeExtend: 0,
    xpBoost: 0,
    reducedCooldowns: 0,
    autoHighlightTurns: 0,
    accuracyBuff: 0,
    accuracyBuffTurns: 0,
    showRelated: false,
    masteryBoost: 0,
    hotHeal: null,
    showGraph: false,
    skillPowerUp: 0,
    reducePenalty: 0,
    newBuffs: [],
  };

  for (const effect of effects) {
    switch (effect.type) {
      case "hint":
        result.showHint = true;
        break;
      case "reduce_choices":
        result.reducedChoicesBy += effect.value;
        break;
      case "heal_homeostasis":
        result.healHomeostasis += effect.value;
        break;
      case "cleanse_debuff":
        if (effect.condition) {
          const found = currentDebuffs.find((d) => d.type === effect.condition);
          if (found) result.cleansedDebuffs.push(effect.condition);
        } else {
          if (currentDebuffs.length > 0) {
            result.cleansedDebuffs.push(currentDebuffs[0].type);
          }
        }
        break;
      case "reduce_penalty":
        result.reducePenalty += effect.value;
        break;
      case "time_extend":
        result.timeExtend += effect.value;
        break;
      case "xp_boost":
        result.xpBoost += effect.value;
        break;
      case "reduce_cd":
        result.reducedCooldowns += effect.value;
        break;
      case "safe_net":
        result.safeNet = true;
        break;
      case "auto_highlight":
        result.autoHighlightTurns += effect.duration || effect.value;
        break;
      case "buff_accuracy":
        result.accuracyBuff = effect.value;
        result.accuracyBuffTurns = effect.duration || 2;
        break;
      case "show_related":
        result.showRelated = true;
        break;
      case "mastery_boost":
        result.masteryBoost += effect.value;
        break;
      case "hot_heal":
        result.hotHeal = {
          amount: effect.value,
          turns: effect.duration || 3,
        };
        result.newBuffs.push({
          type: "hot_heal",
          value: effect.value,
          turnsRemaining: effect.duration || 3,
        });
        break;
      case "show_graph":
        result.showGraph = true;
        break;
      case "skill_power_up":
        result.skillPowerUp += effect.value;
        break;
    }
  }

  return result;
}
