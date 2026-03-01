import type { Achievement, UserCurrentRun } from "../types";
import achievementsData from "../data/achievements.json";
import cardsData from "../data/cards.json";

const achievements = achievementsData as Achievement[];
const totalCardsCount = cardsData.length;

export function getAllAchievements(): Achievement[] {
  return achievements;
}

export function getAchievementById(id: string): Achievement | undefined {
  return achievements.find((a) => a.id === id);
}

/** 現在のゲーム状態から解除可能な実績をチェック */
export function checkAchievements(
  currentRun: UserCurrentRun,
  unlockedMap: Record<string, boolean>,
  extraContext?: {
    comboTriggered?: string;
    bossDefeatedNoSkills?: boolean;
    chapterClearTime?: number;
    totalReviewClears?: number;
    collectionCompletionRate?: number;
    allHeroesMaxEvolution?: boolean;
  }
): string[] {
  const newlyUnlocked: string[] = [];

  for (const ach of achievements) {
    if (unlockedMap[ach.id]) continue;

    const unlocked = evaluateCondition(
      ach.condition,
      currentRun,
      extraContext
    );

    if (unlocked) {
      newlyUnlocked.push(ach.id);
    }
  }

  return newlyUnlocked;
}

function evaluateCondition(
  condition: string,
  run: UserCurrentRun,
  ctx?: {
    comboTriggered?: string;
    bossDefeatedNoSkills?: boolean;
    chapterClearTime?: number;
    totalReviewClears?: number;
    collectionCompletionRate?: number;
    allHeroesMaxEvolution?: boolean;
  }
): boolean {
  const progress = run.chapterProgress;

  switch (condition) {
    case "chapter_clear_1": {
      return Object.values(progress).some((cp) => cp.bossDefeated);
    }

    case "cards_chapter1_all": {
      const ch1Cards = cardsData.filter((c) => c.chapter === 1);
      return ch1Cards.every((c) => !!run.ownedCards[c.id]);
    }

    case "perfect_quiz_chapter": {
      return run.streak >= 5;
    }

    case "combo_duo_triggered": {
      return ctx?.comboTriggered === "duo" || ctx?.comboTriggered === "all";
    }

    case "combo_all_four_triggered": {
      return ctx?.comboTriggered === "all";
    }

    case "evolution_first": {
      const hasEvolvedCard = Object.values(run.ownedCards).some((c) => c.stage >= 2);
      const hasEvolvedCompanion = run.ownedCompanions.some((c) => c.evolutionStage >= 2);
      return hasEvolvedCard || hasEvolvedCompanion;
    }

    case "streak_10": {
      return run.streak >= 10;
    }

    case "all_bosses_defeated": {
      return [1, 2, 3, 4, 5, 6, 7, 8, 9].every(
        (ch) => progress[ch]?.bossDefeated
      );
    }

    case "pandemic_king_defeated": {
      return !!progress[9]?.bossDefeated;
    }

    case "zukan_50_percent": {
      const ownedCount = Object.keys(run.ownedCards).length;
      return ownedCount >= totalCardsCount * 0.5;
    }

    case "zukan_100_percent": {
      return (ctx?.collectionCompletionRate ?? 0) >= 100;
    }

    case "boss_defeat_no_skills": {
      return !!ctx?.bossDefeatedNoSkills;
    }

    case "chapter_under_5min": {
      return (ctx?.chapterClearTime ?? Infinity) < 300;
    }

    case "review_quest_50": {
      return (ctx?.totalReviewClears ?? 0) >= 50;
    }

    case "all_heroes_max_evolution": {
      return !!ctx?.allHeroesMaxEvolution;
    }

    default:
      return false;
  }
}

/** 実績報酬を適用する情報を返す */
export function getAchievementReward(achievementId: string): {
  type: string;
  value: string;
} | null {
  const ach = getAchievementById(achievementId);
  if (!ach) return null;
  return ach.reward;
}

// ===== 称号一覧 =====
const chapterTitles: Record<number, string> = {
  1: "細胞マスター",
  2: "器官系の守護者",
  3: "骨格博士",
  4: "免疫の守護者",
  5: "内臓の探求者",
  6: "循環の支配者",
  7: "呼吸の達人",
  8: "感覚の覚醒者",
  9: "修了マスター",
};

const heroTitles: Record<string, string> = {
  minato: "ナースの鑑",
  hikari: "精密の眼",
  kotoha: "予防の達人",
  leon: "システムの匠",
};

export function getTitleForChapterClear(chapter: number): string | null {
  return chapterTitles[chapter] || null;
}

export function getTitleForHero(heroId: string): string | null {
  return heroTitles[heroId] || null;
}

export function getAllChapterTitles(): Record<number, string> {
  return chapterTitles;
}

export function getAllHeroTitles(): Record<string, string> {
  return heroTitles;
}
