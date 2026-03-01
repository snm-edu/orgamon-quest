import { describe, it, expect } from 'vitest';
import { checkTeamCombo, getComboBonus, applyComboEffects, getAllCombos } from '../comboLogic';
import type { Companion } from '../../types';

const makeCompanion = (heroRef?: string): Companion => ({
  id: heroRef ? `companion_${heroRef}` : 'npc_1',
  name: 'テスト仲間',
  heroRef: heroRef as Companion['heroRef'],
  type: 'hero',
  rarity: 'Epic',
  level: 1,
  exp: 0,
  baseStats: { hp: 100, atk: 20, def: 15, spd: 16 },
  skills: [],
  evolutionLine: [],
  evolutionStage: 0,
});

describe('checkTeamCombo', () => {
  it('ミナト+レオンでショック対応ラインコンボ発動', () => {
    const team = [makeCompanion('leon')];
    const combo = checkTeamCombo('minato', team);
    expect(combo).not.toBeNull();
    expect(combo!.id).toBe('minato_leon');
    expect(combo!.name).toBe('ショック対応ライン');
  });

  it('ヒカリ+コトハで観察と予防のループ発動', () => {
    const team = [makeCompanion('kotoha')];
    const combo = checkTeamCombo('hikari', team);
    expect(combo).not.toBeNull();
    expect(combo!.id).toBe('hikari_kotoha');
  });

  it('4人揃うと多職種カンファレンス発動（最優先）', () => {
    const team = [
      makeCompanion('hikari'),
      makeCompanion('kotoha'),
      makeCompanion('leon'),
    ];
    const combo = checkTeamCombo('minato', team);
    expect(combo).not.toBeNull();
    expect(combo!.id).toBe('all_four');
  });

  it('コンボ条件を満たさないチームはnull', () => {
    const team = [makeCompanion()]; // heroRefなし
    const combo = checkTeamCombo('minato', team);
    expect(combo).toBeNull();
  });

  it('ヒーロー単体ではコンボなし', () => {
    const combo = checkTeamCombo('minato', []);
    expect(combo).toBeNull();
  });
});

describe('getComboBonus', () => {
  it('コンボなしは0', () => {
    expect(getComboBonus(null)).toBe(0);
  });

  it('heal_homeostasisエフェクトの値を合計', () => {
    const combo = getAllCombos().find((c) => c.id === 'minato_leon');
    expect(combo).toBeDefined();
    const bonus = getComboBonus(combo!);
    expect(bonus).toBe(6);
  });
});

describe('applyComboEffects', () => {
  it('minato_leonコンボ: ホメオスタシス回復+6', () => {
    const combo = getAllCombos().find((c) => c.id === 'minato_leon')!;
    const effects = applyComboEffects(combo);
    expect(effects.healHomeostasis).toBe(6);
  });

  it('hikari_kotohaコンボ: 誤情報ブロック + XPブースト', () => {
    const combo = getAllCombos().find((c) => c.id === 'hikari_kotoha')!;
    const effects = applyComboEffects(combo);
    expect(effects.blockMisinformation).toBe(true);
    expect(effects.xpBoost).toBe(10);
  });

  it('all_fourコンボ: 選択肢削減 + CD減少', () => {
    const combo = getAllCombos().find((c) => c.id === 'all_four')!;
    const effects = applyComboEffects(combo);
    expect(effects.reduceChoices).toBe(2);
    expect(effects.reduceCooldowns).toBe(1);
  });
});
