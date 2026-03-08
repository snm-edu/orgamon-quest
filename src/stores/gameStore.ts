import { create } from "zustand";
import { persist } from "zustand/middleware";
import heroesData from "../data/heroes.json";
import companionsData from "../data/companions.json";
import { getHeroSkillLoadout } from "../logic/skillLogic";
import { normalizeBattleFormationIds } from "../logic/formationLogic";
import type {
  GameScreen,
  HeroId,
  UserCurrentRun,
  Debuff,
  Companion,
  ChapterProgress,
  OwnedCard,
  ActiveBuff,
  Difficulty,
  Hero,
} from "../types";

type GameState = {
  screen: GameScreen;
  currentRun: UserCurrentRun | null;
  pendingHeroId: HeroId | null;
  difficulty: Difficulty;
  isNewGame: boolean;

  // Navigation
  setScreen: (screen: GameScreen) => void;
  setPendingHeroId: (heroId: HeroId | null) => void;

  // Game init
  startNewGame: (heroId: HeroId, playerName: string) => void;
  resetRun: () => void;

  // XP & Level
  addXP: (amount: number) => void;
  addMP: (amount: number) => void;
  spendMP: (amount: number) => boolean;

  // Homeostasis
  setHomeostasis: (value: number) => void;
  addHomeostasis: (amount: number) => void;

  // Debuffs
  addDebuff: (debuff: Debuff) => void;
  removeDebuff: (type: string) => void;
  clearAllDebuffs: () => void;
  tickDebuffs: () => void;

  // Buffs
  addBuff: (buff: ActiveBuff) => void;
  tickBuffs: () => void;

  // Skills
  useSkill: (skillId: string, cooldown: number) => void;
  tickCooldowns: () => void;
  addUltimateCharge: (amount: number) => void;
  resetUltimateCharge: () => void;
  learnHeroSkill: (skillId: string, mpCost: number) => boolean;
  equipHeroSkill: (skillId: string, slotIndex: number) => boolean;

  // Chapters
  unlockChapter: (chapter: number) => void;
  updateChapterMastery: (
    chapter: number,
    update: Partial<ChapterProgress>
  ) => void;
  defeatBoss: (chapter: number) => void;

  // Cards
  addCard: (cardId: string, card?: OwnedCard) => void;
  updateCard: (cardId: string, card: OwnedCard) => void;
  evolveCard: (cardId: string) => void;
  setEquippedCards: (cardIds: string[]) => void;

  // Items
  addItem: (itemId: string, count?: number) => void;
  removeItem: (itemId: string, count?: number) => void;
  useItemOutsideBattle: (itemId: string, targetId?: string) => void;

  // Fragments & Energy
  addFragments: (count: number) => void;
  addCaptureEnergy: (count: number) => void;
  spendCaptureEnergy: (cost: number) => void;
  spendFragments: (cost: number) => boolean;

  // Streak
  incrementStreak: () => void;
  resetStreak: () => void;

  // Wrong answers
  addWrongAnswer: (questionId: string) => void;

  // Team
  addCompanion: (companion: Companion) => void;
  removeCompanion: (companionId: string) => void;
  updateCompanion: (companion: Companion) => void;
  setTeam: (team: Companion[]) => void;
  setBattleFormation: (battleFormationIds: string[]) => void;

  // Difficulty
  setDifficulty: (d: Difficulty) => void;
};

const heroes = heroesData as Hero[];

function getInitialSkillState(heroId: HeroId): { learnedSkillIds: string[]; equippedSkillIds: string[] } {
  const hero = heroes.find((candidate) => candidate.id === heroId);
  if (!hero) return { learnedSkillIds: [], equippedSkillIds: [] };
  const loadout = getHeroSkillLoadout(hero, null);
  return {
    learnedSkillIds: loadout.learnedSkillIds,
    equippedSkillIds: loadout.equippedSkillIds,
  };
}

const createInitialRun = (heroId: HeroId, playerName: string): UserCurrentRun => ({
  ...getInitialSkillState(heroId),
  selectedHeroId: heroId,
  playerName,
  team: [],
  heroEvolutionLevel: 0,
  battleFormationIds: [heroId],
  level: 1,
  totalXP: 0,
  mp: 0,
  homeostasis: 60,
  debuffs: [],
  skillCooldowns: {},
  ultimateCharge: 0,
  chapterProgress: {
    1: { unlocked: true, mastery: 0, bossDefeated: false, miniQuizBest: 0, confirmQuizBest: 0, reviewCount: 0 },
    2: { unlocked: false, mastery: 0, bossDefeated: false, miniQuizBest: 0, confirmQuizBest: 0, reviewCount: 0 },
    3: { unlocked: false, mastery: 0, bossDefeated: false, miniQuizBest: 0, confirmQuizBest: 0, reviewCount: 0 },
    4: { unlocked: false, mastery: 0, bossDefeated: false, miniQuizBest: 0, confirmQuizBest: 0, reviewCount: 0 },
    5: { unlocked: false, mastery: 0, bossDefeated: false, miniQuizBest: 0, confirmQuizBest: 0, reviewCount: 0 },
    6: { unlocked: false, mastery: 0, bossDefeated: false, miniQuizBest: 0, confirmQuizBest: 0, reviewCount: 0 },
    7: { unlocked: false, mastery: 0, bossDefeated: false, miniQuizBest: 0, confirmQuizBest: 0, reviewCount: 0 },
    8: { unlocked: false, mastery: 0, bossDefeated: false, miniQuizBest: 0, confirmQuizBest: 0, reviewCount: 0 },
    9: { unlocked: false, mastery: 0, bossDefeated: false, miniQuizBest: 0, confirmQuizBest: 0, reviewCount: 0 },
  },
  ownedCards: {},
  equippedCardIds: [],
  ownedCompanions: [],
  ownedItems: {},
  fragments: 0,
  captureEnergy: 0,
  wrongAnswers: [],
  streak: 0,
  activeBuffs: [],
});

export const useGameStore = create<GameState>()(
  persist(
    (set, _get: () => GameState) => ({
      screen: "title",
      currentRun: null,
      pendingHeroId: null,
      difficulty: "normal",
      isNewGame: true,

      setScreen: (screen) => set({ screen }),
      setPendingHeroId: (pendingHeroId) => set({ pendingHeroId }),

      startNewGame: (heroId, playerName) =>
        set({
          currentRun: createInitialRun(heroId, playerName),
          pendingHeroId: null,
          screen: "home",
          isNewGame: false,
        }),

      resetRun: () =>
        set({
          currentRun: null,
          pendingHeroId: null,
          screen: "title",
          isNewGame: true,
        }),

      addXP: (amount) =>
        set((s) => {
          if (!s.currentRun) return s;
          const totalXP = s.currentRun.totalXP + amount;
          const level = Math.floor(totalXP / 100) + 1;
          return { currentRun: { ...s.currentRun, totalXP, level } };
        }),

      addMP: (amount) =>
        set((s) => {
          if (!s.currentRun) return s;
          return { currentRun: { ...s.currentRun, mp: s.currentRun.mp + amount } };
        }),

      spendMP: (amount) => {
        const s = _get();
        if (!s.currentRun || s.currentRun.mp < amount) return false;
        set({ currentRun: { ...s.currentRun, mp: s.currentRun.mp - amount } });
        return true;
      },

      setHomeostasis: (value) =>
        set((s) => {
          if (!s.currentRun) return s;
          return { currentRun: { ...s.currentRun, homeostasis: Math.max(0, Math.min(100, value)) } };
        }),

      addHomeostasis: (amount) =>
        set((s) => {
          if (!s.currentRun) return s;
          const h = Math.max(0, Math.min(100, s.currentRun.homeostasis + amount));
          return { currentRun: { ...s.currentRun, homeostasis: h } };
        }),

      addDebuff: (debuff) =>
        set((s) => {
          if (!s.currentRun) return s;
          return { currentRun: { ...s.currentRun, debuffs: [...s.currentRun.debuffs, debuff] } };
        }),

      removeDebuff: (type) =>
        set((s) => {
          if (!s.currentRun) return s;
          const idx = s.currentRun.debuffs.findIndex((d) => d.type === type);
          if (idx === -1) return s;
          const debuffs = [...s.currentRun.debuffs];
          debuffs.splice(idx, 1);
          return { currentRun: { ...s.currentRun, debuffs } };
        }),

      clearAllDebuffs: () =>
        set((s) => {
          if (!s.currentRun) return s;
          return { currentRun: { ...s.currentRun, debuffs: [] } };
        }),

      tickDebuffs: () =>
        set((s) => {
          if (!s.currentRun) return s;
          const debuffs = s.currentRun.debuffs
            .map((d) => ({ ...d, duration: d.duration - 1 }))
            .filter((d) => d.duration > 0);
          return { currentRun: { ...s.currentRun, debuffs } };
        }),

      addBuff: (buff) =>
        set((s) => {
          if (!s.currentRun) return s;
          return { currentRun: { ...s.currentRun, activeBuffs: [...s.currentRun.activeBuffs, buff] } };
        }),

      tickBuffs: () =>
        set((s) => {
          if (!s.currentRun) return s;
          const activeBuffs = s.currentRun.activeBuffs
            .map((b) => ({ ...b, turnsRemaining: b.turnsRemaining - 1 }))
            .filter((b) => b.turnsRemaining > 0);
          return { currentRun: { ...s.currentRun, activeBuffs } };
        }),

      useSkill: (skillId, cooldown) =>
        set((s) => {
          if (!s.currentRun) return s;
          return {
            currentRun: {
              ...s.currentRun,
              skillCooldowns: { ...s.currentRun.skillCooldowns, [skillId]: cooldown },
            },
          };
        }),

      tickCooldowns: () =>
        set((s) => {
          if (!s.currentRun) return s;
          const cds: Record<string, number> = {};
          for (const [k, v] of Object.entries(s.currentRun.skillCooldowns)) {
            if (v > 1) cds[k] = v - 1;
          }
          return { currentRun: { ...s.currentRun, skillCooldowns: cds } };
        }),

      addUltimateCharge: (amount) =>
        set((s) => {
          if (!s.currentRun) return s;
          return {
            currentRun: {
              ...s.currentRun,
              ultimateCharge: s.currentRun.ultimateCharge + amount,
            },
          };
        }),

      resetUltimateCharge: () =>
        set((s) => {
          if (!s.currentRun) return s;
          return { currentRun: { ...s.currentRun, ultimateCharge: 0 } };
        }),

      learnHeroSkill: (skillId, mpCost) => {
        const s = _get();
        const run = s.currentRun;
        if (!run) return false;
        const hero = heroes.find((candidate) => candidate.id === run.selectedHeroId);
        if (!hero) return false;

        const loadout = getHeroSkillLoadout(hero, run);
        const skillExists = loadout.allActiveSkills.some((skill) => skill.id === skillId);
        if (!skillExists) return false;

        if (loadout.learnedSkillIds.includes(skillId)) {
          set({
            currentRun: {
              ...run,
              learnedSkillIds: loadout.learnedSkillIds,
              equippedSkillIds: loadout.equippedSkillIds,
            },
          });
          return true;
        }

        if (run.mp < mpCost) return false;

        set({
          currentRun: {
            ...run,
            mp: run.mp - mpCost,
            learnedSkillIds: [...loadout.learnedSkillIds, skillId],
            equippedSkillIds: loadout.equippedSkillIds,
          },
        });
        return true;
      },

      equipHeroSkill: (skillId, slotIndex) => {
        const s = _get();
        const run = s.currentRun;
        if (!run) return false;
        const hero = heroes.find((candidate) => candidate.id === run.selectedHeroId);
        if (!hero) return false;

        const loadout = getHeroSkillLoadout(hero, run);
        if (slotIndex < 0 || slotIndex >= loadout.skillSetMax) return false;
        if (!loadout.learnedSkillIds.includes(skillId)) return false;

        const nextEquipped = [...loadout.equippedSkillIds];
        const existingIndex = nextEquipped.indexOf(skillId);

        if (existingIndex === slotIndex) {
          set({
            currentRun: {
              ...run,
              learnedSkillIds: loadout.learnedSkillIds,
              equippedSkillIds: loadout.equippedSkillIds,
            },
          });
          return true;
        }

        if (existingIndex >= 0) {
          const displacedSkill = nextEquipped[slotIndex];
          nextEquipped[slotIndex] = skillId;
          nextEquipped[existingIndex] = displacedSkill;
        } else {
          nextEquipped[slotIndex] = skillId;
        }

        set({
          currentRun: {
            ...run,
            learnedSkillIds: loadout.learnedSkillIds,
            equippedSkillIds: nextEquipped,
          },
        });
        return true;
      },

      unlockChapter: (chapter) =>
        set((s) => {
          if (!s.currentRun) return s;
          const cp = { ...s.currentRun.chapterProgress };
          if (cp[chapter]) {
            cp[chapter] = { ...cp[chapter], unlocked: true };
          }
          return { currentRun: { ...s.currentRun, chapterProgress: cp } };
        }),

      defeatBoss: (chapter) =>
        set((s) => {
          if (!s.currentRun) return s;
          const cp = { ...s.currentRun.chapterProgress };
          if (cp[chapter]) {
            cp[chapter] = { ...cp[chapter], bossDefeated: true };
          }
          if (chapter < 9 && cp[chapter + 1]) {
            cp[chapter + 1] = { ...cp[chapter + 1], unlocked: true };
          }

          // ヒーロー仲間のランダム加入 (Ch.2, Ch.4, Ch.6 ボスクリア時)
          let newTeam = [...s.currentRun.team];
          let recruitedHero: Companion | null = null;
          const RECRUIT_CHAPTERS = [2, 4, 6];
          if (RECRUIT_CHAPTERS.includes(chapter)) {
            const heroId = s.currentRun.selectedHeroId;
            const existingHeroRefs = new Set(
              newTeam.map((c) => c.heroRef).filter(Boolean)
            );
            existingHeroRefs.add(heroId); // 自分のヒーローも除外

            const heroCompanions = (companionsData as Companion[]).filter(
              (c) => c.type === "hero" && c.heroRef && !existingHeroRefs.has(c.heroRef)
            );

            if (heroCompanions.length > 0) {
              const randomIdx = Math.floor(Math.random() * heroCompanions.length);
              recruitedHero = { ...heroCompanions[randomIdx] };
              newTeam = [...newTeam, recruitedHero];
            }
          }

          const result: Record<string, unknown> = {
            currentRun: { ...s.currentRun, chapterProgress: cp, team: newTeam },
          };
          if (recruitedHero) {
            result._lastRecruitedHero = recruitedHero;
          }
          return result as Partial<GameState>;
        }),

      updateChapterMastery: (chapter, update) =>
        set((s) => {
          if (!s.currentRun) return s;
          const cp = { ...s.currentRun.chapterProgress };
          if (cp[chapter]) {
            cp[chapter] = { ...cp[chapter], ...update };
          }
          return { currentRun: { ...s.currentRun, chapterProgress: cp } };
        }),

      addCard: (cardId, card) =>
        set((s) => {
          if (!s.currentRun) return s;
          const existing = s.currentRun.ownedCards[cardId];
          const newCard = card ? { ...card } : { stage: 1, count: 1, skin: "normal" };
          if (existing) {
            newCard.count = existing.count + 1;
            newCard.stage = Math.max(existing.stage, newCard.stage);
          }
          return {
            currentRun: {
              ...s.currentRun,
              ownedCards: { ...s.currentRun.ownedCards, [cardId]: newCard },
            },
          };
        }),

      updateCard: (cardId, card) =>
        set((s) => {
          if (!s.currentRun) return s;
          if (!s.currentRun.ownedCards[cardId]) return s;
          return {
            currentRun: {
              ...s.currentRun,
              ownedCards: {
                ...s.currentRun.ownedCards,
                [cardId]: { ...card },
              },
            },
          };
        }),

      evolveCard: (cardId) =>
        set((s) => {
          if (!s.currentRun) return s;
          const card = s.currentRun.ownedCards[cardId];
          if (!card || card.stage >= 3) return s;
          return {
            currentRun: {
              ...s.currentRun,
              ownedCards: {
                ...s.currentRun.ownedCards,
                [cardId]: { ...card, stage: card.stage + 1 },
              },
            },
          };
        }),

      setEquippedCards: (cardIds) =>
        set((s) => {
          if (!s.currentRun) return s;
          return {
            currentRun: { ...s.currentRun, equippedCardIds: cardIds },
          };
        }),

      addItem: (itemId, count = 1) =>
        set((s) => {
          if (!s.currentRun) return s;
          const current = s.currentRun.ownedItems[itemId] || 0;
          return {
            currentRun: {
              ...s.currentRun,
              ownedItems: { ...s.currentRun.ownedItems, [itemId]: current + count },
            },
          };
        }),

      removeItem: (itemId, count = 1) =>
        set((s) => {
          if (!s.currentRun) return s;
          const current = s.currentRun.ownedItems[itemId] || 0;
          const next = Math.max(0, current - count);
          const items = { ...s.currentRun.ownedItems };
          if (next === 0) delete items[itemId];
          else items[itemId] = next;
          return { currentRun: { ...s.currentRun, ownedItems: items } };
        }),

      useItemOutsideBattle: (itemId, targetId) =>
        set((s) => {
          if (!s.currentRun) return s;
          const count = s.currentRun.ownedItems[itemId] || 0;
          if (count <= 0) return s;

          const next = Math.max(0, count - 1);
          const items = { ...s.currentRun.ownedItems };
          if (next === 0) delete items[itemId];
          else items[itemId] = next;

          let nextRun = { ...s.currentRun, ownedItems: items };

          if (itemId === "evolution_stone") {
            nextRun.heroEvolutionLevel = (nextRun.heroEvolutionLevel || 0) + 1;
          } else if (itemId === "bond_fragment" && targetId) {
            nextRun.ownedCompanions = nextRun.ownedCompanions.map(c =>
              c.id === targetId ? { ...c, bondLevel: (c.bondLevel || 0) + 1 } : c
            );
            nextRun.team = nextRun.team.map(c =>
              c.id === targetId ? { ...c, bondLevel: (c.bondLevel || 0) + 1 } : c
            );
          } else if (itemId === "rare_frame" && targetId) {
            if (nextRun.ownedCards[targetId]) {
              nextRun.ownedCards = {
                ...nextRun.ownedCards,
                [targetId]: { ...nextRun.ownedCards[targetId], foil: true }
              };
            }
          }

          return { currentRun: nextRun };
        }),

      addFragments: (count) =>
        set((s) => {
          if (!s.currentRun) return s;
          return { currentRun: { ...s.currentRun, fragments: s.currentRun.fragments + count } };
        }),

      addCaptureEnergy: (count) =>
        set((s) => {
          if (!s.currentRun) return s;
          return { currentRun: { ...s.currentRun, captureEnergy: s.currentRun.captureEnergy + count } };
        }),

      spendCaptureEnergy: (cost) =>
        set((s) => {
          if (!s.currentRun) return s;
          return { currentRun: { ...s.currentRun, captureEnergy: Math.max(0, s.currentRun.captureEnergy - cost) } };
        }),

      spendFragments: (cost) => {
        const s = _get();
        if (!s.currentRun || s.currentRun.fragments < cost) return false;
        set({ currentRun: { ...s.currentRun, fragments: s.currentRun.fragments - cost } });
        return true;
      },

      incrementStreak: () =>
        set((s) => {
          if (!s.currentRun) return s;
          return { currentRun: { ...s.currentRun, streak: s.currentRun.streak + 1 } };
        }),

      resetStreak: () =>
        set((s) => {
          if (!s.currentRun) return s;
          return { currentRun: { ...s.currentRun, streak: 0 } };
        }),

      addWrongAnswer: (questionId) =>
        set((s) => {
          if (!s.currentRun) return s;
          return {
            currentRun: {
              ...s.currentRun,
              wrongAnswers: [...s.currentRun.wrongAnswers, questionId],
            },
          };
        }),

      addCompanion: (companion) =>
        set((s) => {
          if (!s.currentRun) return s;
          const exists = s.currentRun.ownedCompanions.some((c) => c.id === companion.id);
          if (exists) return s;
          return {
            currentRun: {
              ...s.currentRun,
              ownedCompanions: [...s.currentRun.ownedCompanions, companion],
            },
          };
        }),

      removeCompanion: (companionId) =>
        set((s) => {
          if (!s.currentRun) return s;
          const nextTeam = s.currentRun.team.filter((c) => c.id !== companionId);
          return {
            currentRun: {
              ...s.currentRun,
              ownedCompanions: s.currentRun.ownedCompanions.filter((c) => c.id !== companionId),
              team: nextTeam,
              battleFormationIds: normalizeBattleFormationIds(
                s.currentRun.selectedHeroId,
                nextTeam,
                s.currentRun.battleFormationIds
              ),
            },
          };
        }),

      updateCompanion: (companion) =>
        set((s) => {
          if (!s.currentRun) return s;
          const nextTeam = s.currentRun.team.map((c) =>
            c.id === companion.id ? companion : c
          );
          return {
            currentRun: {
              ...s.currentRun,
              ownedCompanions: s.currentRun.ownedCompanions.map((c) =>
                c.id === companion.id ? companion : c
              ),
              team: nextTeam,
              battleFormationIds: normalizeBattleFormationIds(
                s.currentRun.selectedHeroId,
                nextTeam,
                s.currentRun.battleFormationIds
              ),
            },
          };
        }),

      setTeam: (team) =>
        set((s) => {
          if (!s.currentRun) return s;
          const limitedTeam = team.slice(0, 2);
          return {
            currentRun: {
              ...s.currentRun,
              team: limitedTeam,
              battleFormationIds: normalizeBattleFormationIds(
                s.currentRun.selectedHeroId,
                limitedTeam,
                s.currentRun.battleFormationIds
              ),
            },
          };
        }),

      setBattleFormation: (battleFormationIds) =>
        set((s) => {
          if (!s.currentRun) return s;
          return {
            currentRun: {
              ...s.currentRun,
              battleFormationIds: normalizeBattleFormationIds(
                s.currentRun.selectedHeroId,
                s.currentRun.team,
                battleFormationIds
              ),
            },
          };
        }),

      setDifficulty: (difficulty) => set({ difficulty }),
    }),
    { name: "orgamon-game-store" }
  )
);
