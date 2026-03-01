# HANDOFF NEXT CHAT

Last updated: 2026-02-20 08:46 JST
Project: `/Users/ny/Documents/Codex/入学前教育/orgamon-quest`

## 1. Current status (implemented)

- Quiz formats 5 types are integrated in `QuizScreen`:
  - `multiple_choice`, `fill_blank`, `speed`, `sort`, `true_false`
- Skill learning + loadout system is implemented:
  - Learn skills by spending MP
  - Swap equipped skills within current max slot size (3)
  - Quiz/Battle use equipped skills only
  - Backward compatibility for old save data (missing fields auto-normalized)
- Battle stat system is implemented:
  - `ATK / DEF / SPD`
  - Speed-based turn queue
  - Position-based stat multipliers
  - Title-based stat bonus applied
- Team formation improvements:
  - Leader is no longer fixed
  - Full 1st/2nd/3rd order can be rearranged (including hero)
  - Formation order persists in `battleFormationIds`
- Battle immersion updates:
  - Party cards shown in battle
  - Incoming-damage target card reacts with hit animation and `被弾!`
- Mobile-oriented Team Edit UI update:
  - Designed as non-scroll selection flow with paging for companion candidates

## 2. Data model additions

- `UserCurrentRun`:
  - `learnedSkillIds?: string[]`
  - `equippedSkillIds?: string[]`
  - `battleFormationIds?: string[]`
- `Skill`:
  - `learnCostMp?: number`
- `Hero`:
  - `learnableSkills?: Skill[]`

## 3. Validation results

- `npm test`: PASS (95 tests)
- `npm run build`: PASS
- `npm run lint`: 0 errors / 4 warnings
  - Existing warnings only (`react-hooks/exhaustive-deps`) in:
    - `src/screens/BattleScreen.tsx`
    - `src/screens/ResultScreen.tsx`

## 4. Key files touched recently

- `/Users/ny/Documents/Codex/入学前教育/orgamon-quest/src/types/index.ts`
- `/Users/ny/Documents/Codex/入学前教育/orgamon-quest/src/data/heroes.json`
- `/Users/ny/Documents/Codex/入学前教育/orgamon-quest/src/data/companions.json`
- `/Users/ny/Documents/Codex/入学前教育/orgamon-quest/src/logic/skillLogic.ts`
- `/Users/ny/Documents/Codex/入学前教育/orgamon-quest/src/logic/formationLogic.ts`
- `/Users/ny/Documents/Codex/入学前教育/orgamon-quest/src/logic/titleLogic.ts`
- `/Users/ny/Documents/Codex/入学前教育/orgamon-quest/src/logic/battleLogic.ts`
- `/Users/ny/Documents/Codex/入学前教育/orgamon-quest/src/stores/gameStore.ts`
- `/Users/ny/Documents/Codex/入学前教育/orgamon-quest/src/screens/ProfileScreen.tsx`
- `/Users/ny/Documents/Codex/入学前教育/orgamon-quest/src/screens/TeamEditScreen.tsx`
- `/Users/ny/Documents/Codex/入学前教育/orgamon-quest/src/screens/QuizScreen.tsx`
- `/Users/ny/Documents/Codex/入学前教育/orgamon-quest/src/screens/BattleScreen.tsx`
- `/Users/ny/Documents/Codex/入学前教育/orgamon-quest/src/screens/ResultScreen.tsx`
- `/Users/ny/Documents/Codex/入学前教育/orgamon-quest/src/screens/ZukanScreen.tsx`
- `/Users/ny/Documents/Codex/入学前教育/orgamon-quest/src/logic/__tests__/skillLogic.test.ts`
- `/Users/ny/Documents/Codex/入学前教育/orgamon-quest/src/logic/__tests__/formationLogic.test.ts`
- `/Users/ny/Documents/Codex/入学前教育/orgamon-quest/src/logic/__tests__/comboLogic.test.ts`

## 5. Open items / next recommended tasks

- Real-device UX pass for Team Edit and Battle (small-screen tap targets and font size checks)
- Optional: fine-tune position multipliers and skill learn MP costs
- Optional (production track): add cloud save with Auth + DB (Supabase/Firebase)

## 6. Next-chat handoff prompt (copy-paste)

```text
/Users/ny/Documents/Codex/入学前教育/orgamon-quest で続き実装してください。

前提:
- 5種類クイズ、スキル習得/入替、ATK/DEF/SPD、素早さ行動順、称号補正、可変リーダー編成は実装済み
- 編成順は battleFormationIds で保持し、BattleScreen へ反映済み
- npm test / npm run build は通過、lint は 0 errors / 4 warnings（既存 warning）

まず読むファイル:
- /Users/ny/Documents/Codex/入学前教育/orgamon-quest/HANDOFF_NEXT_CHAT.md

今回やること:
1) スマホ実機向けの最終UI調整（TeamEdit/Battle）
2) タップ領域・フォント・画面内収まりの改善
3) 必要なら倍率/コストのバランス微調整
4) 実装後に npm test / npm run build / npm run lint を実行して結果報告
5) 変更点をファイル単位で要約
```

## 7. Optional prompt (if starting production cloud-save work)

```text
/Users/ny/Documents/Codex/入学前教育/orgamon-quest で、外部高校生向け本番運用の準備を進めてください（まだ実装は最小限）。

要件:
- Supabase Auth + DB を前提に、既存 localStorage 構造からの移行設計を作成
- テーブル設計、RLS方針、同期タイミング（章クリア/戦闘終了/設定変更時）を具体化
- 既存 UserCurrentRun / meta / collection のマッピング表を作成
- 実装タスクを優先度順に分解
- docs 配下に設計書を保存
```
