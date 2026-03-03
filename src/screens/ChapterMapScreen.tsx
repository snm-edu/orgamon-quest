import { useGameStore } from "../stores/gameStore";
import { useState, useEffect } from "react";
import { getBossByChapter } from "../logic/battleLogic";
import { ScreenLayout, GlassCard, PastelButton, ProgressBar, Badge, Modal } from "../components/common";
import { audio } from "../utils/audio";
import chapterMapBg from "../assets/chapter_map_bg.png";

const chapters = [
  { id: 1, name: "細胞の国", subtitle: "生命の始まりを守れ", emoji: "🧬", color: "#f08080" },
  { id: 2, name: "器官の国", subtitle: "バランスの守護者", emoji: "🫀", color: "#b8a9c9" },
  { id: 3, name: "骨格の国", subtitle: "崩れゆく大地", emoji: "🦴", color: "#98d4bb" },
  { id: 4, name: "体液の国", subtitle: "赤き流れの危機", emoji: "🩸", color: "#f06060" },
  { id: 5, name: "内臓の国", subtitle: "消化の迷宮", emoji: "🫁", color: "#e8a040" },
  { id: 6, name: "循環の国", subtitle: "止まらぬ鼓動", emoji: "❤️", color: "#e06080" },
  { id: 7, name: "呼吸の国", subtitle: "最後の一息", emoji: "🌬️", color: "#87ceeb" },
  { id: 8, name: "感覚の国", subtitle: "五感の試練", emoji: "🧠", color: "#d8b4fe" },
  { id: 9, name: "最終決戦", subtitle: "パンデミックの影", emoji: "👑", color: "#ffd700" },
];

type QuizMode = "mini" | "confirm";
const CHAPTERS_PER_PAGE = 2;

export default function ChapterMapScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const currentRun = useGameStore((s) => s.currentRun);
  useEffect(() => { audio.playBGM("map"); }, []);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [chapterPage, setChapterPage] = useState(0);

  if (!currentRun) return null;

  const totalPages = Math.max(1, Math.ceil(chapters.length / CHAPTERS_PER_PAGE));
  const clampedPage = Math.min(chapterPage, totalPages - 1);
  const pageStart = clampedPage * CHAPTERS_PER_PAGE;
  const visibleChapters = chapters.slice(pageStart, pageStart + CHAPTERS_PER_PAGE);
  const selectedChapter = selectedChapterId
    ? chapters.find((chapter) => chapter.id === selectedChapterId) ?? null
    : null;

  const handleStartQuiz = (chapter: number, mode: QuizMode) => {
    useGameStore.setState((s) => ({
      ...s,
      _quizChapter: chapter,
      _quizMode: mode,
    } as unknown as typeof s));
    setScreen("quiz");
  };

  const handleStartBattle = (chapter: number) => {
    useGameStore.setState((s) => ({
      ...s,
      _battleChapter: chapter,
      _storyChapter: chapter,
      _storyTiming: "pre_boss",
    } as unknown as typeof s));
    setScreen("story");
  };

  return (
    <ScreenLayout
      onBack={() => setScreen("home")}
      title="章マップ"
      titleEmoji="🗺️"
      padding="compact"
      className="h-[100dvh] flex flex-col pb-[calc(env(safe-area-inset-bottom)+0.25rem)] relative"
    >
      {/* Map background */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none z-0"
        style={{
          backgroundImage: `url(${chapterMapBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(1px)",
        }}
      />
      <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
        <GlassCard className="p-2.5 shrink-0">
          <div className="flex items-center gap-2">
            {currentRun.team.length > 0 && (
              <div className="flex-1 flex items-center gap-1.5 overflow-x-auto">
                {currentRun.team.map((c) => (
                  <Badge key={c.id} variant="default" size="xs" icon="👤">
                    {c.name} Lv.{c.level}
                  </Badge>
                ))}
              </div>
            )}
            <PastelButton
              variant="secondary"
              size="sm"
              icon="👥"
              onClick={() => setScreen("team_edit")}
              className="shrink-0"
            >
              編成
            </PastelButton>
          </div>
        </GlassCard>

        <div className="flex-1 min-h-0 grid grid-rows-2 gap-2">
          {visibleChapters.map((ch, idx) => {
            const progress = currentRun.chapterProgress[ch.id];
            const isUnlocked = progress?.unlocked ?? false;
            const mastery = progress?.mastery ?? 0;
            const bossDefeated = progress?.bossDefeated ?? false;
            const canChallenge = isUnlocked && !bossDefeated;

            return (
              <GlassCard
                key={ch.id}
                variant={isUnlocked ? "strong" : "subtle"}
                className={`p-3 h-full flex flex-col animate-slide-up ${!isUnlocked ? "opacity-40" : ""}`}
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-sm"
                    style={{ backgroundColor: ch.color + "20" }}
                  >
                    {isUnlocked ? ch.emoji : "🔒"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-[10px] text-warm-gray/40 font-medium">Ch.{ch.id}</span>
                      {bossDefeated && (
                        <Badge variant="success" size="xs">✅ クリア</Badge>
                      )}
                    </div>
                    <p className="font-bold text-warm-gray text-[14px] truncate">{ch.name}</p>
                    <p className="text-[11px] text-warm-gray/50 truncate">{ch.subtitle}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-warm-gray/40">マスタリー</p>
                    <p className="font-bold text-base leading-none" style={{ color: ch.color }}>{mastery}%</p>
                  </div>
                </div>
                <ProgressBar
                  value={mastery}
                  max={100}
                  color={ch.color}
                  size="xs"
                  className="mt-2"
                />
                <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-warm-gray/45">
                    {bossDefeated ? "ボス撃破済み" : canChallenge ? "挑戦可能" : "未開放"}
                  </div>
                  <button
                    onClick={() => isUnlocked && setSelectedChapterId(ch.id)}
                    disabled={!isUnlocked}
                    className={`px-3 py-1.5 text-[11px] rounded-lg font-bold transition-all ${isUnlocked
                      ? "bg-indigo-100/70 text-indigo-700 btn-press"
                      : "bg-gray-100 text-warm-gray/30"
                      }`}
                  >
                    {canChallenge ? "挑戦メニュー" : "章メニュー"}
                  </button>
                </div>
              </GlassCard>
            );
          })}
          {visibleChapters.length < CHAPTERS_PER_PAGE &&
            Array.from({ length: CHAPTERS_PER_PAGE - visibleChapters.length }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="rounded-2xl border-2 border-dashed border-white/50 bg-white/20 grid place-items-center text-[11px] text-warm-gray/30"
              >
                章データなし
              </div>
            ))}
        </div>

        <GlassCard className="p-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setChapterPage((prev) => Math.max(0, Math.min(prev, totalPages - 1) - 1))}
              disabled={clampedPage === 0}
              className={`flex-1 min-h-10 rounded-lg text-sm font-bold ${clampedPage === 0
                ? "bg-gray-100 text-warm-gray/30"
                : "bg-indigo-100/70 text-indigo-700 btn-press"
                }`}
            >
              ← 前へ
            </button>
            <p className="text-[11px] text-warm-gray/50 shrink-0 min-w-16 text-center">
              {clampedPage + 1}/{totalPages}
            </p>
            <button
              onClick={() =>
                setChapterPage((prev) =>
                  Math.min(totalPages - 1, Math.min(prev, totalPages - 1) + 1)
                )
              }
              disabled={clampedPage >= totalPages - 1}
              className={`flex-1 min-h-10 rounded-lg text-sm font-bold ${clampedPage >= totalPages - 1
                ? "bg-gray-100 text-warm-gray/30"
                : "bg-indigo-100/70 text-indigo-700 btn-press"
                }`}
            >
              次へ →
            </button>
          </div>
        </GlassCard>
      </div>

      <Modal
        open={!!selectedChapter}
        onClose={() => setSelectedChapterId(null)}
        position="bottom"
        showHandle
      >
        {selectedChapter && (
          <div>
            {(() => {
              const progress = currentRun.chapterProgress[selectedChapter.id];
              const isUnlocked = progress?.unlocked ?? false;
              const mastery = progress?.mastery ?? 0;
              const bossDefeated = progress?.bossDefeated ?? false;
              const boss = getBossByChapter(selectedChapter.id);
              const canBossBattle =
                isUnlocked &&
                !bossDefeated &&
                ((progress?.miniQuizBest ?? 0) >= 50 || (progress?.confirmQuizBest ?? 0) >= 50);
              return (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: selectedChapter.color + "20" }}
                    >
                      {isUnlocked ? selectedChapter.emoji : "🔒"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-warm-gray/40">Ch.{selectedChapter.id}</p>
                      <p className="text-base font-bold text-warm-gray truncate">{selectedChapter.name}</p>
                      <p className="text-[11px] text-warm-gray/50 truncate">{selectedChapter.subtitle}</p>
                    </div>
                  </div>

                  <GlassCard className="p-3 mb-3 !bg-white/55">
                    <p className="text-[11px] text-warm-gray/50 mb-1">進行状況</p>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-warm-gray">マスタリー {mastery}%</span>
                      {bossDefeated && <Badge variant="success" size="xs">ボス撃破済み</Badge>}
                    </div>
                    <ProgressBar
                      value={mastery}
                      max={100}
                      color={selectedChapter.color}
                      size="xs"
                    />
                    <div className="flex gap-3 text-[10px] text-warm-gray/40 mt-2">
                      <span>📝 小テスト最高: {progress?.miniQuizBest ?? 0}%</span>
                      <span>📋 確認テスト最高: {progress?.confirmQuizBest ?? 0}%</span>
                    </div>
                  </GlassCard>

                  <div className="grid grid-cols-2 gap-2">
                    <PastelButton
                      variant="secondary"
                      size="sm"
                      icon="📝"
                      onClick={() => {
                        setSelectedChapterId(null);
                        handleStartQuiz(selectedChapter.id, "mini");
                      }}
                      disabled={!isUnlocked}
                    >
                      小テスト
                    </PastelButton>
                    <PastelButton
                      gradient="coral"
                      size="sm"
                      icon="📋"
                      onClick={() => {
                        setSelectedChapterId(null);
                        handleStartQuiz(selectedChapter.id, "confirm");
                      }}
                      disabled={!isUnlocked}
                    >
                      確認テスト
                    </PastelButton>
                  </div>

                  {boss && (
                    <PastelButton
                      fullWidth
                      size="sm"
                      className="mt-2"
                      variant={bossDefeated ? "success" : canBossBattle ? "primary" : "secondary"}
                      gradient="coral"
                      icon={bossDefeated ? "✅" : canBossBattle ? "⚔️" : "🔒"}
                      disabled={!canBossBattle || bossDefeated}
                      onClick={() => {
                        if (!canBossBattle) return;
                        setSelectedChapterId(null);
                        handleStartBattle(selectedChapter.id);
                      }}
                    >
                      {bossDefeated
                        ? `${boss.name} 撃破済み`
                        : canBossBattle
                          ? `ボス戦: ${boss.name}`
                          : "テストで50%以上で解放"}
                    </PastelButton>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </Modal>
    </ScreenLayout>
  );
}
