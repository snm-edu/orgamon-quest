import type { Question, QuestionDifficulty, QuizResult } from "../types";
import questionsData from "../data/questions.json";

const questions = questionsData as Question[];

export function getQuestionsByChapter(chapter: number, type?: string): Question[] {
  return questions.filter(
    (q) => q.chapter === chapter && (!type || q.type === type)
  );
}

export function getRandomQuestions(chapter: number, count: number, type?: string): Question[] {
  const pool = getQuestionsByChapter(chapter, type);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * 指定件数を必ず返す。
 * 同一章/同一タイプで足りない場合は同章内で補完し、それでも不足する場合は全体から補完する。
 */
export function getRandomQuestionsGuaranteed(
  chapter: number,
  count: number,
  type?: string
): Question[] {
  const byType = getQuestionsByChapter(chapter, type);
  const sameChapter = getQuestionsByChapter(chapter);

  const source =
    byType.length > 0 ? byType : sameChapter.length > 0 ? sameChapter : questions;

  if (source.length === 0 || count <= 0) return [];

  const result: Question[] = [];
  while (result.length < count) {
    const shuffled = [...source].sort(() => Math.random() - 0.5);
    for (const q of shuffled) {
      result.push(q);
      if (result.length >= count) break;
    }
  }

  return result;
}

export function getFinalQuestions(count: number = 30): Question[] {
  return getRandomQuestionsGuaranteed(9, count, "final");
}

/** 難易度別の経験値倍率 */
const DIFFICULTY_XP: Record<QuestionDifficulty, number> = {
  easy: 5,
  normal: 10,
  hard: 20,
};

/** 問題の難易度を取得（未設定時は type から推定） */
export function getQuestionDifficulty(q: Question): QuestionDifficulty {
  if (q.difficulty) return q.difficulty;
  if (q.type === "mini") return "easy";
  if (q.type === "final") return "hard";
  return "normal";
}

export function calculateQuizRewards(result: QuizResult) {
  // 問題ごとの難易度別XPを合計
  let baseXP = 0;
  for (const qa of result.questionsAnswered) {
    if (qa.correct) {
      baseXP += DIFFICULTY_XP[qa.difficulty];
    }
  }
  // questionsAnswered が空の場合のフォールバック
  if (result.questionsAnswered.length === 0) {
    baseXP = result.correct * 10;
  }

  const streakBonus = result.maxStreak * 2;
  const perfectBonus = result.correct === result.total ? 20 : 0;
  const gainedXP = baseXP + streakBonus + perfectBonus;

  const baseMP = result.correct * 5 + (result.correct === result.total ? 30 : 0);

  const captureEnergy = result.correct + (result.correct >= 4 ? 1 : 0);

  const fragments = result.wrong;

  return {
    xp: gainedXP,
    mp: baseMP,
    captureEnergy,
    fragments,
    isPerfect: result.correct === result.total,
  };
}

export function calculateMastery(
  miniQuizBest: number,
  confirmQuizBest: number,
  reviewCount: number
): number {
  const miniContrib = miniQuizBest * 0.4;
  const confirmContrib = confirmQuizBest * 0.4;
  const reviewContrib = Math.min(reviewCount * 20, 100) * 0.2;
  return Math.min(100, Math.round(miniContrib + confirmContrib + reviewContrib));
}

export function shuffleChoices(
  choices: string[],
  answerIndex: number
): { shuffledChoices: string[]; newAnswerIndex: number } {
  const answer = choices[answerIndex];
  const indices = choices.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const shuffledChoices = indices.map((i) => choices[i]);
  const newAnswerIndex = shuffledChoices.indexOf(answer);
  return { shuffledChoices, newAnswerIndex };
}

export function applyReduceChoices(
  choices: string[],
  answerIndex: number,
  reduceBy: number
): { filteredChoices: string[]; newAnswerIndex: number } {
  const answer = choices[answerIndex];
  const wrongIndices = choices
    .map((_, i) => i)
    .filter((i) => i !== answerIndex)
    .sort(() => Math.random() - 0.5);
  const toRemove = wrongIndices.slice(0, reduceBy);
  const filteredChoices = choices.filter((_, i) => !toRemove.includes(i));
  const newAnswerIndex = filteredChoices.indexOf(answer);
  return { filteredChoices, newAnswerIndex };
}
