import { describe, it, expect } from 'vitest';
import { tryCapture, getCardsByChapter, getAllCards, getCardById } from '../captureLogic';

describe('getCardsByChapter', () => {
  it('チャプター1のカードが取得できる', () => {
    const cards = getCardsByChapter(1);
    expect(cards.length).toBeGreaterThan(0);
    cards.forEach((c) => expect(c.chapter).toBe(1));
  });

  it('存在しないチャプターは空配列', () => {
    expect(getCardsByChapter(99)).toHaveLength(0);
  });
});

describe('tryCapture', () => {
  it('captureEnergy 3以上で少なくとも1枚捕獲試行', () => {
    const result = tryCapture(3, 1, 1);
    expect(result.energySpent).toBeGreaterThanOrEqual(3);
  });

  it('captureEnergy 6で2回捕獲試行', () => {
    const result = tryCapture(6, 1, 1);
    expect(result.energySpent).toBe(6);
    expect(result.capturedCards.length).toBeLessThanOrEqual(2);
  });

  it('captureEnergy < 3 では捕獲なし', () => {
    const result = tryCapture(2, 1, 1);
    expect(result.capturedCards).toHaveLength(0);
    expect(result.energySpent).toBe(0);
  });

  it('capturedCardsの各カードはchapter指定と一致', () => {
    const result = tryCapture(30, 1, 10);
    result.capturedCards.forEach((c) => expect(c.chapter).toBe(1));
  });
});

describe('getAllCards', () => {
  it('全カードが取得できる', () => {
    const cards = getAllCards();
    expect(cards.length).toBeGreaterThan(0);
  });
});

describe('getCardById', () => {
  it('存在するカードを取得', () => {
    const card = getCardById('cell_membrane');
    expect(card).toBeDefined();
    expect(card!.name).toBe('細胞膜');
  });

  it('存在しないIDはundefined', () => {
    expect(getCardById('nonexistent')).toBeUndefined();
  });
});
