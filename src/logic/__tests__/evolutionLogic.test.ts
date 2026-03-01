import { describe, it, expect } from 'vitest';
import {
  canEvolveCard,
  getCardAttackBonus,
  getEvolutionMultiplier,
  getEvolutionCost,
} from '../evolutionLogic';
import type { OwnedCard } from '../../types';

describe('getCardAttackBonus', () => {
  it('stage0 = 0', () => expect(getCardAttackBonus(0)).toBe(0));
  it('stage1 = 5', () => expect(getCardAttackBonus(1)).toBe(5));
  it('stage2 = 12', () => expect(getCardAttackBonus(2)).toBe(12));
  it('stage3 = 25', () => expect(getCardAttackBonus(3)).toBe(25));
  it('範囲外 = 0', () => expect(getCardAttackBonus(99)).toBe(0));
});

describe('getEvolutionMultiplier', () => {
  it('stage0 = 1.0', () => expect(getEvolutionMultiplier(0)).toBe(1.0));
  it('stage1 = 1.2', () => expect(getEvolutionMultiplier(1)).toBe(1.2));
  it('stage2 = 1.5', () => expect(getEvolutionMultiplier(2)).toBe(1.5));
  it('stage3 = 2.0', () => expect(getEvolutionMultiplier(3)).toBe(2.0));
  it('範囲外 = 1.0', () => expect(getEvolutionMultiplier(5)).toBe(1.0));
});

describe('canEvolveCard', () => {
  it('stage0→1: レベル5以上 & 100MP以上で進化可能', () => {
    const card: OwnedCard = { stage: 0, count: 1, skin: 'normal' };
    const result = canEvolveCard(card, 5, 100, {});
    expect(result.canEvolve).toBe(true);
  });

  it('stage0→1: レベル不足で進化不可', () => {
    const card: OwnedCard = { stage: 0, count: 1, skin: 'normal' };
    const result = canEvolveCard(card, 3, 100, {});
    expect(result.canEvolve).toBe(false);
    expect(result.reason).toContain('レベル');
  });

  it('stage0→1: MP不足で進化不可', () => {
    const card: OwnedCard = { stage: 0, count: 1, skin: 'normal' };
    const result = canEvolveCard(card, 5, 50, {});
    expect(result.canEvolve).toBe(false);
    expect(result.reason).toContain('MP');
  });

  it('stage1→2: evolution_stoneが必要', () => {
    const card: OwnedCard = { stage: 1, count: 1, skin: 'normal' };
    const withItem = canEvolveCard(card, 10, 200, { evolution_stone: 1 });
    expect(withItem.canEvolve).toBe(true);

    const withoutItem = canEvolveCard(card, 10, 200, {});
    expect(withoutItem.canEvolve).toBe(false);
    expect(withoutItem.reason).toContain('evolution_stone');
  });

  it('stage2→3: evolution_stone + bond_fragmentが必要', () => {
    const card: OwnedCard = { stage: 2, count: 1, skin: 'normal' };
    const result = canEvolveCard(card, 15, 350, {
      evolution_stone: 1,
      bond_fragment: 1,
    });
    expect(result.canEvolve).toBe(true);
  });

  it('stage3は最大段階なので進化不可', () => {
    const card: OwnedCard = { stage: 3, count: 1, skin: 'normal' };
    const result = canEvolveCard(card, 20, 999, {
      evolution_stone: 10,
      bond_fragment: 10,
    });
    expect(result.canEvolve).toBe(false);
    expect(result.reason).toContain('最大');
  });
});

describe('getEvolutionCost', () => {
  it('stage0: level5, mp100, items空', () => {
    const cost = getEvolutionCost(0);
    expect(cost.level).toBe(5);
    expect(cost.mp).toBe(100);
    expect(cost.items).toEqual([]);
  });

  it('stage1: level10, mp200, evolution_stone', () => {
    const cost = getEvolutionCost(1);
    expect(cost.level).toBe(10);
    expect(cost.mp).toBe(200);
    expect(cost.items).toContain('evolution_stone');
  });

  it('stage2: level15, mp350, evolution_stone+bond_fragment', () => {
    const cost = getEvolutionCost(2);
    expect(cost.level).toBe(15);
    expect(cost.mp).toBe(350);
    expect(cost.items).toContain('evolution_stone');
    expect(cost.items).toContain('bond_fragment');
  });
});
