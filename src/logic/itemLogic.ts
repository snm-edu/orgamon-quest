import type { Item } from "../types";
import itemsData from "../data/items.json";

const items = itemsData as Item[];

export function getItemById(id: string): Item | undefined {
  return items.find((i) => i.id === id);
}

export function getAllItems(): Item[] {
  return items;
}

const dropTable: { itemId: string; weight: number }[] = [
  { itemId: "wisdom_potion", weight: 30 },
  { itemId: "time_sand", weight: 15 },
  { itemId: "experience_book", weight: 10 },
  { itemId: "clear_mist", weight: 15 },
  { itemId: "bond_fragment", weight: 8 },
  { itemId: "evolution_stone", weight: 5 },
  { itemId: "lucky_clover", weight: 12 },
  { itemId: "skill_amplifier", weight: 8 },
  { itemId: "homeostasis_elixir", weight: 7 },
];

export function rollItemDrop(
  correctRate: number
): { itemId: string; item: Item } | null {
  const dropChance = 0.1 + correctRate * 0.4;
  if (Math.random() > dropChance) return null;

  const totalWeight = dropTable.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const entry of dropTable) {
    roll -= entry.weight;
    if (roll <= 0) {
      const item = getItemById(entry.itemId);
      if (item) return { itemId: entry.itemId, item };
      break;
    }
  }

  return null;
}

export function rollMultipleItemDrops(
  correctRate: number,
  maxDrops: number = 2
): { itemId: string; item: Item }[] {
  const drops: { itemId: string; item: Item }[] = [];
  for (let i = 0; i < maxDrops; i++) {
    const drop = rollItemDrop(correctRate);
    if (drop) drops.push(drop);
  }
  return drops;
}

export function getItemRarityColor(rarity: string): string {
  switch (rarity) {
    case "Common":
      return "#98d4bb";
    case "Rare":
      return "#b8a9c9";
    case "Epic":
      return "#f08080";
    default:
      return "#6b5b73";
  }
}
