import { Fragment, useState, useEffect, useCallback, useRef } from "react";
import { useGameStore } from "../stores/gameStore";
import { useDailyStore } from "../stores/dailyStore";
import {
  getRandomQuestionsGuaranteed,
  calculateQuizRewards,
  calculateMastery,
  applyReduceChoices,
  shuffleChoices,
  getEffectiveDifficulty,
} from "../logic/quizLogic";
import { getHeroById, applySkillEffects, getHeroSkillLoadout, getQuizSkillAvailability } from "../logic/skillLogic";
import { ProgressBar, Badge, Modal } from "../components/common";
import { audio } from "../utils/audio";
import type { Question, QuizResult, Skill, Debuff } from "../types";

const QUESTIONS_PER_ROUND = 5;
const BASE_TIME_LIMIT = 30;
const SPEED_TIME_LIMIT = 5;

type SingleChoiceFormat = "multiple_choice" | "speed" | "true_false";
type BlankDefinition = {
  position: number;
  answer: string;
  options: string[];
};

const FORMAT_LABELS: Record<Question["format"], string> = {
  multiple_choice: "選択式",
  fill_blank: "穴埋め",
  speed: "スピード",
  sort: "並び替え",
  true_false: "○×",
};

const DIFFICULTY_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  easy: { label: "やさしい", emoji: "🌸", color: "text-emerald-500" },
  normal: { label: "ふつう", emoji: "⚔️", color: "text-amber-500" },
  hard: { label: "むずかしい", emoji: "🔥", color: "text-red-500" },
};

function isSingleChoiceFormat(format: Question["format"]): format is SingleChoiceFormat {
  return format === "multiple_choice" || format === "speed" || format === "true_false";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getSingleChoiceData(question: Question): { choices: string[]; answerIndex: number } {
  const fallbackChoices = question.choices.length > 0 ? [...question.choices] : ["データ不足"];

  if (question.format === "true_false") {
    const tfChoices =
      fallbackChoices.length >= 2
        ? fallbackChoices.slice(0, 2)
        : ["正しい", "誤り"];
    const tfAnswerIndex = clamp(question.answerIndex, 0, tfChoices.length - 1);
    return { choices: tfChoices, answerIndex: tfAnswerIndex };
  }

  const answerIndex = clamp(question.answerIndex, 0, fallbackChoices.length - 1);
  return { choices: fallbackChoices, answerIndex };
}

function getBlankDefinitions(question: Question): BlankDefinition[] {
  if (question.blanks && question.blanks.length > 0) {
    return [...question.blanks]
      .sort((a, b) => a.position - b.position)
      .map((blank) => ({
        position: blank.position,
        answer: blank.answer,
        options: blank.options.length > 0 ? blank.options : question.choices,
      }));
  }

  const fallbackAnswer = question.choices[question.answerIndex] || "";
  const fallbackOptions = question.choices.length > 0 ? question.choices : [fallbackAnswer];

  return [
    {
      position: 0,
      answer: fallbackAnswer,
      options: fallbackOptions,
    },
  ];
}

function getSortCorrectOrder(question: Question): string[] {
  if (question.sortAnswer && question.sortAnswer.length > 0) {
    const ordered = question.sortAnswer
      .map((choiceIndex) => question.choices[choiceIndex])
      .filter((choice): choice is string => typeof choice === "string");

    if (ordered.length > 0) {
      return ordered;
    }
  }

  return [...question.choices];
}

function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase();
}

function getDebuffLabel(type: Debuff["type"]): string {
  switch (type) {
    case "observation_miss":
      return "👁️ 観察ミス";
    case "misinformation":
      return "❌ 誤情報";
    case "time_pressure":
      return "⏰ 時間圧迫";
    case "equipment_malfunction":
      return "🔧 機器故障";
    default:
      return "🔧 デバフ";
  }
}

export default function QuizScreen() {
  const currentRun = useGameStore((s) => s.currentRun);
  const setScreen = useGameStore((s) => s.setScreen);
  const addXP = useGameStore((s) => s.addXP);
  const addMP = useGameStore((s) => s.addMP);
  const addCaptureEnergy = useGameStore((s) => s.addCaptureEnergy);
  const addFragments = useGameStore((s) => s.addFragments);
  const addWrongAnswer = useGameStore((s) => s.addWrongAnswer);
  const incrementStreak = useGameStore((s) => s.incrementStreak);
  const resetStreak = useGameStore((s) => s.resetStreak);
  const tickCooldowns = useGameStore((s) => s.tickCooldowns);
  const tickDebuffs = useGameStore((s) => s.tickDebuffs);
  const tickBuffs = useGameStore((s) => s.tickBuffs);
  const triggerSkillCooldown = useGameStore((s) => s.useSkill);
  const addUltimateCharge = useGameStore((s) => s.addUltimateCharge);
  const resetUltimateCharge = useGameStore((s) => s.resetUltimateCharge);
  const removeDebuff = useGameStore((s) => s.removeDebuff);
  const addHomeostasis = useGameStore((s) => s.addHomeostasis);
  const addBuff = useGameStore((s) => s.addBuff);
  const progressMission = useDailyStore((s) => s.progressMission);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timeLeft, setTimeLeft] = useState(BASE_TIME_LIMIT);
  const [currentTimeLimit, setCurrentTimeLimit] = useState(BASE_TIME_LIMIT);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [showSkillPanel, setShowSkillPanel] = useState(false);
  const [skillMessage, setSkillMessage] = useState<string | null>(null);
  const [displayChoices, setDisplayChoices] = useState<string[]>([]);
  const [displayAnswerIdx, setDisplayAnswerIdx] = useState(0);
  const [blankAnswers, setBlankAnswers] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<string[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<QuizResult["questionsAnswered"]>([]);
  const [hintKeyword, setHintKeyword] = useState<string | null>(null);
  const [safeNet, setSafeNet] = useState(false);
  const [maskedText, setMaskedText] = useState(false);
  const [fakeHighlight, setFakeHighlight] = useState<number | null>(null);

  useEffect(() => { audio.playBGM("quiz"); }, []);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const quizStartTimeRef = useRef<number>(0);
  const questionStartTimeRef = useRef<number>(0);

  const gameState = useGameStore.getState() as Record<string, unknown>;
  const chapter =
    typeof gameState._quizChapter === "number" ? gameState._quizChapter : 1;
  const mode = gameState._quizMode === "mini" ? "mini" : "confirm";
  const hero = currentRun ? getHeroById(currentRun.selectedHeroId) : null;
  const equippedSkills =
    currentRun && hero ? getHeroSkillLoadout(hero, currentRun).equippedSkills : [];
  const storeDifficulty = useGameStore((s) => s.difficulty);

  // Refs to avoid re-running choice setup when currentRun/hero change mid-question
  const currentRunRef = useRef(currentRun);
  currentRunRef.current = currentRun;
  const heroRef = useRef(hero);
  heroRef.current = hero;

  useEffect(() => {
    const type = mode === "mini" ? "mini" : "confirm";
    const qs = getRandomQuestionsGuaranteed(chapter, QUESTIONS_PER_ROUND, type);

    setQuestions(qs);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
    setCorrectCount(0);
    setWrongCount(0);
    setMaxStreak(0);
    setCurrentStreak(0);
    setWrongIds([]);
    setAnsweredQuestions([]);
    setShowSkillPanel(false);
    setHintKeyword(null);
    setSafeNet(false);
    setQuizFinished(false);
    setQuizStarted(true);

    quizStartTimeRef.current = Date.now();
  }, [chapter, mode]);

  useEffect(() => {
    if (questions.length > 0 && currentIdx < questions.length) {
      const q = questions[currentIdx];
      const runSnap = currentRunRef.current;
      const heroSnap = heroRef.current;
      let nextChoices: string[] = [];
      let nextAnswerIdx = 0;

      if (isSingleChoiceFormat(q.format)) {
        const singleChoice = getSingleChoiceData(q);
        nextChoices = singleChoice.choices;
        nextAnswerIdx = singleChoice.answerIndex;

        const diff = getEffectiveDifficulty(q, storeDifficulty);

        // やさしい問題は選択肢を4つまで減らす
        if (diff === "easy" && nextChoices.length > 4 && q.format !== "true_false") {
          const reduced = applyReduceChoices(nextChoices, nextAnswerIdx, nextChoices.length - 4);
          nextChoices = reduced.filteredChoices;
          nextAnswerIdx = reduced.newAnswerIndex;
        }

        // むずかしい問題は選択肢の順番をシャッフル
        if (diff === "hard") {
          const shuffled = shuffleChoices(nextChoices, nextAnswerIdx);
          nextChoices = shuffled.shuffledChoices;
          nextAnswerIdx = shuffled.newAnswerIndex;
        }
      } else if (q.format === "sort") {
        nextChoices = shuffleArray(q.choices);
      } else {
        nextChoices = q.choices;
      }

      setDisplayChoices(nextChoices);
      setDisplayAnswerIdx(nextAnswerIdx);
      setBlankAnswers(Array(getBlankDefinitions(q).length).fill(""));
      setSortOrder([]);
      setHintKeyword(null);
      setMaskedText(false);
      setFakeHighlight(null);

      const hasTimePressure = runSnap?.debuffs.some((d) => d.type === "time_pressure") ?? false;
      const baseTime = q.timeLimit ?? (q.format === "speed" ? SPEED_TIME_LIMIT : BASE_TIME_LIMIT);

      let finalTime = hasTimePressure ? Math.ceil(baseTime / 2) : baseTime;
      if (heroSnap?.passive?.effects) {
        const timeExt = heroSnap.passive.effects.find((e) => e.type === "time_extend");
        if (timeExt) {
          finalTime = Math.ceil(finalTime * (1 + timeExt.value / 100));
        }
      }
      setTimeLeft(finalTime);
      setCurrentTimeLimit(finalTime);

      if (runSnap?.debuffs.some((d) => d.type === "observation_miss")) {
        setMaskedText(true);
      }

      if (runSnap?.debuffs.some((d) => d.type === "misinformation") && isSingleChoiceFormat(q.format)) {
        const wrongIndices = nextChoices
          .map((_, index) => index)
          .filter((index) => index !== nextAnswerIdx);

        if (wrongIndices.length > 0) {
          const randomWrong = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
          setFakeHighlight(randomWrong);
        }
      }

      questionStartTimeRef.current = Date.now();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, questions, storeDifficulty]);

  const finalizeAnswer = useCallback(
    (correct: boolean, selectedChoiceIdx: number | null) => {
      if (showResult || quizFinished || questions.length === 0) {
        return;
      }

      const currentQuestion = questions[currentIdx];
      if (!currentQuestion) {
        return;
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      const answerTimeMs = Math.max(1, Date.now() - questionStartTimeRef.current);
      const questionDifficulty = getEffectiveDifficulty(currentQuestion, storeDifficulty);
      setAnsweredQuestions((prev) => [
        ...prev,
        {
          questionId: currentQuestion.id,
          correct,
          timeMs: answerTimeMs,
          difficulty: questionDifficulty,
        },
      ]);

      setSelectedAnswer(selectedChoiceIdx);
      setIsCorrect(correct);
      setShowResult(true);
      if (correct) audio.playSE("success");
      else audio.playSE("error");

      if (correct) {
        setCorrectCount((count) => count + 1);

        const newStreak = currentStreak + 1;
        setCurrentStreak(newStreak);
        setMaxStreak((streak) => Math.max(streak, newStreak));

        incrementStreak();
        addUltimateCharge(1);

        if (currentRun?.activeBuffs) {
          const hotBuff = currentRun.activeBuffs.find((buff) => buff.type === "hot_heal");
          if (hotBuff) {
            addHomeostasis(hotBuff.value);
          }
        }
      } else {
        setWrongCount((count) => count + 1);
        setCurrentStreak(0);
        setWrongIds((ids) => [...ids, currentQuestion.id]);

        resetStreak();
        addWrongAnswer(currentQuestion.id);

        if (!safeNet) {
          addHomeostasis(-5);
        }
        setSafeNet(false);
      }
    },
    [
      showResult,
      quizFinished,
      questions,
      currentIdx,
      currentStreak,
      safeNet,
      currentRun,
      incrementStreak,
      addUltimateCharge,
      addHomeostasis,
      resetStreak,
      addWrongAnswer,
    ]
  );

  const handleChoiceAnswer = useCallback(
    (choiceIdx: number) => {
      const correct = choiceIdx === displayAnswerIdx;
      finalizeAnswer(correct, choiceIdx >= 0 ? choiceIdx : null);
    },
    [displayAnswerIdx, finalizeAnswer]
  );

  const handleStructuredSubmit = useCallback(() => {
    if (showResult || quizFinished || questions.length === 0) {
      return;
    }

    const q = questions[currentIdx];
    if (!q) {
      return;
    }

    if (q.format === "fill_blank") {
      const blanks = getBlankDefinitions(q);
      const isComplete = blanks.every((_, index) => (blankAnswers[index] || "").trim().length > 0);

      if (!isComplete) {
        return;
      }

      const correct = blanks.every((blank, index) => {
        const selected = blankAnswers[index] || "";
        return normalizeAnswer(selected) === normalizeAnswer(blank.answer);
      });

      finalizeAnswer(correct, null);
      return;
    }

    if (q.format === "sort") {
      const correctOrder = getSortCorrectOrder(q);
      if (sortOrder.length !== correctOrder.length) {
        return;
      }

      const correct = sortOrder.every((choice, index) => choice === correctOrder[index]);
      finalizeAnswer(correct, null);
    }
  }, [showResult, quizFinished, questions, currentIdx, blankAnswers, sortOrder, finalizeAnswer]);

  const handleTimeout = useCallback(() => {
    finalizeAnswer(false, null);
  }, [finalizeAnswer]);

  useEffect(() => {
    if (!quizStarted || showResult || quizFinished || questions.length === 0) {
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quizStarted, showResult, quizFinished, currentIdx, questions, handleTimeout]);

  const handleNext = () => {
    setShowResult(false);
    setSelectedAnswer(null);

    tickCooldowns();
    tickDebuffs();
    tickBuffs();

    if (currentIdx + 1 >= questions.length) {
      finishQuiz();
    } else {
      setCurrentIdx((idx) => idx + 1);
    }
  };

  const finishQuiz = () => {
    setQuizFinished(true);

    const elapsedSec = Math.max(
      1,
      Math.floor((Date.now() - quizStartTimeRef.current) / 1000)
    );

    const result: QuizResult = {
      chapter,
      total: questions.length,
      correct: correctCount,
      wrong: wrongCount,
      maxStreak,
      wrongQuestionIds: wrongIds,
      timeTaken: elapsedSec,
      questionsAnswered: answeredQuestions,
    };

    const rewards = calculateQuizRewards(result);
    addXP(rewards.xp);
    addMP(rewards.mp);
    addCaptureEnergy(rewards.captureEnergy);

    if (rewards.fragments > 0) {
      addFragments(rewards.fragments);
    }

    const rate = (result.correct / result.total) * 100;
    const chapterProgress = currentRun?.chapterProgress[chapter];

    const miniQuizBest =
      mode === "mini"
        ? Math.max(chapterProgress?.miniQuizBest || 0, rate)
        : chapterProgress?.miniQuizBest || 0;

    const confirmQuizBest =
      mode === "confirm"
        ? Math.max(chapterProgress?.confirmQuizBest || 0, rate)
        : chapterProgress?.confirmQuizBest || 0;

    const mastery = calculateMastery(
      miniQuizBest,
      confirmQuizBest,
      chapterProgress?.reviewCount || 0
    );

    const updateData: Record<string, number> = {
      mastery,
      miniQuizBest,
      confirmQuizBest,
    };

    useGameStore.getState().updateChapterMastery(chapter, updateData);
    useGameStore.setState((s) => ({ ...s, _quizResult: result, _quizRewards: rewards } as unknown as typeof s));
    setScreen("result");
  };

  const handleUseSkill = (skill: Skill) => {
    if (!currentRun || !hero) {
      return;
    }

    const q = questions[currentIdx];
    if (!q) {
      return;
    }

    const availability = getQuizSkillAvailability(
      skill.id,
      currentRun.skillCooldowns,
      currentRun.ultimateCharge,
      skill,
      {
        format: q.format,
        choiceCount: displayChoices.length,
        debuffs: currentRun.debuffs,
        hasKeyword: Boolean(q.keywords?.length),
        hintVisible: Boolean(hintKeyword),
        safeNetActive: safeNet,
        cooldowns: currentRun.skillCooldowns,
      }
    );

    if (!availability.usable) {
      setSkillMessage(`⚠️ ${skill.name}: ${availability.reason || "使用できません"}`);
      setTimeout(() => setSkillMessage(null), 1500);
      setShowSkillPanel(false);
      return;
    }

    const skillResult = applySkillEffects(skill.effects, currentRun.debuffs);

    if (skill.type === "active") {
      triggerSkillCooldown(skill.id, skill.cooldown);
    } else if (skill.type === "ultimate") {
      triggerSkillCooldown(skill.id, 99);
      resetUltimateCharge();
    }

    progressMission("skill_use_2");
    progressMission("skill_use_3");

    if (skillResult.healHomeostasis > 0) {
      addHomeostasis(skillResult.healHomeostasis);
    }

    skillResult.cleansedDebuffs.forEach((debuffType) => removeDebuff(debuffType));

    let reduceChoiceSuppressed = false;
    let reducedFrom: number | null = null;
    let reducedTo: number | null = null;
    if (skillResult.reducedChoicesBy > 0) {
      if (q && isSingleChoiceFormat(q.format) && displayChoices.length > 2) {
        reducedFrom = displayChoices.length;
        // やさしい問題はスキルの削減効果を+1
        const diff = getEffectiveDifficulty(q, storeDifficulty);
        const bonusReduce = diff === "easy" ? 1 : 0;
        const totalReduce = Math.min(
          skillResult.reducedChoicesBy + bonusReduce,
          displayChoices.length - 2  // 最低2択は残す
        );
        const reduced = applyReduceChoices(displayChoices, displayAnswerIdx, totalReduce);
        setDisplayChoices(reduced.filteredChoices);
        setDisplayAnswerIdx(reduced.newAnswerIndex);
        reducedTo = reduced.filteredChoices.length;
      } else {
        reduceChoiceSuppressed = true;
      }
    }

    if (skillResult.showHint && questions[currentIdx]?.keywords?.length) {
      setHintKeyword(questions[currentIdx].keywords![0]);
    }

    if (skillResult.safeNet) {
      setSafeNet(true);
    }

    if (skillResult.autoHighlightTurns > 0) {
      addBuff({ type: "auto_highlight", value: 1, turnsRemaining: skillResult.autoHighlightTurns });
    }

    skillResult.newBuffs.forEach((buff) => addBuff(buff));

    if (skillResult.reducedCooldowns > 0) {
      for (let i = 0; i < skillResult.reducedCooldowns; i++) {
        tickCooldowns();
      }
    }

    const reducedChoiceLabel =
      reducedFrom !== null && reducedTo !== null
        ? `（選択肢 ${reducedFrom}→${reducedTo}）`
        : "";

    setSkillMessage(
      reduceChoiceSuppressed
        ? `✨ ${skill.name} 発動！（選択肢削減はこの問題形式では無効）`
        : `✨ ${skill.name} 発動！${reducedChoiceLabel}`
    );
    setTimeout(() => setSkillMessage(null), 1500);
    setShowSkillPanel(false);
  };

  const handleAddSortChoice = (choice: string) => {
    if (showResult) {
      return;
    }

    setSortOrder((prev) => {
      if (prev.includes(choice)) {
        return prev;
      }
      return [...prev, choice];
    });
  };

  const handleRemoveSortChoice = (index: number) => {
    if (showResult) {
      return;
    }

    setSortOrder((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveSortChoice = (index: number, direction: -1 | 1) => {
    if (showResult) {
      return;
    }

    setSortOrder((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) {
        return prev;
      }

      const reordered = [...prev];
      [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
      return reordered;
    });
  };

  if (!currentRun || !hero || questions.length === 0) {
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-float">📚</div>
          <p className="text-warm-gray/50 text-sm">問題を準備中...</p>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];
  const progress = ((currentIdx + 1) / questions.length) * 100;
  const isSingleChoiceQuestion = isSingleChoiceFormat(q.format);
  const isFillBlankQuestion = q.format === "fill_blank";
  const isSortQuestion = q.format === "sort";
  const isManualSubmitQuestion = isFillBlankQuestion || isSortQuestion;

  const blankDefinitions = isFillBlankQuestion ? getBlankDefinitions(q) : [];
  const blankParts = isFillBlankQuestion ? q.question.split("（　）") : [];
  const inlineBlankLayout =
    isFillBlankQuestion && blankDefinitions.length > 0 && blankParts.length - 1 === blankDefinitions.length;

  const sortCorrectOrder = isSortQuestion ? getSortCorrectOrder(q) : [];
  const canSubmitManualAnswer = isFillBlankQuestion
    ? blankDefinitions.every((_, index) => (blankAnswers[index] || "").trim().length > 0)
    : isSortQuestion
      ? sortOrder.length === sortCorrectOrder.length
      : false;

  const availableSortChoices = isSortQuestion
    ? displayChoices.filter((choice) => !sortOrder.includes(choice))
    : [];

  const isSpeedQuestion = q.format === "speed";
  const isTrueFalseQuestion = q.format === "true_false";
  const answeredBlankCount = isFillBlankQuestion
    ? blankAnswers.filter((answer) => answer.trim().length > 0).length
    : 0;
  const speedTimerRatio = isSpeedQuestion && currentTimeLimit > 0
    ? clamp(timeLeft / currentTimeLimit, 0, 1)
    : 0;
  const speedRingStyle = {
    background: `conic-gradient(
      ${timeLeft <= 2 ? "#ef4444" : timeLeft <= 4 ? "#f97316" : "#38bdf8"} ${Math.round(speedTimerRatio * 360)}deg,
      rgba(255,255,255,0.45) 0deg
    )`,
  };
  const choiceContainerClass = isSingleChoiceQuestion
    ? isTrueFalseQuestion
      ? "grid grid-cols-2 gap-2.5 flex-1 min-h-0"
      : "grid gap-2 flex-1 min-h-0"
    : "flex-1 min-h-0";
  const singleChoiceGridStyle =
    isSingleChoiceQuestion && !isTrueFalseQuestion
      ? {
        gridTemplateRows: `repeat(${Math.max(displayChoices.length, 1)}, minmax(0, 1fr))`,
      }
      : undefined;

  const skillContext = {
    format: q.format,
    choiceCount: displayChoices.length,
    debuffs: currentRun.debuffs,
    hasKeyword: Boolean(q.keywords?.length),
    hintVisible: Boolean(hintKeyword),
    safeNetActive: safeNet,
    cooldowns: currentRun.skillCooldowns,
  };
  const skillAvailabilityMap = new Map(
    [
      ...equippedSkills.map((skill) => [
        skill.id,
        getQuizSkillAvailability(
          skill.id,
          currentRun.skillCooldowns,
          currentRun.ultimateCharge,
          skill,
          skillContext
        ),
      ] as const),
      [
        hero.ultimate.id,
        getQuizSkillAvailability(
          hero.ultimate.id,
          currentRun.skillCooldowns,
          currentRun.ultimateCharge,
          hero.ultimate,
          skillContext
        ),
      ] as const,
    ]
  );

  return (
    <div className="h-[100dvh] overflow-hidden px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] flex flex-col relative">
      <div
        className="absolute inset-0 pointer-events-none -z-20 bg-cover bg-center"
        style={{ backgroundImage: `url(/orgamon-quest/images/backgrounds/quiz_bg.webp)`, opacity: 0.15, mixBlendMode: 'multiply' }}
      />
      {/* Top bar */}
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => setScreen("chapter_map")} className="w-8 h-8 glass rounded-full flex items-center justify-center text-sm shadow-sm btn-press">
          ×
        </button>
        <div className="flex-1">
          <ProgressBar value={progress} max={100} gradient="from-coral to-pastel-pink" size="sm" />
        </div>
        <span className="text-[11px] text-warm-gray/50 shrink-0 font-medium">{currentIdx + 1}/{questions.length}</span>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between mb-2 text-xs">
        <div className="flex items-center gap-2">
          <Badge variant="success" size="xs">✅ {correctCount}</Badge>
          <Badge variant="danger" size="xs">❌ {wrongCount}</Badge>
          {currentStreak > 0 && (
            <Badge variant="warning" size="xs" className="animate-pulse">🔥 {currentStreak}連続</Badge>
          )}
        </div>
        {isSpeedQuestion ? (
          <div className="flex items-center gap-2 rounded-xl px-2 py-1.5 bg-red-50/70 border border-red-100">
            <div className="relative w-11 h-11 rounded-full p-[3px]" style={speedRingStyle}>
              <div className="w-full h-full rounded-full bg-white/90 text-[11px] font-extrabold text-red-500 flex items-center justify-center shadow-sm">
                {timeLeft}
              </div>
            </div>
            <div className="text-right leading-tight">
              <p className="text-[10px] text-red-400 font-bold">SPEED</p>
              <p className="text-[11px] text-red-500 font-semibold">残り {timeLeft}s</p>
            </div>
          </div>
        ) : (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs ${timeLeft <= 5 ? "bg-red-100 text-red-500 animate-pulse" : "glass text-warm-gray"
            }`}>
            ⏱️ {timeLeft}s
          </div>
        )}
      </div>

      {/* Debuffs */}
      {currentRun.debuffs.length > 0 && (
        <div className="flex gap-1 mb-1.5 flex-wrap">
          {currentRun.debuffs.map((d, i) => (
            <Badge key={i} variant="danger" size="xs">
              {getDebuffLabel(d.type)} {d.duration}T
            </Badge>
          ))}
        </div>
      )}

      {/* Skill message */}
      {skillMessage && (
        <div className="text-center py-1.5 bg-gradient-to-r from-pastel-yellow/60 to-pastel-pink/40 rounded-xl mb-1.5 text-sm font-bold text-amber-700 animate-pop">
          {skillMessage}
        </div>
      )}

      {/* Hint */}
      {hintKeyword && (
        <div className="text-center py-1.5 bg-pastel-blue/40 rounded-xl mb-1.5 text-xs font-medium text-blue-700">
          💡 ヒント: 「{hintKeyword}」に注目！
        </div>
      )}

      {fakeHighlight !== null && !showResult && (
        <div className="text-center py-1.5 bg-yellow-100/80 border border-yellow-300/80 rounded-xl mb-1.5 text-xs font-semibold text-amber-700">
          ⚠️ 黄枠は「誤情報」デバフのミスリードです。正解とは限りません。
        </div>
      )}

      {isSpeedQuestion && !showResult && (
        <div className="mb-1.5 rounded-xl border border-red-200/80 bg-gradient-to-r from-red-100/80 via-orange-100/70 to-amber-100/80 px-3 py-2 animate-pulse-glow">
          <div className="flex items-center justify-between gap-2 text-xs">
            <p className="font-bold text-red-600">⚡ スピード問題: 即断で回答！</p>
            <span className="text-[10px] text-red-500/80 font-semibold">{Math.round(speedTimerRatio * 100)}%</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-white/70 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-200 ${timeLeft <= 2 ? "bg-red-500" : timeLeft <= 4 ? "bg-orange-500" : "bg-sky-500"}`}
              style={{ width: `${Math.round(speedTimerRatio * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Question */}
      <div className="glass-strong rounded-2xl p-3.5 shadow-md mb-2 shrink-0">
        {(() => {
          const diff = getEffectiveDifficulty(q, storeDifficulty);
          const diffInfo = DIFFICULTY_LABELS[diff];
          return (
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-warm-gray/30 tracking-wider">
                Ch.{q.chapter} - {mode === "mini" ? "小テスト" : "確認テスト"} / {FORMAT_LABELS[q.format]}
              </p>
              <span className={`text-[10px] font-bold ${diffInfo.color}`}>
                {diffInfo.emoji} {diffInfo.label}
              </span>
            </div>
          );
        })()}

        {isFillBlankQuestion && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-xl bg-cyan-50/60 border border-cyan-100 px-3 py-2">
            <p className="text-[11px] font-semibold text-cyan-700">🧩 空欄を埋めて文を完成</p>
            <span className="text-[10px] font-bold text-cyan-600">
              {answeredBlankCount}/{blankDefinitions.length}
            </span>
          </div>
        )}

        {isSortQuestion && (
          <div className="mb-3 rounded-xl bg-indigo-50/65 border border-indigo-100 px-3 py-2">
            <p className="text-[11px] font-semibold text-indigo-700">🪜 正しい順番で並べ替えよう</p>
          </div>
        )}

        {isTrueFalseQuestion && (
          <div className="mb-3 rounded-xl bg-emerald-50/70 border border-emerald-100 px-3 py-2 text-[11px] font-semibold text-emerald-700">
            ⭕ 正しい / ❌ 誤り のどちらかを選択
          </div>
        )}

        {isFillBlankQuestion && inlineBlankLayout ? (
          <p className={`text-base font-medium text-warm-gray leading-relaxed ${maskedText ? "blur-[2px] hover:blur-none transition-all" : ""}`}>
            {blankParts.map((part, index) => {
              const blank = blankDefinitions[index];
              if (!blank) {
                return <Fragment key={`part-${index}`}>{part}</Fragment>;
              }

              const selected = blankAnswers[index] || "";
              const blankCorrect = normalizeAnswer(selected) === normalizeAnswer(blank.answer);
              const blankClass = showResult
                ? blankCorrect
                  ? "border-green-400 bg-green-50 text-green-700 shadow-[0_0_0_2px_rgba(74,222,128,0.15)]"
                  : "border-red-400 bg-red-50 text-red-700 shadow-[0_0_0_2px_rgba(248,113,113,0.15)]"
                : "border-cyan-200 bg-white text-cyan-700 shadow-sm";

              return (
                <Fragment key={`part-${index}`}>
                  {part}
                  <span className="inline-flex align-middle mx-1 relative top-[1px]">
                    <select
                      value={selected}
                      disabled={showResult}
                      onChange={(event) => {
                        const value = event.target.value;
                        setBlankAnswers((prev) => prev.map((answer, answerIndex) => (answerIndex === index ? value : answer)));
                      }}
                      className={`text-sm rounded-xl border px-2.5 py-1 min-w-[118px] transition-all font-semibold ${blankClass}`}
                    >
                      <option value="">選択</option>
                      {blank.options.map((option, optionIndex) => (
                        <option key={`${option}-${optionIndex}`} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </span>
                </Fragment>
              );
            })}
          </p>
        ) : (
          <p className={`text-base font-medium text-warm-gray leading-relaxed ${maskedText ? "blur-[2px] hover:blur-none transition-all" : ""}`}>
            {q.question}
          </p>
        )}
      </div>

      {/* Choices / Inputs */}
      <div className={choiceContainerClass} style={singleChoiceGridStyle}>
        {isSingleChoiceQuestion && displayChoices.map((choice, idx) => {
          const isSelected = selectedAnswer === idx;
          const isAnswer = idx === displayAnswerIdx;
          let bgClass = "glass hover:bg-white/80 border-2 border-transparent";
          const trueFalseTag = idx === 0 ? "⭕" : "❌";
          const trueFalseLabel = idx === 0 ? "正しい" : "誤り";

          if (isTrueFalseQuestion) {
            if (showResult) {
              if (isAnswer) {
                bgClass = "bg-green-100/90 border-2 border-green-400 shadow-[0_8px_20px_rgba(74,222,128,0.24)]";
              } else if (isSelected && !isAnswer) {
                bgClass = "bg-red-100/90 border-2 border-red-400 animate-shake";
              } else {
                bgClass = "bg-white/35 border-2 border-transparent opacity-55";
              }
            } else if (idx === 0) {
              bgClass = "bg-gradient-to-b from-emerald-50 to-emerald-100/70 border-2 border-emerald-200 hover:border-emerald-300";
            } else {
              bgClass = "bg-gradient-to-b from-rose-50 to-rose-100/70 border-2 border-rose-200 hover:border-rose-300";
            }
          } else {
            if (showResult) {
              if (isAnswer) {
                bgClass = "bg-green-100/80 border-2 border-green-400";
              } else if (isSelected && !isAnswer) {
                bgClass = "bg-red-100/80 border-2 border-red-400 animate-shake";
              } else {
                bgClass = "bg-white/30 border-2 border-transparent opacity-50";
              }
            } else if (fakeHighlight === idx) {
              bgClass = "bg-yellow-100/70 hover:bg-yellow-200/70 border-2 border-yellow-400";
            } else if (isSpeedQuestion) {
              bgClass = "bg-gradient-to-r from-sky-50/90 to-cyan-50/80 border-2 border-sky-200 hover:border-sky-300";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => !showResult && handleChoiceAnswer(idx)}
              disabled={showResult}
              className={`w-full text-left rounded-xl transition-all duration-200 ${bgClass} ${isTrueFalseQuestion ? "px-3 py-2.5 h-[112px]" : "px-4 py-2.5 min-h-[48px]"} ${!showResult ? "btn-press" : ""}`}
            >
              {isTrueFalseQuestion ? (
                <div className="h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-base font-bold ${idx === 0 ? "bg-emerald-200/70 text-emerald-700" : "bg-rose-200/70 text-rose-700"
                      }`}>
                      {trueFalseTag}
                    </span>
                    <span className={`text-xs font-semibold ${showResult && isAnswer
                      ? "text-green-700"
                      : showResult && isSelected && !isAnswer
                        ? "text-red-600"
                        : idx === 0
                          ? "text-emerald-700"
                          : "text-rose-700"
                      }`}>
                      {trueFalseLabel}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-warm-gray leading-snug mt-2">{choice}</p>
                </div>
              ) : (
                <div className="flex items-center gap-3 w-full">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${showResult && isAnswer ? "bg-green-400 text-white" : showResult && isSelected ? "bg-red-400 text-white" : "bg-gray-200/80 text-warm-gray"
                    }`}>
                    {idx + 1}
                  </span>
                  <span className="text-sm text-warm-gray font-semibold leading-tight">{choice}</span>
                </div>
              )}
            </button>
          );
        })}

        {isFillBlankQuestion && !inlineBlankLayout && (
          <div className="space-y-3">
            {blankDefinitions.map((blank, blankIndex) => {
              const selected = blankAnswers[blankIndex] || "";
              const blankCorrect = normalizeAnswer(selected) === normalizeAnswer(blank.answer);
              const boxClass = showResult
                ? blankCorrect
                  ? "border-green-300 bg-green-50/80 shadow-[0_8px_16px_rgba(74,222,128,0.15)]"
                  : "border-red-300 bg-red-50/80 shadow-[0_8px_16px_rgba(248,113,113,0.12)]"
                : "border-cyan-100 bg-gradient-to-br from-cyan-50/90 to-white";

              return (
                <div key={`blank-${blankIndex}`} className={`rounded-xl border p-3 ${boxClass}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-warm-gray/50">空欄 {blankIndex + 1}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/70 text-cyan-700 font-semibold">
                      BLANK
                    </span>
                  </div>
                  <select
                    value={selected}
                    disabled={showResult}
                    onChange={(event) => {
                      const value = event.target.value;
                      setBlankAnswers((prev) => prev.map((answer, index) => (index === blankIndex ? value : answer)));
                    }}
                    className="w-full rounded-lg border border-cyan-100 bg-white px-3 py-2 text-sm text-warm-gray font-semibold shadow-sm"
                  >
                    <option value="">選択してください</option>
                    {blank.options.map((option, optionIndex) => (
                      <option key={`${option}-${optionIndex}`} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}

        {isSortQuestion && (
          <div className="space-y-3">
            <div className="glass-panel rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-warm-gray/50">回答順</p>
                <span className="text-[10px] font-bold text-indigo-600 bg-white/70 px-2 py-0.5 rounded-full">
                  {sortOrder.length}/{sortCorrectOrder.length}
                </span>
              </div>
              <div className="space-y-2">
                {sortOrder.map((choice, index) => (
                  <div key={`${choice}-${index}`} className="relative">
                    {index < sortOrder.length - 1 && (
                      <div className="absolute left-6 top-9 h-4 w-[2px] bg-indigo-200/70" />
                    )}
                    <div className="flex items-center justify-between rounded-xl bg-white/78 px-3 py-2 border border-indigo-100 shadow-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-[11px] text-indigo-400">☰</span>
                        <span className="text-sm text-warm-gray truncate">{choice}</span>
                      </div>

                      {!showResult && (
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => handleMoveSortChoice(index, -1)}
                            disabled={index === 0}
                            className="w-7 h-7 rounded-md bg-white border border-indigo-100 text-xs text-warm-gray disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => handleMoveSortChoice(index, 1)}
                            disabled={index === sortOrder.length - 1}
                            className="w-7 h-7 rounded-md bg-white border border-indigo-100 text-xs text-warm-gray disabled:opacity-30"
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => handleRemoveSortChoice(index)}
                            className="w-7 h-7 rounded-md bg-white border border-indigo-100 text-xs text-warm-gray"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {sortOrder.length === 0 && (
                  <p className="text-xs text-warm-gray/45">下の候補をタップして、順番を組み立ててください。</p>
                )}
              </div>
            </div>

            {!showResult && (
              <div className="glass rounded-xl p-3 border border-indigo-100/70">
                <p className="text-xs text-warm-gray/50 mb-2">候補</p>
                <div className="flex flex-wrap gap-2">
                  {availableSortChoices.map((choice, index) => (
                    <button
                      key={`${choice}-${index}`}
                      onClick={() => handleAddSortChoice(choice)}
                      className="px-3 py-1.5 rounded-xl bg-white/85 border border-indigo-100 text-sm text-warm-gray font-medium btn-press"
                    >
                      + {choice}
                    </button>
                  ))}

                  {availableSortChoices.length === 0 && (
                    <p className="text-xs text-warm-gray/45">候補はすべて選択済みです。</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Explanation */}
      {showResult && (
        <div className={`rounded-2xl p-3 mb-2 animate-slide-up ${isCorrect ? "bg-green-50/80 border border-green-200" : "bg-red-50/80 border border-red-200"}`}>
          <p className={`font-bold text-sm mb-1 ${isCorrect ? "text-green-600" : "text-red-500"}`}>
            {isCorrect ? "🎉 正解！" : "😢 不正解..."}
          </p>
          <p className="text-[11px] text-warm-gray/60 leading-relaxed">{q.explanation}</p>

          {!isCorrect && isFillBlankQuestion && (
            <p className="text-[11px] text-warm-gray/60 leading-relaxed mt-1">
              正解: {blankDefinitions.map((blank) => blank.answer).join(" / ")}
            </p>
          )}

          {!isCorrect && isSortQuestion && (
            <p className="text-[11px] text-warm-gray/60 leading-relaxed mt-1">
              正しい順番: {sortCorrectOrder.join(" → ")}
            </p>
          )}
        </div>
      )}

      {/* Bottom actions */}
      <div className="flex gap-2 pt-1">
        {!showResult ? (
          <>
            <button
              onClick={() => setShowSkillPanel(!showSkillPanel)}
              className={`${isManualSubmitQuestion ? "flex-1" : "w-full"} py-3 bg-gradient-to-r from-lavender/80 to-pastel-purple/80 text-white rounded-xl font-medium shadow-sm text-sm btn-press`}
            >
              ⚡ スキル
            </button>

            {isManualSubmitQuestion && (
              <button
                onClick={handleStructuredSubmit}
                disabled={!canSubmitManualAnswer}
                className={`flex-1 py-3 rounded-xl font-bold shadow-sm text-sm transition-all ${canSubmitManualAnswer
                  ? "bg-gradient-to-r from-coral to-pastel-pink text-white btn-press"
                  : "bg-gray-200/70 text-warm-gray/50"
                  }`}
              >
                回答する
              </button>
            )}
          </>
        ) : (
          <button onClick={handleNext} className="flex-1 py-3 bg-gradient-to-r from-coral to-pastel-pink text-white rounded-xl font-bold shadow-md text-sm btn-press">
            {currentIdx + 1 >= questions.length ? "結果を見る →" : "次の問題 →"}
          </button>
        )}
      </div>

      {/* Skill panel */}
      <Modal open={showSkillPanel && !showResult} onClose={() => setShowSkillPanel(false)} position="bottom" showHandle>
        <h3 className="font-bold text-warm-gray mb-3">⚡ スキル選択</h3>
        <div className="bg-pastel-yellow/20 rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-warm-gray">🌈 アルティメットチャージ</span>
            <span className="font-bold text-amber-600">{currentRun.ultimateCharge}/{hero.ultimate.chargeRequired || 5}</span>
          </div>
          <ProgressBar value={currentRun.ultimateCharge || 0} max={hero.ultimate.chargeRequired || 5} gradient="from-amber-400 to-yellow-300" size="sm" />
          <p className="text-[10px] text-warm-gray/45 mt-1">
            正解1回ごとに+1。必要値に達するとアルティメットを使用できます。
          </p>
        </div>
        <div className="space-y-2 pb-4">
          {equippedSkills.map((skill) => {
            const cd = currentRun.skillCooldowns[skill.id] || 0;
            const availability = skillAvailabilityMap.get(skill.id);
            const usable = availability?.usable ?? false;
            const disableReason = availability?.reason;
            return (
              <button key={skill.id} onClick={() => usable && handleUseSkill(skill)} disabled={!usable}
                className={`w-full text-left p-3 rounded-xl transition-all ${usable ? "bg-white/80 hover:bg-white shadow-sm btn-press" : "bg-gray-100/60 opacity-40"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                    style={{ backgroundColor: usable && cd === 0 ? hero.themeColor : "#ccc" }}>
                    {cd > 0 ? `CD${cd}` : "⚡"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-warm-gray">{skill.name}</p>
                    <p className="text-[11px] text-warm-gray/40">{skill.description}</p>
                    {!usable && disableReason && (
                      <p className="text-[10px] text-red-500 mt-0.5">{disableReason}</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
          {(() => {
            const ultimateAvailability = skillAvailabilityMap.get(hero.ultimate.id);
            const ultimateUsable = ultimateAvailability?.usable ?? false;
            const ultimateDisableReason = ultimateAvailability?.reason;
            return (
              <button
                onClick={() => { if (ultimateUsable) handleUseSkill(hero.ultimate); }}
                disabled={!ultimateUsable}
                className={`w-full text-left p-3 rounded-xl border-2 border-dashed transition-all ${ultimateUsable
                  ? "border-amber-300 bg-amber-50/80 hover:bg-amber-100 btn-press" : "border-gray-200 bg-gray-50/60 opacity-40"
                  }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-300 flex items-center justify-center text-white text-lg shrink-0 shadow-sm">🌈</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-warm-gray">{hero.ultimate.name}</p>
                    <p className="text-[11px] text-warm-gray/40">{hero.ultimate.description}</p>
                    {!ultimateUsable && ultimateDisableReason && (
                      <p className="text-[10px] text-red-500 mt-0.5">{ultimateDisableReason}</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })()}
        </div>
      </Modal>
    </div>
  );
}
