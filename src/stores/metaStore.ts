import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserMeta, CardSkinId } from "../types";

type MetaStoreState = {
  meta: UserMeta;

  // 実績
  unlockAchievement: (achievementId: string) => boolean;
  isAchievementUnlocked: (achievementId: string) => boolean;

  // 称号
  addTitle: (title: string) => void;
  setActiveTitle: (title: string) => void;
  getTitles: () => string[];

  // カードスキン
  unlockCardSkin: (skin: CardSkinId) => void;
  getUnlockedSkins: () => string[];

  // クリア回数
  incrementClears: () => void;

  // パスワード
  addExternalPassword: (password: string) => boolean;
  checkSpecialGameUnlock: () => boolean;

  // リセット
  resetMeta: () => void;
};

const createInitialMeta = (): UserMeta => ({
  totalClears: 0,
  achievements: {},
  titles: ["冒険者"],
  activeTitle: "冒険者",
  cardSkins: ["normal"],
  loginStreak: 0,
  lastLoginDate: "",
  externalPasswords: [],
  specialGameUnlocked: false,
});

export const useMetaStore = create<MetaStoreState>()(
  persist(
    (set, get) => ({
      meta: createInitialMeta(),

      unlockAchievement: (achievementId) => {
        const state = get().meta;
        if (state.achievements[achievementId]) return false;
        set({
          meta: {
            ...state,
            achievements: { ...state.achievements, [achievementId]: true },
          },
        });
        return true;
      },

      isAchievementUnlocked: (achievementId) => {
        return !!get().meta.achievements[achievementId];
      },

      addTitle: (title) => {
        const state = get().meta;
        if (state.titles.includes(title)) return;
        set({
          meta: {
            ...state,
            titles: [...state.titles, title],
          },
        });
      },

      setActiveTitle: (title) => {
        const state = get().meta;
        if (!state.titles.includes(title)) return;
        set({ meta: { ...state, activeTitle: title } });
      },

      getTitles: () => get().meta.titles,

      unlockCardSkin: (skin) => {
        const state = get().meta;
        if (state.cardSkins.includes(skin)) return;
        set({
          meta: {
            ...state,
            cardSkins: [...state.cardSkins, skin],
          },
        });
      },

      getUnlockedSkins: () => get().meta.cardSkins,

      incrementClears: () => {
        const state = get().meta;
        set({
          meta: { ...state, totalClears: state.totalClears + 1 },
        });
      },

      addExternalPassword: (password) => {
        const state = get().meta;
        const trimmed = password.trim().toUpperCase();
        if (!trimmed || state.externalPasswords.includes(trimmed)) return false;

        const validPasswords = [
          "PHYSIO-QUEST-2026",
          "ANATOMY-HERO-2026",
          "MEDICAL-STAR-2026",
        ];

        if (!validPasswords.includes(trimmed)) return false;

        const newPasswords = [...state.externalPasswords, trimmed];
        const specialUnlocked = newPasswords.length >= 3;

        set({
          meta: {
            ...state,
            externalPasswords: newPasswords,
            specialGameUnlocked: specialUnlocked,
          },
        });
        return true;
      },

      checkSpecialGameUnlock: () => {
        return get().meta.externalPasswords.length >= 3;
      },

      resetMeta: () => set({ meta: createInitialMeta() }),
    }),
    { name: "orgamon-meta-store" }
  )
);
