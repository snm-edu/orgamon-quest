import { useState } from "react";
import { useGameStore } from "../stores/gameStore";
import { useMetaStore } from "../stores/metaStore";
import { useCollectionStore } from "../stores/collectionStore";
import { useDailyStore } from "../stores/dailyStore";
import { isValidPasswordFormat } from "../logic/passwordLogic";
import { ScreenLayout, GlassCard, PastelButton, Badge } from "../components/common";
import TutorialModal from "../components/TutorialModal";
import companionsData from "../data/companions.json";
import cardsData from "../data/cards.json";
import itemsData from "../data/items.json";
import type { Companion, Card } from "../types";

export default function SettingsScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const difficulty = useGameStore((s) => s.difficulty);
  const setDifficulty = useGameStore((s) => s.setDifficulty);
  const resetRun = useGameStore((s) => s.resetRun);
  const currentRun = useGameStore((s) => s.currentRun);
  const unlockChapter = useGameStore((s) => s.unlockChapter);

  const meta = useMetaStore((s) => s.meta);
  const addExternalPassword = useMetaStore((s) => s.addExternalPassword);
  const collection = useCollectionStore((s) => s.collection);
  const resetCollection = useCollectionStore((s) => s.resetCollection);
  const resetMeta = useMetaStore((s) => s.resetMeta);
  const resetDaily = useDailyStore((s) => s.resetDaily);

  const [passwordInput, setPasswordInput] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const specialUnlocked = collection.passwordUnlocked && meta.externalPasswords.length >= 3;

  const difficulties = [
    { id: "easy" as const, label: "イージー", desc: "CD-1、ペナルティ小、ホメオスタシス初期80", emoji: "🌸", color: "#98d4bb" },
    { id: "normal" as const, label: "ノーマル", desc: "標準設定、ホメオスタシス初期60", emoji: "⚔️", color: "#f0c040" },
    { id: "hard" as const, label: "ハード", desc: "時間圧増加、状態異常頻発、ホメオスタシス初期50", emoji: "🔥", color: "#f08080" },
  ];

  const handlePasswordSubmit = () => {
    const trimmed = passwordInput.trim().toUpperCase();
    if (!trimmed) return;

    if (trimmed === "SNM8018343") {
      for (let i = 1; i <= 9; i++) unlockChapter(i);

      useGameStore.setState((s) => {
        if (!s.currentRun) return s;
        const heroId = s.currentRun.selectedHeroId;

        const allCompanions = (companionsData as Companion[]).filter(
          (c) => !(c.type === "hero" && c.heroRef === heroId)
        );
        const maxedCompanions = allCompanions.map((c) => ({
          ...c,
          level: 99,
          exp: 99999,
          evolutionStage: Math.max(0, (c.evolutionLine?.length || 1) - 1),
        }));

        const allCards = cardsData as Card[];
        const maxedCards: Record<string, { stage: number; count: number; skin: string }> = {};
        for (const card of allCards) {
          maxedCards[card.id] = {
            stage: Math.max(0, (card.evolutionLine?.length || 1) - 1),
            count: 5,
            skin: "normal",
          };
        }

        const allItems = itemsData as { id: string }[];
        const maxedItems: Record<string, number> = {};
        for (const item of allItems) {
          maxedItems[item.id] = 99;
        }

        const cp = { ...s.currentRun.chapterProgress };
        for (let i = 1; i <= 9; i++) {
          if (cp[i]) {
            cp[i] = { ...cp[i], unlocked: true, bossDefeated: true, mastery: 100, miniQuizBest: 100, confirmQuizBest: 100 };
          }
        }

        return {
          currentRun: {
            ...s.currentRun,
            level: 99,
            totalXP: 999999,
            mp: 99999,
            fragments: 9999,
            captureEnergy: 999,
            team: maxedCompanions.filter((c) => c.type === "hero"),
            ownedCompanions: maxedCompanions,
            ownedCards: maxedCards,
            ownedItems: maxedItems,
            chapterProgress: cp,
          },
        };
      });

      setMsg("🔧 開発者モード：全解放・全仲間/カード/アイテムMAX化！", false);
      setPasswordInput("");
      return;
    }

    if (!isValidPasswordFormat(trimmed)) {
      setMsg("パスワードの形式が正しくありません", true);
      return;
    }
    if (meta.externalPasswords.includes(trimmed)) {
      setMsg("このパスワードは登録済みです", true);
      return;
    }
    const success = addExternalPassword(trimmed);
    if (success) {
      setMsg("パスワードを登録しました！", false);
      setPasswordInput("");
    } else {
      setMsg("無効なパスワードです", true);
    }
  };

  const setMsg = (text: string, isError: boolean) => {
    setPasswordMessage({ text, isError });
    setTimeout(() => setPasswordMessage(null), 3000);
  };

  const handleFullReset = () => {
    if (confirm("全てのデータ（図鑑・実績含む）をリセットしますか？\nこの操作は取り消せません。")) {
      resetRun();
      resetCollection();
      resetMeta();
      resetDaily();
    }
  };

  return (
    <ScreenLayout
      onBack={() => setScreen(currentRun ? "home" : "title")}
      title="せってい"
      titleEmoji="⚙️"
    >
      {/* Tutorial */}
      <GlassCard variant="strong" className="p-5 mb-4 !bg-gradient-to-r !from-pastel-blue/20 !to-pastel-purple/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-100/60 flex items-center justify-center text-2xl shadow-sm shrink-0">
            📖
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-warm-gray">チュートリアル</h3>
            <p className="text-[11px] text-warm-gray/50 mt-0.5">ゲームの遊び方・画面の見方を確認</p>
          </div>
          <PastelButton
            variant="primary"
            size="sm"
            icon="▶"
            onClick={() => setShowTutorial(true)}
          >
            見る
          </PastelButton>
        </div>
      </GlassCard>

      {/* Difficulty */}
      <GlassCard variant="strong" className="p-5 mb-4">
        <h3 className="text-sm font-bold text-warm-gray mb-3">🎯 難易度</h3>
        <div className="space-y-2">
          {difficulties.map((d) => (
            <button
              key={d.id}
              onClick={() => setDifficulty(d.id)}
              className={`w-full text-left p-3 rounded-xl transition-all btn-press ${difficulty === d.id
                  ? "bg-white/90 ring-2 shadow-sm"
                  : "bg-white/40 hover:bg-white/60"
                }`}
              style={difficulty === d.id ? { boxShadow: `0 0 0 2px ${d.color}` } : {}}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{d.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm text-warm-gray">{d.label}</p>
                  <p className="text-[11px] text-warm-gray/50 leading-relaxed">{d.desc}</p>
                </div>
                {difficulty === d.id && (
                  <span className="text-sm font-bold" style={{ color: d.color }}>✓</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Own password */}
      {collection.passwordUnlocked && collection.password && (
        <GlassCard className="p-5 mb-4 !bg-gradient-to-r !from-pastel-yellow/30 !to-pastel-green/20">
          <h3 className="text-sm font-bold text-warm-gray mb-2">🏆 隠しパスワード獲得！</h3>
          <p className="text-[11px] text-warm-gray/50 mb-3">
            図鑑コンプ100%達成のご褒美です。他のゲームで入力しよう！
          </p>
          <div className="glass-strong rounded-xl p-3 flex items-center gap-3">
            <p className="font-mono font-bold text-warm-gray flex-1 text-center tracking-widest">
              {showPassword ? collection.password : "●●●●●●●●●●●●"}
            </p>
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="text-[11px] text-coral shrink-0 font-medium"
            >
              {showPassword ? "隠す" : "表示"}
            </button>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(collection.password!); alert("コピーしました！"); }}
            className="w-full mt-2 text-[11px] text-coral/60 hover:text-coral transition-colors"
          >
            📋 コピー
          </button>
        </GlassCard>
      )}

      {/* Password input */}
      <GlassCard variant="strong" className="p-5 mb-4">
        <h3 className="text-sm font-bold text-warm-gray mb-2">🔑 パスワード入力</h3>
        <p className="text-[11px] text-warm-gray/40 mb-3">
          他のゲームで獲得したパスワードを入力できます
        </p>

        {meta.externalPasswords.length > 0 && (
          <div className="mb-3 space-y-1">
            <p className="text-[10px] text-warm-gray/30">登録済み</p>
            {meta.externalPasswords.map((p, i) => (
              <div key={i} className="bg-pastel-green/15 rounded-lg px-3 py-1.5 flex items-center gap-2">
                <Badge variant="success" size="xs">✓</Badge>
                <span className="text-xs font-mono text-green-700">{p}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value.toUpperCase())}
            placeholder="パスワードを入力..."
            className="flex-1 px-3 py-2.5 bg-white rounded-xl border border-gray-200/60 text-sm text-warm-gray placeholder:text-warm-gray/25 font-mono focus:outline-none focus:border-coral transition-colors"
          />
          <PastelButton
            size="sm"
            gradient="coral"
            disabled={!passwordInput.trim()}
            onClick={handlePasswordSubmit}
          >
            登録
          </PastelButton>
        </div>

        {passwordMessage && (
          <p className={`text-[11px] mt-2 ${passwordMessage.isError ? "text-red-400" : "text-green-600"}`}>
            {passwordMessage.text}
          </p>
        )}

        <div className="mt-3 p-2.5 rounded-lg bg-white/40">
          <div className="flex items-center gap-2">
            <span className="text-sm">{specialUnlocked ? "🌟" : "🔒"}</span>
            <span className="text-[11px] text-warm-gray/50">
              スペシャルゲーム: {specialUnlocked ? "解放済み！" : `${meta.externalPasswords.length + (collection.passwordUnlocked ? 1 : 0)}/4 パスワード`}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Data management */}
      <GlassCard className="p-5 mb-4">
        <h3 className="text-sm font-bold text-warm-gray mb-3">📦 データ管理</h3>
        <div className="space-y-2">
          {currentRun && (
            <button
              onClick={() => { if (confirm("現在のプレイデータをリセットしますか？（図鑑・実績は保持されます）")) resetRun(); }}
              className="w-full py-3 bg-orange-50/80 text-orange-400 rounded-xl font-medium text-sm hover:bg-orange-100 transition-colors btn-press"
            >
              🔄 プレイデータをリセット
            </button>
          )}
          <button
            onClick={handleFullReset}
            className="w-full py-3 bg-red-50/80 text-red-400 rounded-xl font-medium text-sm hover:bg-red-100 transition-colors btn-press"
          >
            🗑️ 全データを完全リセット
          </button>
        </div>
      </GlassCard>

      {/* Stats */}
      <GlassCard className="p-4 mb-4 !bg-white/30">
        <h3 className="text-sm font-bold text-warm-gray mb-2">📊 統計</h3>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-warm-gray/50">
          <div className="flex items-center gap-1.5"><span>🏆</span> クリア回数: {meta.totalClears}</div>
          <div className="flex items-center gap-1.5"><span>🎖️</span> 実績: {Object.values(meta.achievements).filter(Boolean).length}</div>
          <div className="flex items-center gap-1.5"><span>📚</span> 図鑑コンプ率: {collection.completionRate}%</div>
          <div className="flex items-center gap-1.5"><span>🏅</span> 称号数: {meta.titles.length}</div>
        </div>
      </GlassCard>

      {/* Footer */}
      <div className="text-center py-4 text-[10px] text-warm-gray/25 space-y-1">
        <p>オルガモン図鑑クエスト v1.0</p>
        <p>© 2026 入学前教育プロジェクト</p>
      </div>

      <TutorialModal open={showTutorial} onClose={() => setShowTutorial(false)} />
    </ScreenLayout>
  );
}
