import { describe, it, expect } from 'vitest';
import { canUseSkill, applySkillEffects, getHeroById, getHeroSkillLoadout, getHeroSkills, getSkillLearnCostMp, hasApplicableEffectInQuiz, getQuizSkillAvailability } from '../skillLogic';
import type { Skill, SkillEffect, Debuff, QuizFormat } from '../../types';

describe('canUseSkill', () => {
  const activeSkill: Skill = {
    id: 'test_skill',
    name: 'テストスキル',
    type: 'active',
    cooldown: 2,
    description: 'テスト',
    effects: [],
  };

  const ultimateSkill: Skill = {
    id: 'test_ult',
    name: 'テストULT',
    type: 'ultimate',
    cooldown: 0,
    chargeRequired: 100,
    description: 'テスト',
    effects: [],
  };

  it('クールダウン0なら使用可能', () => {
    expect(canUseSkill('test_skill', {}, 0, activeSkill)).toBe(true);
  });

  it('クールダウン中は使用不可', () => {
    expect(canUseSkill('test_skill', { test_skill: 2 }, 0, activeSkill)).toBe(false);
  });

  it('クールダウン0のエントリは使用可能', () => {
    expect(canUseSkill('test_skill', { test_skill: 0 }, 0, activeSkill)).toBe(true);
  });

  it('ウルトメイトはチャージ不足で使用不可', () => {
    expect(canUseSkill('test_ult', {}, 50, ultimateSkill)).toBe(false);
  });

  it('ウルトメイトはチャージ十分なら使用可能', () => {
    expect(canUseSkill('test_ult', {}, 100, ultimateSkill)).toBe(true);
  });

  it('ウルトメイトはチャージ超過でも使用可能', () => {
    expect(canUseSkill('test_ult', {}, 150, ultimateSkill)).toBe(true);
  });
});

describe('applySkillEffects', () => {
  it('ヒント効果', () => {
    const effects: SkillEffect[] = [{ type: 'hint', value: 1 }];
    const result = applySkillEffects(effects, []);
    expect(result.showHint).toBe(true);
  });

  it('選択肢削減', () => {
    const effects: SkillEffect[] = [{ type: 'reduce_choices', value: 2 }];
    const result = applySkillEffects(effects, []);
    expect(result.reducedChoicesBy).toBe(2);
  });

  it('ホメオスタシス回復', () => {
    const effects: SkillEffect[] = [
      { type: 'heal_homeostasis', value: 8 },
      { type: 'heal_homeostasis', value: 12, condition: 'last_was_correct' },
    ];
    const result = applySkillEffects(effects, []);
    expect(result.healHomeostasis).toBe(20); // 8 + 12
  });

  it('デバフ解除（指定条件）', () => {
    const effects: SkillEffect[] = [
      { type: 'cleanse_debuff', value: 1, condition: 'observation_miss' },
    ];
    const debuffs: Debuff[] = [
      { type: 'observation_miss', duration: 2, severity: 1 },
      { type: 'misinformation', duration: 2, severity: 1 },
    ];
    const result = applySkillEffects(effects, debuffs);
    expect(result.cleansedDebuffs).toContain('observation_miss');
  });

  it('デバフ解除（条件なし → 先頭デバフ除去）', () => {
    const effects: SkillEffect[] = [{ type: 'cleanse_debuff', value: 1 }];
    const debuffs: Debuff[] = [
      { type: 'time_pressure', duration: 3, severity: 1 },
    ];
    const result = applySkillEffects(effects, debuffs);
    expect(result.cleansedDebuffs).toContain('time_pressure');
  });

  it('時間延長', () => {
    const effects: SkillEffect[] = [{ type: 'time_extend', value: 5 }];
    const result = applySkillEffects(effects, []);
    expect(result.timeExtend).toBe(5);
  });

  it('XPブースト', () => {
    const effects: SkillEffect[] = [{ type: 'xp_boost', value: 15 }];
    const result = applySkillEffects(effects, []);
    expect(result.xpBoost).toBe(15);
  });

  it('CD減少', () => {
    const effects: SkillEffect[] = [{ type: 'reduce_cd', value: 1 }];
    const result = applySkillEffects(effects, []);
    expect(result.reducedCooldowns).toBe(1);
  });

  it('セーフネット', () => {
    const effects: SkillEffect[] = [{ type: 'safe_net', value: 1 }];
    const result = applySkillEffects(effects, []);
    expect(result.safeNet).toBe(true);
  });

  it('HoT回復バフが生成される', () => {
    const effects: SkillEffect[] = [{ type: 'hot_heal', value: 3, duration: 4 }];
    const result = applySkillEffects(effects, []);
    expect(result.hotHeal).toEqual({ amount: 3, turns: 4 });
    expect(result.newBuffs).toHaveLength(1);
    expect(result.newBuffs[0].type).toBe('hot_heal');
    expect(result.newBuffs[0].turnsRemaining).toBe(4);
  });

  it('複数エフェクトが同時に適用される', () => {
    const effects: SkillEffect[] = [
      { type: 'hint', value: 1 },
      { type: 'heal_homeostasis', value: 5 },
      { type: 'xp_boost', value: 10 },
    ];
    const result = applySkillEffects(effects, []);
    expect(result.showHint).toBe(true);
    expect(result.healHomeostasis).toBe(5);
    expect(result.xpBoost).toBe(10);
  });
});

describe('getHeroSkills', () => {
  it('ミナトのスキルを取得', () => {
    const skills = getHeroSkills('minato');
    expect(skills.length).toBeGreaterThanOrEqual(2);
    expect(skills.some((s) => s.type === 'ultimate')).toBe(true);
  });

  it('存在しないヒーローIDは空配列', () => {
    expect(getHeroSkills('unknown')).toEqual([]);
  });
});

describe('getHeroSkillLoadout', () => {
  it('旧セーブ互換: 未設定でも初期スキルが習得/装備される', () => {
    const hero = getHeroById('minato');
    expect(hero).toBeDefined();
    const loadout = getHeroSkillLoadout(hero!, null);
    expect(loadout.learnedSkillIds.length).toBeGreaterThanOrEqual(3);
    expect(loadout.equippedSkillIds.length).toBe(3);
    expect(loadout.learnedSkillIds).toContain('minato_vital_scan');
  });

  it('保存済みデータから装備を復元し、装備枠を維持する', () => {
    const hero = getHeroById('hikari');
    expect(hero).toBeDefined();
    const loadout = getHeroSkillLoadout(hero!, {
      learnedSkillIds: ['hikari_visual_mapping', 'hikari_eye_trace', 'hikari_focus_calibration', 'hikari_phase_filter'],
      equippedSkillIds: ['hikari_phase_filter', 'hikari_eye_trace', 'hikari_focus_calibration'],
    });
    expect(loadout.equippedSkillIds).toEqual([
      'hikari_phase_filter',
      'hikari_eye_trace',
      'hikari_focus_calibration',
    ]);
    expect(loadout.equippedSkills).toHaveLength(3);
  });
});

describe('getSkillLearnCostMp', () => {
  it('learnCostMpがあればそれを返す', () => {
    const skill: Skill = {
      id: 'costed',
      name: 'costed',
      type: 'active',
      cooldown: 1,
      learnCostMp: 180,
      description: 'test',
      effects: [],
    };
    expect(getSkillLearnCostMp(skill)).toBe(180);
  });

  it('learnCostMpがなければデフォルトコストを返す', () => {
    const skill: Skill = {
      id: 'default',
      name: 'default',
      type: 'active',
      cooldown: 1,
      description: 'test',
      effects: [],
    };
    expect(getSkillLearnCostMp(skill)).toBeGreaterThan(0);
  });
});

describe('hasApplicableEffectInQuiz', () => {
  const baseContext = {
    format: 'multiple_choice' as QuizFormat,
    choiceCount: 4,
    debuffs: [] as Debuff[],
    hasKeyword: true,
    hintVisible: false,
    safeNetActive: false,
    cooldowns: {},
  };

  it('選択肢削減は単一選択問題でのみ有効', () => {
    const skill: Skill = {
      id: 'reduce',
      name: 'reduce',
      type: 'active',
      cooldown: 1,
      description: 'test',
      effects: [{ type: 'reduce_choices', value: 1 }],
    };

    expect(hasApplicableEffectInQuiz(skill, baseContext)).toBe(true);
    expect(
      hasApplicableEffectInQuiz(skill, {
        ...baseContext,
        format: 'fill_blank',
      })
    ).toBe(false);
  });

  it('誤情報デバフ解除は対象デバフがあるときのみ有効', () => {
    const skill: Skill = {
      id: 'cleanse',
      name: 'cleanse',
      type: 'active',
      cooldown: 1,
      description: 'test',
      effects: [{ type: 'cleanse_debuff', value: 1, condition: 'misinformation' }],
    };

    expect(hasApplicableEffectInQuiz(skill, baseContext)).toBe(false);
    expect(
      hasApplicableEffectInQuiz(skill, {
        ...baseContext,
        debuffs: [{ type: 'misinformation', duration: 1, severity: 1 }],
      })
    ).toBe(true);
  });

  it('ヒントはキーワードがあり未表示のときのみ有効', () => {
    const skill: Skill = {
      id: 'hint',
      name: 'hint',
      type: 'active',
      cooldown: 1,
      description: 'test',
      effects: [{ type: 'hint', value: 1 }],
    };

    expect(hasApplicableEffectInQuiz(skill, baseContext)).toBe(true);
    expect(hasApplicableEffectInQuiz(skill, { ...baseContext, hintVisible: true })).toBe(false);
    expect(hasApplicableEffectInQuiz(skill, { ...baseContext, hasKeyword: false })).toBe(false);
  });
});

describe('getQuizSkillAvailability', () => {
  const baseContext = {
    format: 'multiple_choice' as QuizFormat,
    choiceCount: 4,
    debuffs: [] as Debuff[],
    hasKeyword: true,
    hintVisible: false,
    safeNetActive: false,
    cooldowns: {},
  };

  const hintSkill: Skill = {
    id: 'hint_skill',
    name: 'hint',
    type: 'active',
    cooldown: 1,
    description: 'test',
    effects: [{ type: 'hint', value: 1 }],
  };

  it('CD中は使用不可', () => {
    const result = getQuizSkillAvailability(
      'hint_skill',
      { hint_skill: 2 },
      0,
      hintSkill,
      baseContext
    );
    expect(result.usable).toBe(false);
    expect(result.reason).toContain('CD中');
  });

  it('効果がない問題では使用不可', () => {
    const result = getQuizSkillAvailability(
      'hint_skill',
      {},
      0,
      hintSkill,
      { ...baseContext, hasKeyword: false }
    );
    expect(result.usable).toBe(false);
    expect(result.reason).toContain('効果なし');
  });

  it('条件を満たせば使用可能', () => {
    const result = getQuizSkillAvailability('hint_skill', {}, 0, hintSkill, baseContext);
    expect(result.usable).toBe(true);
  });
});
