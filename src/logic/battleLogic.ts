import type { Boss, Card, OwnedCard, Debuff, Difficulty } from "../types";
import bossesData from "../data/bosses.json";
import { getEvolutionMultiplier, getCardAttackBonus, getCardCountMultiplier } from "./evolutionLogic";

const bosses = bossesData as Boss[];

export function getBossByChapter(chapter: number): Boss | undefined {
  return bosses.find((b) => b.chapter === chapter);
}

export function getAllBosses(): Boss[] {
  return bosses;
}

export function calcBossDamage(
  isCorrect: boolean,
  ownedCards: Record<string, OwnedCard>,
  allCards: Card[],
  comboBonus: number = 0,
  attackerAttack: number = 0,
  playerLevel: number = 1,
  equippedCardIds: string[] = []
): number {
  if (!isCorrect) return 0;

  let baseDamage = 10;

  if (equippedCardIds && equippedCardIds.length > 0) {
    baseDamage = 0;
    for (const cardId of equippedCardIds) {
      if (!cardId) continue;
      const cardData = allCards.find((c) => c.id === cardId);
      const owned = ownedCards[cardId];
      if (cardData && owned) {
        const base = cardData.attackPower + getCardAttackBonus(owned.stage);
        const stgm = getEvolutionMultiplier(owned.stage);
        const cntm = getCardCountMultiplier(owned.count);
        baseDamage += Math.round(base * stgm * cntm);
      }
    }
    // If somehow equipped cards had no effect yet, fallback
    if (baseDamage === 0) baseDamage = 10;
  } else {
    // Legacy fallback behavior
    let bestStage = 0;
    for (const [cardId, owned] of Object.entries(ownedCards)) {
      const cardData = allCards.find((c) => c.id === cardId);
      if (cardData) {
        const totalAtk = cardData.attackPower + getCardAttackBonus(owned.stage);
        if (totalAtk > baseDamage) {
          baseDamage = totalAtk;
          bestStage = owned.stage;
        }
      }
    }
    baseDamage = baseDamage * getEvolutionMultiplier(bestStage);
  }

  const attackerBonus = Math.round(Math.max(0, attackerAttack) * 0.65);
  // レベルスケーリング: レベル1でx1.0、レベル10でx1.45、レベル20でx1.95、レベル30+でx2.5+
  const levelMultiplier = 1.0 + (Math.max(1, playerLevel) - 1) * 0.05;
  return Math.floor((baseDamage + comboBonus + attackerBonus) * levelMultiplier);
}

export function getBossCounterAttack(
  boss: Boss,
  round: number,
  difficulty: Difficulty,
  partyDefense: number = 0
): { homeostasisDamage: number; debuffs: Debuff[]; isDeflected: boolean } {
  const baseDamage = 5 + Math.floor(boss.hp / 150);
  let damage = baseDamage;

  if (difficulty === "hard") damage = Math.floor(damage * 1.3);
  if (difficulty === "easy") damage = Math.floor(damage * 0.7);
  let isDeflected = false;
  if (partyDefense > 0) {
    const reductionRate = Math.min(0.5, partyDefense / 250);
    if (reductionRate >= 0.15) isDeflected = true;
    damage = Math.max(1, Math.floor(damage * (1 - reductionRate)));
  }

  const debuffs: Debuff[] = [];

  if (round % 3 === 0 || round >= 7) {
    const pattern = boss.debuffPattern;
    if (pattern.length > 0) {
      const pick = pattern[Math.floor(Math.random() * pattern.length)];
      debuffs.push({ ...pick });
    }
  }

  return { homeostasisDamage: damage, debuffs, isDeflected };
}

export function getInitialHomeostasis(difficulty: Difficulty): number {
  switch (difficulty) {
    case "easy":
      return 80;
    case "normal":
      return 60;
    case "hard":
      return 50;
    default:
      return 60;
  }
}

export function isBossDefeated(bossHp: number): boolean {
  return bossHp <= 0;
}

export function isBattleCleared(homeostasis: number): boolean {
  return homeostasis >= 70;
}

export const BATTLE_ROUNDS = 10;
