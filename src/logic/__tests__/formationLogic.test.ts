import { describe, expect, it } from "vitest";
import type { Companion, Hero, Skill } from "../../types";
import {
  buildFormation,
  buildSpeedTurnQueue,
  getPartyDefense,
  normalizeBattleFormationIds,
} from "../formationLogic";

const dummySkill: Skill = {
  id: "dummy",
  name: "dummy",
  type: "active",
  cooldown: 0,
  description: "dummy",
  effects: [],
};

const hero: Hero = {
  id: "minato",
  name: "ミナト",
  profession: "test",
  concept: "test",
  themeColor: "#fff",
  themeColorClass: "coral",
  baseStats: { atk: 20, def: 20, spd: 15 },
  skills: [dummySkill],
  passive: { ...dummySkill, type: "passive" },
  ultimate: { ...dummySkill, id: "ult", type: "ultimate", chargeRequired: 5 },
  evolutionLine: [],
};

const companions: Companion[] = [
  {
    id: "comp_1",
    name: "速い仲間",
    heroRef: undefined,
    type: "researcher",
    rarity: "Rare",
    level: 1,
    exp: 0,
    baseStats: { hp: 80, atk: 14, def: 12, spd: 22 },
    skills: [],
    evolutionLine: [],
    evolutionStage: 0,
  },
  {
    id: "comp_2",
    name: "遅い仲間",
    heroRef: undefined,
    type: "guardian",
    rarity: "Common",
    level: 1,
    exp: 0,
    baseStats: { hp: 110, atk: 10, def: 24, spd: 9 },
    skills: [],
    evolutionLine: [],
    evolutionStage: 0,
  },
];

describe("formationLogic", () => {
  it("称号ボーナスとポジション補正を適用した編成を作る", () => {
    const formation = buildFormation(hero, companions, "ボスハンター");
    expect(formation).toHaveLength(3);
    expect(formation[0].effectiveStats.atk).toBeGreaterThan(hero.baseStats.atk);
    expect(formation[2].effectiveStats.def).toBeGreaterThan(companions[1].baseStats.def);
  });

  it("素早さが高いメンバーほど行動順に多く出る", () => {
    const formation = buildFormation(hero, companions, "冒険者");
    const queue = buildSpeedTurnQueue(formation, 9);
    const fastTurns = queue.filter((id) => id === "comp_1").length;
    const slowTurns = queue.filter((id) => id === "comp_2").length;
    expect(fastTurns).toBeGreaterThan(slowTurns);
  });

  it("平均防御値を返す", () => {
    const formation = buildFormation(hero, companions, "冒険者");
    const defense = getPartyDefense(formation);
    expect(defense).toBeGreaterThan(0);
  });

  it("保存済みの並び順を優先しつつ不足メンバーを補完する", () => {
    const ids = normalizeBattleFormationIds("minato", companions, ["comp_2", "minato"]);
    expect(ids).toEqual(["comp_2", "minato", "comp_1"]);
  });

  it("並び順指定で1番手が変わる", () => {
    const formation = buildFormation(hero, companions, "冒険者", [
      "comp_1",
      "minato",
      "comp_2",
    ]);
    expect(formation[0].id).toBe("comp_1");
    expect(formation[1].id).toBe("minato");
  });
});
