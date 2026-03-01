import type { BattleStats } from "../types";

export type TitleBonus = BattleStats;

const ZERO_BONUS: TitleBonus = { atk: 0, def: 0, spd: 0 };

const TITLE_BONUS_MAP: Record<string, TitleBonus> = {
  冒険者: { atk: 0, def: 0, spd: 0 },
  細胞博士: { atk: 2, def: 0, spd: 1 },
  ボスハンター: { atk: 4, def: 1, spd: 0 },
  入学前教育マスター: { atk: 5, def: 3, spd: 1 },
  オルガモン大師: { atk: 3, def: 3, spd: 2 },
  伝説の指揮官: { atk: 4, def: 4, spd: 2 },
  細胞マスター: { atk: 2, def: 1, spd: 0 },
  器官系の守護者: { atk: 1, def: 3, spd: 0 },
  骨格博士: { atk: 1, def: 2, spd: 1 },
  免疫の守護者: { atk: 0, def: 4, spd: 0 },
  内臓の探求者: { atk: 2, def: 2, spd: 0 },
  循環の支配者: { atk: 1, def: 2, spd: 2 },
  呼吸の達人: { atk: 1, def: 1, spd: 3 },
  感覚の覚醒者: { atk: 2, def: 0, spd: 3 },
  修了マスター: { atk: 3, def: 2, spd: 2 },
  ナースの鑑: { atk: 1, def: 3, spd: 1 },
  精密の眼: { atk: 2, def: 1, spd: 2 },
  予防の達人: { atk: 1, def: 3, spd: 1 },
  システムの匠: { atk: 2, def: 2, spd: 1 },
};

export function getTitleBonus(title: string): TitleBonus {
  return TITLE_BONUS_MAP[title] || ZERO_BONUS;
}

export function applyStatBonus(stats: BattleStats, bonus: Partial<BattleStats>): BattleStats {
  return {
    atk: Math.max(1, stats.atk + (bonus.atk || 0)),
    def: Math.max(1, stats.def + (bonus.def || 0)),
    spd: Math.max(1, stats.spd + (bonus.spd || 0)),
  };
}
