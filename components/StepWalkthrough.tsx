"use client";

import { useState, useEffect, useCallback } from "react";

interface ComprehensionCheck {
  question: string;
  options: string[];
  correctIndex: number;
}

interface Step {
  step: number;
  action: string;
  why: string;
  result: string;
  comprehensionCheck?: ComprehensionCheck | null;
}

interface SolveResult {
  problem: string;
  given: string[];
  steps: Step[];
  answer: string;
  concept: string;
}

interface Props {
  result: SolveResult;
  onComplete: () => void;
}

function getReadTime(step: Step): number {
  const text = `${step.action} ${step.why} ${step.result}`;
  const words = text.split(/\s+/).length;
  // 8-15 seconds based on length
  return Math.min(15, Math.max(8, Math.round(words / 10) + 8));
}

export default function StepWalkthrough({ result, onComplete }: Props) {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [timerLeft, setTimerLeft] = useState(0);
  const [timerTotal, setTimerTotal] = useState(0);
  const [showCheck, setShowCheck] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [checkResult, setCheckResult] = useState<"correct" | "wrong" | null>(null);
  const [showReread, setShowReread] = useState(false);
  const [completedChecks, setCompletedChecks] = useState<Record<number, boolean>>({}); // stepIndex -> firstTryCorrect
  const [stepTimes, setStepTimes] = useState<Record<number, number>>({}); // stepIndex -> seconds spent
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());
  const [allDone, setAllDone] = useState(false);

  const allRevealed = visibleSteps >= result.steps.length;
  const currentStep = visibleSteps > 0 ? result.steps[visibleSteps - 1] : null;
  const hasCheck = currentStep?.comprehensionCheck != null;
  const checkPending = hasCheck && !showCheck && checkResult === null && visibleSteps > 0;

  // Start timer when a new step is revealed
  useEffect(() => {
    if (visibleSteps > 0 && visibleSteps <= result.steps.length) {
      const step = result.steps[visibleSteps - 1];
      const time = getReadTime(step);
      setTimerTotal(time);
      setTimerLeft(time);
      setShowCheck(false);
      setSelectedAnswer(null);
      setCheckResult(null);
      setShowReread(false);
      setStepStartTime(Date.now());
    }
  }, [visibleSteps, result.steps]);

  // Countdown
  useEffect(() => {
    if (timerLeft <= 0) return;
    const id = setInterval(() => setTimerLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [timerLeft]);

  const recordStepTime = useCallback(() => {
    const elapsed = Math.round((Date.now() - stepStartTime) / 1000);
    setStepTimes((prev) => ({ ...prev, [visibleSteps - 1]: (prev[visibleSteps - 1] || 0) + elapsed }));
  }, [stepStartTime, visibleSteps]);

  const proceedToNext = useCallback(() => {
    recordStepTime();
    if (visibleSteps >= result.steps.length) {
      setAllDone(true);
    } else {
      setVisibleSteps((v) => v + 1);
    }
  }, [recordStepTime, visibleSteps, result.steps.length]);

  const handleNextClick = () => {
    if (timerLeft > 0) return;
    // If this step has a check that hasn't been done yet, show it
    if (hasCheck && checkResult === null) {
      setShowCheck(true);
      return;
    }
    // If this step's check was passed (correct), or no check needed, proceed
    proceedToNext();
  };

  const handleAnswer = (idx: number) => {
    if (checkResult !== null) return;
    setSelectedAnswer(idx);
    const correct = idx === currentStep!.comprehensionCheck!.correctIndex;
    if (correct) {
      setCheckResult("correct");
      setCompletedChecks((prev) => ({
        ...prev,
        [visibleSteps - 1]: prev[visibleSteps - 1] === undefined ? true : prev[visibleSteps - 1],
      }));
    } else {
      setCheckResult("wrong");
      setCompletedChecks((prev) => ({
        ...prev,
        [visibleSteps - 1]: false,
      }));
      setShowReread(true);
    }
  };

  const handleReread = () => {
    setShowCheck(false);
    setSelectedAnswer(null);
    setCheckResult(null);
    setShowReread(false);
    // Reset timer for re-reading
    const step = result.steps[visibleSteps - 1];
    const time = Math.max(5, Math.round(getReadTime(step) * 0.6));
    setTimerTotal(time);
    setTimerLeft(time);
    setStepStartTime(Date.now());
  };

  const handleContinueAfterCorrect = () => {
    setShowCheck(false);
    proceedToNext();
  };

  // Understanding score calculation
  const calcScore = () => {
    const checksTotal = Object.keys(completedChecks).length;
    const firstTryCorrect = Object.values(completedChecks).filter(Boolean).length;
    const checkScore = checksTotal > 0 ? firstTryCorrect / checksTotal : 1;

    const times = Object.values(stepTimes);
    const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 10;
    const timeScore = Math.min(1, avgTime / 12); // 12+ seconds avg = full marks

    const score = Math.round((checkScore * 0.7 + timeScore * 0.3) * 100);
    return Math.min(100, Math.max(10, score));
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return "🌟 Amazing! You really understood this!";
    if (score >= 75) return "🎉 Great job! You've got a solid grasp!";
    if (score >= 50) return "👍 Good effort! Keep practicing!";
    return "💪 Nice work going through it all! Review the steps again to strengthen your understanding.";
  };

  // Final answer + score screen
  if (allDone) {
    const score = calcScore();
    return (
      <div className="animate-slide-up">
        {/* Score */}
        <div className="bg-white rounded-2xl p-6 card-shadow mb-4 text-center">
          <h3 className="font-bold text-gray-800 text-lg mb-3">📊 Understanding Score</h3>
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={score >= 75 ? "#8b5cf6" : score >= 50 ? "#f59e0b" : "#ef4444"}
                strokeWidth="8"
                strokeDasharray={`${score * 2.64} 264`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-extrabold text-gray-800">{score}%</span>
            </div>
          </div>
          <p className="text-gray-600">{getScoreMessage(score)}</p>
        </div>

        {/* Answer */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
          <p className="text-green-700 font-bold text-xl mb-1">🎉 {result.answer}</p>
          <p className="text-green-600 text-sm mt-2">Key concept: {result.concept}</p>
        </div>

        <button
          onClick={onComplete}
          className="w-full bg-violet-100 text-violet-700 font-bold py-4 rounded-2xl hover:bg-violet-200 transition-all active:scale-[0.98]"
        >
          💬 Have questions? Let&apos;s chat about it!
        </button>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mt-4">
          {result.steps.map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-violet-500" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      {/* Problem overview */}
      <div className="bg-white rounded-2xl p-5 card-shadow mb-4">
        <h3 className="font-bold text-gray-800 text-lg mb-2">🔍 The Problem</h3>
        <p className="text-gray-600">{result.problem}</p>
      </div>

      {/* Givens */}
      <div className="bg-violet-50 rounded-2xl p-4 mb-4">
        <h4 className="font-semibold text-violet-700 mb-2">📋 What we know:</h4>
        <ul className="space-y-1">
          {result.given.map((g, i) => (
            <li key={i} className="text-violet-600 text-sm flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>{g}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-4">
        {result.steps.slice(0, visibleSteps).map((step, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 card-shadow animate-slide-up"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-violet-100 text-violet-700 text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center">
                {step.step}
              </span>
              <h4 className="font-semibold text-gray-800 text-sm">{step.action}</h4>
            </div>
            <div className="ml-9 space-y-2">
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-blue-700 text-sm">
                  <span className="font-semibold">Why? </span>
                  {step.why}
                </p>
              </div>
              <p className="text-gray-600 text-sm">
                <span className="font-semibold">→ </span>
                {step.result}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Comprehension check overlay */}
      {showCheck && currentStep?.comprehensionCheck && !showReread && (
        <div className="bg-white rounded-2xl p-5 card-shadow mb-4 border-2 border-violet-200 animate-slide-up">
          <h4 className="font-bold text-violet-700 text-sm mb-1">🧠 Quick Check!</h4>
          <p className="text-gray-700 text-sm mb-4">{currentStep.comprehensionCheck.question}</p>
          <div className="space-y-2">
            {currentStep.comprehensionCheck.options.map((opt, idx) => {
              let cls = "bg-gray-50 border border-gray-200 hover:border-violet-300 hover:bg-violet-50";
              if (checkResult !== null) {
                if (idx === currentStep.comprehensionCheck!.correctIndex) {
                  cls = "bg-green-50 border-2 border-green-400";
                } else if (idx === selectedAnswer && checkResult === "wrong") {
                  cls = "bg-red-50 border-2 border-red-300";
                } else {
                  cls = "bg-gray-50 border border-gray-200 opacity-50";
                }
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={checkResult !== null}
                  className={`w-full text-left p-3 rounded-xl text-sm transition ${cls}`}
                >
                  <span className="font-semibold text-gray-500 mr-2">{String.fromCharCode(65 + idx)}.</span>
                  {opt}
                </button>
              );
            })}
          </div>
          {checkResult === "correct" && (
            <div className="mt-4">
              <p className="text-green-600 text-sm font-semibold mb-3">✅ That&apos;s right! Great understanding! 🌟</p>
              <button
                onClick={handleContinueAfterCorrect}
                className="w-full gradient-bg text-white font-bold py-3 rounded-xl transition active:scale-[0.98]"
              >
                Continue →
              </button>
            </div>
          )}
          {checkResult === "wrong" && (
            <div className="mt-4">
              <p className="text-amber-600 text-sm font-semibold mb-3">Not quite! Let&apos;s re-read this step 📖</p>
              <button
                onClick={handleReread}
                className="w-full bg-amber-100 text-amber-700 font-bold py-3 rounded-xl transition active:scale-[0.98]"
              >
                Re-read Step {currentStep.step} 📖
              </button>
            </div>
          )}
        </div>
      )}

      {/* Next Step button — show when no check is active, OR when check was already passed */}
      {visibleSteps === 0 && (
        <button
          onClick={() => setVisibleSteps(1)}
          className="w-full font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] text-lg gradient-bg text-white hover:shadow-xl"
        >
          Show Step 1 →
        </button>
      )}
      {visibleSteps > 0 && !allRevealed && !showCheck && (
        <button
          onClick={handleNextClick}
          disabled={timerLeft > 0}
          className={`w-full font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] text-lg relative overflow-hidden ${
            timerLeft > 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "gradient-bg text-white hover:shadow-xl"
          }`}
        >
          {timerLeft > 0 && timerTotal > 0 && (
            <div
              className="absolute bottom-0 left-0 h-1 bg-violet-400 transition-all duration-1000 ease-linear"
              style={{ width: `${((timerTotal - timerLeft) / timerTotal) * 100}%` }}
            />
          )}
          {timerLeft > 0
            ? `Read this step... (${timerLeft}s)`
            : hasCheck && checkResult === null
            ? "Answer Check to Continue 🧠"
            : visibleSteps < result.steps.length
            ? `Next Step (${visibleSteps + 1}/${result.steps.length}) →`
            : "See My Results! 🎉"}
        </button>
      )}
      {/* When all steps revealed but not done yet (last step had no check or check already passed) */}
      {allRevealed && !allDone && !showCheck && (
        <button
          onClick={() => { recordStepTime(); setAllDone(true); }}
          className="w-full font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] text-lg gradient-bg text-white hover:shadow-xl"
        >
          See My Results! 🎉
        </button>
      )}

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {result.steps.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i < visibleSteps ? "bg-violet-500" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
