import type { ActiveDailyMission, DailyMissionCondition, LoginBonusReward } from "../types";

// ===== デイリーミッションテンプレート =====
const missionTemplates: {
  id: string;
  description: string;
  condition: DailyMissionCondition;
  target: number;
  reward: { mp: number; itemId?: string };
}[] = [
  { id: "dm_quiz1", description: "クイズを1回プレイ", condition: "quiz_play_1", target: 1, reward: { mp: 20 } },
  { id: "dm_quiz3", description: "クイズを3回プレイ", condition: "quiz_play_3", target: 3, reward: { mp: 50, itemId: "wisdom_potion" } },
  { id: "dm_streak3", description: "3問連続正解", condition: "streak_3", target: 1, reward: { mp: 30 } },
  { id: "dm_streak5", description: "5問連続正解", condition: "streak_5", target: 1, reward: { mp: 40, itemId: "experience_book" } },
  { id: "dm_skill2", description: "スキルを2回使用", condition: "skill_use_2", target: 2, reward: { mp: 25 } },
  { id: "dm_skill3", description: "スキルを3回使用", condition: "skill_use_3", target: 3, reward: { mp: 35, itemId: "skill_amplifier" } },
  { id: "dm_boss", description: "ボスに挑戦", condition: "boss_challenge", target: 1, reward: { mp: 50, itemId: "clear_mist" } },
  { id: "dm_capture1", description: "カードを1枚捕獲", condition: "card_capture_1", target: 1, reward: { mp: 20 } },
  { id: "dm_capture3", description: "カードを3枚捕獲", condition: "card_capture_3", target: 3, reward: { mp: 40 } },
  { id: "dm_companion", description: "仲間を1体獲得", condition: "companion_gain", target: 1, reward: { mp: 30, itemId: "bond_fragment" } },
  { id: "dm_item", description: "アイテムを1回使用", condition: "item_use_1", target: 1, reward: { mp: 20 } },
  { id: "dm_perfect", description: "全問正解を達成", condition: "perfect_quiz", target: 1, reward: { mp: 50, itemId: "time_sand" } },
  { id: "dm_chapter", description: "チャプターをクリア", condition: "chapter_clear", target: 1, reward: { mp: 40 } },
];

/** 1日3つのランダムデイリーミッションを生成 */
export function generateDailyMissions(): ActiveDailyMission[] {
  const shuffled = [...missionTemplates].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);

  return selected.map((t) => ({
    templateId: t.id,
    description: t.description,
    condition: t.condition,
    reward: t.reward,
    progress: 0,
    target: t.target,
    completed: false,
    claimed: false,
  }));
}

// ===== ログインボーナス =====
const loginBonusSchedule: LoginBonusReward[] = [
  { day: 1, type: "mp", value: "50", amount: 50, label: "50 MP" },
  { day: 2, type: "item", value: "wisdom_potion", amount: 1, label: "知恵の薬 ×1" },
  { day: 3, type: "mp", value: "80", amount: 80, label: "80 MP" },
  { day: 4, type: "item", value: "time_sand", amount: 1, label: "時の砂 ×1" },
  { day: 5, type: "mp", value: "100", amount: 100, label: "100 MP" },
  { day: 6, type: "item", value: "experience_book", amount: 1, label: "経験の書 ×1" },
  { day: 7, type: "card", value: "rare_guaranteed", amount: 1, label: "確定Rareカード" },
  { day: 8, type: "mp", value: "60", amount: 60, label: "60 MP" },
  { day: 9, type: "item", value: "clear_mist", amount: 1, label: "クリアミスト ×1" },
  { day: 10, type: "mp", value: "120", amount: 120, label: "120 MP" },
  { day: 11, type: "item", value: "skill_amplifier", amount: 1, label: "スキル増幅器 ×1" },
  { day: 12, type: "mp", value: "150", amount: 150, label: "150 MP" },
  { day: 13, type: "item", value: "evolution_stone", amount: 1, label: "進化の石 ×1" },
  { day: 14, type: "companion", value: "epic_companion_guaranteed", amount: 1, label: "確定Epic仲間" },
];

export function getLoginBonusForDay(day: number): LoginBonusReward {
  const idx = Math.max(0, Math.min(day - 1, loginBonusSchedule.length - 1));
  return loginBonusSchedule[idx];
}

export function getLoginBonusSchedule(): LoginBonusReward[] {
  return loginBonusSchedule;
}

// ===== 曜日限定ドロップ率UP =====
const dayOfWeekChapterBoost: Record<number, number[]> = {
  0: [],       // 日曜: 全章 1.5 倍（特殊処理）
  1: [1, 2],   // 月曜: Ch1,2
  2: [3, 4],   // 火曜: Ch3,4
  3: [5],      // 水曜: Ch5
  4: [6],      // 木曜: Ch6
  5: [7],      // 金曜: Ch7
  6: [8, 9],   // 土曜: Ch8,9
};

const dayOfWeekLabels = ["日", "月", "火", "水", "木", "金", "土"];

export function getDayOfWeekDropBoost(): {
  dayLabel: string;
  boostedChapters: number[];
  multiplier: number;
  isSunday: boolean;
} {
  const dow = new Date().getDay();
  const isSunday = dow === 0;

  return {
    dayLabel: dayOfWeekLabels[dow],
    boostedChapters: isSunday ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : dayOfWeekChapterBoost[dow],
    multiplier: isSunday ? 1.5 : 2.0,
    isSunday,
  };
}

/** 特定の章のドロップ率倍率を返す */
export function getChapterDropMultiplier(chapter: number): number {
  const boost = getDayOfWeekDropBoost();
  if (boost.boostedChapters.includes(chapter)) {
    return boost.multiplier;
  }
  return 1.0;
}

/** 章名ラベル */
const chapterNames: Record<number, string> = {
  1: "細胞と組織",
  2: "器官系",
  3: "骨格",
  4: "体液",
  5: "内臓",
  6: "循環",
  7: "呼吸",
  8: "感覚",
  9: "修了レイド",
};

export function getChapterName(chapter: number): string {
  return chapterNames[chapter] || `Ch.${chapter}`;
}
