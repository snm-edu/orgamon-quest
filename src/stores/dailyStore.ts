import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DailyState, ActiveDailyMission, DailyMissionCondition } from "../types";
import { generateDailyMissions, getLoginBonusForDay } from "../logic/dailyLogic";

function getTodayStr(): string {
  return formatLocalDate(new Date());
}

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

type DailyStoreState = {
  daily: DailyState;

  /** ログインチェック（アプリ起動/ホーム画面表示時に呼ぶ） */
  checkLogin: () => { isNewDay: boolean; streak: number; bonusDay: number };

  /** ログインボーナスを受け取る */
  claimLoginBonus: () => { type: string; value: string; amount: number; label: string } | null;

  /** デイリーミッション進捗更新 */
  progressMission: (condition: DailyMissionCondition, amount?: number) => void;

  /** デイリーミッション報酬を受け取る */
  claimMissionReward: (missionIndex: number) => { mp: number; itemId?: string } | null;

  /** 全ミッション取得 */
  getMissions: () => ActiveDailyMission[];

  /** 完全リセット（デバッグ用） */
  resetDaily: () => void;
};

const createInitialDaily = (): DailyState => ({
  lastLoginDate: "",
  loginStreak: 0,
  loginBonusClaimed: false,
  loginBonusDay: 0,
  missions: [],
  missionsDate: "",
});

export const useDailyStore = create<DailyStoreState>()(
  persist(
    (set, get) => ({
      daily: createInitialDaily(),

      checkLogin: () => {
        const today = getTodayStr();
        const state = get().daily;
        const lastDate = state.lastLoginDate;

        if (lastDate === today) {
          return {
            isNewDay: false,
            streak: state.loginStreak,
            bonusDay: state.loginBonusDay,
          };
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = formatLocalDate(yesterday);

        const isConsecutive = lastDate === yesterdayStr;
        const newStreak = isConsecutive ? state.loginStreak + 1 : 1;
        const newBonusDay = ((state.loginBonusDay) % 14) + 1;

        const newMissions =
          state.missionsDate === today
            ? state.missions
            : generateDailyMissions();

        set({
          daily: {
            lastLoginDate: today,
            loginStreak: newStreak,
            loginBonusClaimed: false,
            loginBonusDay: newBonusDay,
            missions: newMissions,
            missionsDate: today,
          },
        });

        return {
          isNewDay: true,
          streak: newStreak,
          bonusDay: newBonusDay,
        };
      },

      claimLoginBonus: () => {
        const state = get().daily;
        if (state.loginBonusClaimed) return null;

        const bonus = getLoginBonusForDay(state.loginBonusDay);
        set({
          daily: { ...state, loginBonusClaimed: true },
        });

        return bonus;
      },

      progressMission: (condition, amount = 1) => {
        const state = get().daily;
        const today = getTodayStr();
        if (state.missionsDate !== today) return;

        const missions = state.missions.map((m) => {
          if (m.condition !== condition || m.completed) return m;
          const newProgress = Math.min(m.progress + amount, m.target);
          return {
            ...m,
            progress: newProgress,
            completed: newProgress >= m.target,
          };
        });

        set({ daily: { ...state, missions } });
      },

      claimMissionReward: (missionIndex) => {
        const state = get().daily;
        const mission = state.missions[missionIndex];
        if (!mission || !mission.completed || mission.claimed) return null;

        const missions = [...state.missions];
        missions[missionIndex] = { ...mission, claimed: true };
        set({ daily: { ...state, missions } });

        return mission.reward;
      },

      getMissions: () => get().daily.missions,

      resetDaily: () => set({ daily: createInitialDaily() }),
    }),
    { name: "orgamon-daily-store" }
  )
);
