import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserCollection, UserCurrentRun, OwnedCard, Companion } from "../types";
import cardsData from "../data/cards.json";
import bossesData from "../data/bosses.json";
import heroesData from "../data/heroes.json";
import companionsData from "../data/companions.json";
import itemsData from "../data/items.json";

const COMPANION_LIMIT = 20;
const ITEM_LIMIT = 10;

const HIDDEN_PASSWORD = "ORGAMON-KISO-2026";

type CollectionStoreState = {
  collection: UserCollection;

  /** currentRun の成果を永続図鑑にマージ */
  mergeFromCurrentRun: (run: UserCurrentRun) => void;

  /** 図鑑コンプ率を再計算 */
  recalcCompletionRate: () => number;

  /** パスワード解除チェック */
  checkPasswordUnlock: () => boolean;

  /** 永続図鑑のカードを取得 */
  getCollectionCard: (cardId: string) => OwnedCard | undefined;

  /** 永続図鑑の仲間を取得 */
  getCollectionCompanions: () => Companion[];

  /** スペシャルゲーム用: collectionからカードを最大5枚選んで移設 */
  transferCards: (cardIds: string[]) => OwnedCard[];

  /** リセット（デバッグ用） */
  resetCollection: () => void;
};

const createInitialCollection = (): UserCollection => ({
  cards: {},
  companions: [],
  items: {},
  bosses: {},
  heroes: {},
  completionRate: 0,
  passwordUnlocked: false,
  password: undefined,
});

export const useCollectionStore = create<CollectionStoreState>()(
  persist(
    (set, get) => ({
      collection: createInitialCollection(),

      mergeFromCurrentRun: (run) => {
        const coll = { ...get().collection };

        // カードマージ（進化段階は高い方を採用、枚数は加算）
        for (const [cardId, card] of Object.entries(run.ownedCards)) {
          const existing = coll.cards[cardId];
          if (existing) {
            coll.cards[cardId] = {
              stage: Math.max(existing.stage, card.stage),
              count: existing.count + card.count,
              skin: card.skin !== "normal" ? card.skin : existing.skin,
            };
          } else {
            coll.cards[cardId] = { ...card };
          }
        }

        // 仲間マージ（上限20体。既存のものはレベル・進化の高い方を採用）
        const companionMap = new Map<string, Companion>();
        for (const comp of coll.companions) {
          companionMap.set(comp.id, comp);
        }
        for (const comp of run.ownedCompanions) {
          const existing = companionMap.get(comp.id);
          if (existing) {
            companionMap.set(comp.id, {
              ...comp,
              level: Math.max(existing.level, comp.level),
              exp: Math.max(existing.exp, comp.exp),
              evolutionStage: Math.max(existing.evolutionStage, comp.evolutionStage),
            });
          } else if (companionMap.size < COMPANION_LIMIT) {
            companionMap.set(comp.id, { ...comp });
          }
        }
        coll.companions = Array.from(companionMap.values());

        // アイテムマージ（各上限10個）
        for (const [itemId, count] of Object.entries(run.ownedItems)) {
          const existing = coll.items[itemId] || 0;
          coll.items[itemId] = Math.min(existing + count, ITEM_LIMIT);
        }

        // ボスマージ
        for (const [ch, progress] of Object.entries(run.chapterProgress)) {
          const chNum = Number(ch);
          const boss = bossesData.find((b) => b.chapter === chNum);
          if (boss && progress.bossDefeated) {
            const existing = coll.bosses[boss.id];
            coll.bosses[boss.id] = {
              defeated: true,
              bestTime: existing?.bestTime,
            };
          }
        }

        // ヒーローマージ
        const heroEntry = coll.heroes[run.selectedHeroId] || { used: false, maxStage: 0 };
        coll.heroes[run.selectedHeroId] = {
          used: true,
          maxStage: Math.max(heroEntry.maxStage, 1),
        };

        // コンプ率再計算
        coll.completionRate = calcCompletionRate(coll);

        // パスワード解除チェック
        if (coll.completionRate >= 100 && !coll.passwordUnlocked) {
          coll.passwordUnlocked = true;
          coll.password = HIDDEN_PASSWORD;
        }

        set({ collection: coll });
      },

      recalcCompletionRate: () => {
        const coll = get().collection;
        const rate = calcCompletionRate(coll);
        set({ collection: { ...coll, completionRate: rate } });
        return rate;
      },

      checkPasswordUnlock: () => {
        const coll = get().collection;
        if (coll.completionRate >= 100 && !coll.passwordUnlocked) {
          set({
            collection: {
              ...coll,
              passwordUnlocked: true,
              password: HIDDEN_PASSWORD,
            },
          });
          return true;
        }
        return coll.passwordUnlocked;
      },

      getCollectionCard: (cardId) => {
        return get().collection.cards[cardId];
      },

      getCollectionCompanions: () => {
        return get().collection.companions;
      },

      transferCards: (cardIds) => {
        const coll = get().collection;
        const limited = cardIds.slice(0, 5);
        const transferred: OwnedCard[] = [];

        for (const cardId of limited) {
          const card = coll.cards[cardId];
          if (card) {
            transferred.push({ ...card });
          }
        }

        return transferred;
      },

      resetCollection: () => set({ collection: createInitialCollection() }),
    }),
    { name: "orgamon-collection-store" }
  )
);

/** 全体コンプ率計算 */
function calcCompletionRate(coll: UserCollection): number {
  const totalCards = cardsData.length;
  const totalBosses = bossesData.length;
  const totalHeroes = heroesData.length;
  const totalCompanions = companionsData.length;
  const totalItems = itemsData.length;

  const collectedCards = Object.keys(coll.cards).length;
  const defeatedBosses = Object.values(coll.bosses).filter((b) => b.defeated).length;
  const usedHeroes = Object.values(coll.heroes).filter((h) => h.used).length;
  const collectedCompanions = coll.companions.length;
  const collectedItems = Object.keys(coll.items).length;

  // 加重平均: カード40%, ボス20%, ヒーロー15%, 仲間15%, アイテム10%
  const cardRate = totalCards > 0 ? collectedCards / totalCards : 0;
  const bossRate = totalBosses > 0 ? defeatedBosses / totalBosses : 0;
  const heroRate = totalHeroes > 0 ? usedHeroes / totalHeroes : 0;
  const companionRate = totalCompanions > 0 ? collectedCompanions / totalCompanions : 0;
  const itemRate = totalItems > 0 ? collectedItems / totalItems : 0;

  const weightedRate =
    cardRate * 0.4 +
    bossRate * 0.2 +
    heroRate * 0.15 +
    companionRate * 0.15 +
    itemRate * 0.1;

  return Math.round(weightedRate * 100);
}
