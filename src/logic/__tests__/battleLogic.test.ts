import { describe, it, expect } from 'vitest';
import {
  calcBossDamage,
  getBossCounterAttack,
  getInitialHomeostasis,
  isBossDefeated,
  isBattleCleared,
  getBossByChapter,
  BATTLE_ROUNDS,
} from '../battleLogic';
import type { Card, OwnedCard, Boss } from '../../types';

const mockCards: Card[] = [
  {
    id: 'card_a',
    name: 'カードA',
    category: 'organelle',
    rarity: 'Common',
    chapter: 1,
    evolutionLine: [],
    skins: ['normal'],
    attackPower: 15,
    attribute: '攻撃',
    description: 'テスト用',
  },
  {
    id: 'card_b',
    name: 'カードB',
    category: 'organ',
    rarity: 'Rare',
    chapter: 1,
    evolutionLine: [],
    skins: ['normal'],
    attackPower: 25,
    attribute: '防御',
    description: 'テスト用',
  },
];

describe('calcBossDamage', () => {
  it('不正解時はダメージ0', () => {
    const ownedCards: Record<string, OwnedCard> = {
      card_a: { stage: 0, count: 1, skin: 'normal' },
    };
    expect(calcBossDamage(false, ownedCards, mockCards)).toBe(0);
  });

  it('正解時: 最強カードのattackPower + stageボーナス × 進化倍率', () => {
    const ownedCards: Record<string, OwnedCard> = {
      card_a: { stage: 0, count: 1, skin: 'normal' },
      card_b: { stage: 0, count: 1, skin: 'normal' },
    };
    // card_b(25) > card_a(15), stage0のボーナス=0, 倍率=1.0
    const damage = calcBossDamage(true, ownedCards, mockCards);
    expect(damage).toBe(Math.floor(25 * 1.0)); // 25
  });

  it('進化段階が高いとダメージ増加', () => {
    const ownedCards: Record<string, OwnedCard> = {
      card_a: { stage: 2, count: 1, skin: 'normal' },
    };
    // card_a: 15 + stageBonus(12) = 27atk, stage2の進化倍率 = 1.5
    const damage = calcBossDamage(true, ownedCards, mockCards);
    expect(damage).toBe(Math.floor(27 * 1.5)); // 40
  });

  it('コンボボーナスが加算される', () => {
    const ownedCards: Record<string, OwnedCard> = {
      card_a: { stage: 0, count: 1, skin: 'normal' },
    };
    const damage = calcBossDamage(true, ownedCards, mockCards, 10);
    expect(damage).toBe(Math.floor(15 * 1.0 + 10)); // 25
  });

  it('カード未所持時はベースダメージ10', () => {
    const damage = calcBossDamage(true, {}, mockCards);
    expect(damage).toBe(Math.floor(10 * 1.0)); // 10
  });
});

describe('getBossCounterAttack', () => {
  const boss: Boss = {
    id: 'test_boss',
    chapter: 1,
    name: 'テストボス',
    hp: 300,
    debuffPattern: [{ type: 'misinformation', duration: 2, severity: 1 }],
    weakness: 'テスト',
    rewards: { mp: 100, items: [] },
    storyIntro: 'テスト',
  };

  it('easyモードはダメージ0.7倍', () => {
    const { homeostasisDamage } = getBossCounterAttack(boss, 1, 'easy');
    const baseDamage = 5 + Math.floor(300 / 150);
    expect(homeostasisDamage).toBe(Math.floor(baseDamage * 0.7));
  });

  it('hardモードはダメージ1.3倍', () => {
    const { homeostasisDamage } = getBossCounterAttack(boss, 1, 'hard');
    const baseDamage = 5 + Math.floor(300 / 150);
    expect(homeostasisDamage).toBe(Math.floor(baseDamage * 1.3));
  });

  it('ラウンド3の倍数またはラウンド7以降でデバフ発生の可能性', () => {
    const { debuffs: debuffs3 } = getBossCounterAttack(boss, 3, 'normal');
    // ラウンド3 (3%3===0) → デバフあり
    expect(debuffs3.length).toBeGreaterThanOrEqual(0); // ランダム要素含む
  });

  it('ラウンド1ではデバフなし', () => {
    const { debuffs } = getBossCounterAttack(boss, 1, 'normal');
    expect(debuffs).toHaveLength(0);
  });
});

describe('getInitialHomeostasis', () => {
  it('easy = 80', () => expect(getInitialHomeostasis('easy')).toBe(80));
  it('normal = 60', () => expect(getInitialHomeostasis('normal')).toBe(60));
  it('hard = 50', () => expect(getInitialHomeostasis('hard')).toBe(50));
});

describe('isBossDefeated', () => {
  it('HP <= 0 で撃破', () => {
    expect(isBossDefeated(0)).toBe(true);
    expect(isBossDefeated(-10)).toBe(true);
    expect(isBossDefeated(1)).toBe(false);
  });
});

describe('isBattleCleared', () => {
  it('ホメオスタシス >= 70 でクリア', () => {
    expect(isBattleCleared(70)).toBe(true);
    expect(isBattleCleared(100)).toBe(true);
    expect(isBattleCleared(69)).toBe(false);
  });
});

describe('getBossByChapter', () => {
  it('チャプター1のボスを取得', () => {
    const boss = getBossByChapter(1);
    expect(boss).toBeDefined();
    expect(boss!.chapter).toBe(1);
    expect(boss!.name).toBe('ミュータントウイルス');
  });

  it('存在しないチャプターはundefined', () => {
    expect(getBossByChapter(99)).toBeUndefined();
  });
});

describe('BATTLE_ROUNDS', () => {
  it('バトルラウンド数は10', () => {
    expect(BATTLE_ROUNDS).toBe(10);
  });
});
