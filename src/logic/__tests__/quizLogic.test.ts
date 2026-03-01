import { describe, it, expect } from 'vitest';
import {
  calculateQuizRewards,
  calculateMastery,
  shuffleChoices,
  applyReduceChoices,
} from '../quizLogic';
import type { QuizResult } from '../../types';

describe('calculateQuizRewards', () => {
  it('基本XP計算: 正解数×10 + 最大連続正解×2', () => {
    const result: QuizResult = {
      chapter: 1,
      total: 5,
      correct: 3,
      wrong: 2,
      maxStreak: 2,
      wrongQuestionIds: ['q1', 'q2'],
      timeTaken: 60,
      questionsAnswered: [],
    };
    const rewards = calculateQuizRewards(result);
    expect(rewards.xp).toBe(3 * 10 + 2 * 2); // 34
  });

  it('全問正解時のパーフェクトボーナス (+20 XP, +30 MP)', () => {
    const result: QuizResult = {
      chapter: 1,
      total: 5,
      correct: 5,
      wrong: 0,
      maxStreak: 5,
      wrongQuestionIds: [],
      timeTaken: 45,
      questionsAnswered: [],
    };
    const rewards = calculateQuizRewards(result);
    expect(rewards.xp).toBe(5 * 10 + 5 * 2 + 20); // 80
    expect(rewards.mp).toBe(5 * 5 + 30); // 55
    expect(rewards.isPerfect).toBe(true);
  });

  it('全問不正解時はXP=0 + ストリークボーナス=0', () => {
    const result: QuizResult = {
      chapter: 1,
      total: 5,
      correct: 0,
      wrong: 5,
      maxStreak: 0,
      wrongQuestionIds: ['q1', 'q2', 'q3', 'q4', 'q5'],
      timeTaken: 120,
      questionsAnswered: [],
    };
    const rewards = calculateQuizRewards(result);
    expect(rewards.xp).toBe(0);
    expect(rewards.mp).toBe(0);
    expect(rewards.isPerfect).toBe(false);
  });

  it('captureEnergy: 正解数 + (4問以上正解なら+1)', () => {
    const result4: QuizResult = {
      chapter: 1, total: 5, correct: 4, wrong: 1,
      maxStreak: 4, wrongQuestionIds: ['q1'], timeTaken: 60, questionsAnswered: [],
    };
    expect(calculateQuizRewards(result4).captureEnergy).toBe(5); // 4 + 1

    const result3: QuizResult = {
      chapter: 1, total: 5, correct: 3, wrong: 2,
      maxStreak: 3, wrongQuestionIds: ['q1', 'q2'], timeTaken: 60, questionsAnswered: [],
    };
    expect(calculateQuizRewards(result3).captureEnergy).toBe(3); // 3 + 0
  });

  it('fragments: 不正解数と同じ', () => {
    const result: QuizResult = {
      chapter: 1, total: 5, correct: 2, wrong: 3,
      maxStreak: 1, wrongQuestionIds: ['q1', 'q2', 'q3'], timeTaken: 90, questionsAnswered: [],
    };
    expect(calculateQuizRewards(result).fragments).toBe(3);
  });
});

describe('calculateMastery', () => {
  it('ミニクイズ40% + 確認クイズ40% + 復習20%で合算', () => {
    const mastery = calculateMastery(100, 100, 5);
    // 100*0.4 + 100*0.4 + min(100, 100)*0.2 = 40+40+20 = 100
    expect(mastery).toBe(100);
  });

  it('全てゼロなら0', () => {
    expect(calculateMastery(0, 0, 0)).toBe(0);
  });

  it('復習回数が5回以上でも100*0.2=20で上限', () => {
    const mastery = calculateMastery(50, 50, 10);
    // 50*0.4 + 50*0.4 + min(200, 100)*0.2 = 20+20+20 = 60
    expect(mastery).toBe(60);
  });

  it('100を超えない', () => {
    const mastery = calculateMastery(200, 200, 10);
    expect(mastery).toBe(100);
  });
});

describe('shuffleChoices', () => {
  it('シャッフル後も正解の選択肢が正しいインデックスを指す', () => {
    const choices = ['A', 'B', 'C', 'D'];
    const answerIndex = 2; // C が正解
    const { shuffledChoices, newAnswerIndex } = shuffleChoices(choices, answerIndex);

    expect(shuffledChoices).toHaveLength(4);
    expect(shuffledChoices[newAnswerIndex]).toBe('C');
    expect(new Set(shuffledChoices)).toEqual(new Set(choices));
  });
});

describe('applyReduceChoices', () => {
  it('選択肢を削減しても正解が残る', () => {
    const choices = ['A', 'B', 'C', 'D'];
    const answerIndex = 1; // B が正解
    const { filteredChoices, newAnswerIndex } = applyReduceChoices(choices, answerIndex, 2);

    expect(filteredChoices).toHaveLength(2);
    expect(filteredChoices[newAnswerIndex]).toBe('B');
  });

  it('reduceBy=0 なら変化なし', () => {
    const choices = ['A', 'B', 'C', 'D'];
    const { filteredChoices } = applyReduceChoices(choices, 0, 0);
    expect(filteredChoices).toHaveLength(4);
  });
});
