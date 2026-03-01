import type { Card, CardRarity } from "../types";
import cardsData from "../data/cards.json";

const cards = cardsData as Card[];

const rarityWeights: Record<CardRarity, number> = {
  Common: 60,
  Rare: 25,
  Epic: 12,
  Legend: 3,
};

const levelRarityBonus: Record<CardRarity, number> = {
  Common: 0,
  Rare: 0.5,
  Epic: 0.3,
  Legend: 0.1,
};

export function getCardsByChapter(chapter: number): Card[] {
  return cards.filter((c) => c.chapter === chapter);
}

export function drawCardByChapterAndRarity(
  chapter: number,
  playerLevel: number
): Card | null {
  const pool = getCardsByChapter(chapter);
  if (pool.length === 0) return null;

  const rarity = rollRarity(playerLevel);
  const filtered = pool.filter((c) => c.rarity === rarity);

  if (filtered.length === 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  return filtered[Math.floor(Math.random() * filtered.length)];
}

function rollRarity(playerLevel: number): CardRarity {
  const bonus = Math.min(playerLevel * 0.5, 15);
  const weights = {
    Common: Math.max(rarityWeights.Common - bonus, 20),
    Rare: rarityWeights.Rare + bonus * levelRarityBonus.Rare,
    Epic: rarityWeights.Epic + bonus * levelRarityBonus.Epic,
    Legend: rarityWeights.Legend + bonus * levelRarityBonus.Legend,
  };

  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;

  for (const [rarity, weight] of Object.entries(weights)) {
    roll -= weight;
    if (roll <= 0) return rarity as CardRarity;
  }

  return "Common";
}

export function tryCapture(
  captureEnergy: number,
  chapter: number,
  playerLevel: number
): { capturedCards: Card[]; energySpent: number } {
  const capturedCards: Card[] = [];
  let energyRemaining = captureEnergy;

  while (energyRemaining >= 3) {
    energyRemaining -= 3;
    const card = drawCardByChapterAndRarity(chapter, playerLevel);
    if (card) capturedCards.push(card);
  }

  return {
    capturedCards,
    energySpent: captureEnergy - energyRemaining,
  };
}

export function getCardById(cardId: string): Card | undefined {
  return cards.find((c) => c.id === cardId);
}

export function getAllCards(): Card[] {
  return cards;
}
