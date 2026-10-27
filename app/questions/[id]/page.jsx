"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_BASE = "https://api.crazystory.in/api/patient/quizzes";
const SAVE_ANSWER_URL = "https://api.crazystory.in/api/patient/answer/save";

const STORAGE_KEY = (id) => `quiz_answers_${id}`;
const BLOCK_SIZE = 20;

// Put these files in /public (or change the paths)
const LOGO_SRC = "/athma-logo.png";
const BADGE_SRC = "/athma-badge.png";
const MASCOT_SRC = "/athma-mascot.png";

// Tamil labels for Yes / No options (used when the API doesn't send option translations)
const TAMIL_OPTION_MAP = {
  yes: "ஆம்",
  no: "இல்லை",
};

const getOptionTamil = (q, optIndex, option) => {
  const fromApi =
    q.options_ta?.[optIndex] || q.options_tamil?.[optIndex] || null;
  if (fromApi) return fromApi;
  return TAMIL_OPTION_MAP[String(option).trim().toLowerCase()] || "";
};

function QuizQuestions() {
  const router = useRouter();
  const [quizId, setQuizId] = useState(null);

  // Read the dynamic quiz ID from /questions/[id] after mounting.
  // This avoids useParams() during Next.js prerendering.
  useEffect(() => {
    const segments = window.location.pathname.split("/").filter(Boolean);
    setQuizId(segments[segments.length - 1] || null);
  }, []);

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attemptId, setAttemptId] = useState(null);

  // { [questionId]: score }
  const [answers, setAnswers] = useState({});
  // { [questionId]: "saving" | "saved" | "error" }
  const [saveStatus, setSaveStatus] = useState({});
  // { [questionId]: answer_text chosen (for reference) }
  const [chosenText, setChosenText] = useState({});

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // UI state
  const [activeBlock, setActiveBlock] = useState(0);
  const [nextQuizTitle, setNextQuizTitle] = useState("");
  const centerRef = useRef(null);

  const loadQuiz = async () => {
    if (!quizId) return;
    setLoading(true);
    setError("");
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("athma_token") : null;

      const res = await fetch(`${API_BASE}/${quizId}`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error(`Request failed (${res.status})`);

      const data = await res.json();
      if (!data.success) throw new Error("Could not load quiz");

      const loadedQuiz = data.quiz;
      setQuiz(loadedQuiz);
      if (data.attempt_id) setAttemptId(data.attempt_id);

      // Next quiz title if the API sends it
      const apiNext =
        data.next_quiz?.title || loadedQuiz?.next_quiz?.title || "";
      if (apiNext) setNextQuizTitle(apiNext);

      // ---------- Restore answers from server (resume attempt) ----------
      const restoredScores = {};
      const restoredText = {};

      if (Array.isArray(data.answers) && data.answers.length > 0) {
        data.answers.forEach((a) => {
          const q = loadedQuiz.questions.find((x) => x.id === a.question_id);
          if (!q) return;
          const idx = q.options.indexOf(a.answer_text);
          if (idx !== -1) {
            restoredScores[q.id] = q.scores[idx];
            restoredText[q.id] = a.answer_text;
          }
        });
      }

      // ---------- Fill any gaps from localStorage cache ----------
      try {
        const cached = JSON.parse(
          localStorage.getItem(STORAGE_KEY(quizId)) || "{}"
        );
        Object.entries(cached).forEach(([qid, v]) => {
          const numericId = Number(qid);
          if (restoredScores[numericId] === undefined && v) {
            restoredScores[numericId] = v.score;
            restoredText[numericId] = v.answerText;
          }
        });
      } catch {
        /* ignore cache errors */
      }

      if (Object.keys(restoredScores).length > 0) {
        setAnswers(restoredScores);
        setChosenText(restoredText);

        // Mark restored ones as already saved
        const savedMap = {};
        Object.keys(restoredScores).forEach((qid) => {
          savedMap[qid] = "saved";
        });
        setSaveStatus(savedMap);
      }

      // ---------- Best-effort: find the next quiz in the list ----------
      if (!apiNext) {
        try {
          const listRes = await fetch(API_BASE, {
            headers: {
              Accept: "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          if (listRes.ok) {
            const listData = await listRes.json();
            const list =
              listData.quizzes || listData.data || listData.categories || [];
            if (Array.isArray(list)) {
              const idx = list.findIndex((x) => String(x.id) === String(quizId));
              if (idx !== -1 && list[idx + 1]) {
                setNextQuizTitle(list[idx + 1].title || "");
              }
            }
          }
        } catch {
          /* ignore — "Up next" card simply stays hidden */
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  const scrollCenterTop = () => {
    if (centerRef.current) {
      centerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Save a single answer to the backend
  const saveAnswer = async (questionId, score, answerText) => {
    setSaveStatus((prev) => ({ ...prev, [questionId]: "saving" }));

    const token =
      typeof window !== "undefined" ? localStorage.getItem("athma_token") : null;

    try {
      const res = await fetch(SAVE_ANSWER_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          quiz_id: Number(quizId),
          question_id: questionId,
          answer_text: answerText,
          ...(attemptId ? { attempt_id: attemptId } : {}),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || (data && data.success === false)) {
        throw new Error((data && data.message) || `Save failed (${res.status})`);
      }

      if (data && data.attempt_id) setAttemptId(data.attempt_id);

      setSaveStatus((prev) => ({ ...prev, [questionId]: "saved" }));

      // Persist locally for instant resume (survives back/forward nav)
      try {
        const key = STORAGE_KEY(quizId);
        const existing = JSON.parse(localStorage.getItem(key) || "{}");
        existing[questionId] = { score, answerText };
        localStorage.setItem(key, JSON.stringify(existing));
      } catch {
        /* ignore */
      }
    } catch (err) {
      console.warn("saveAnswer failed:", err.message);
      setSaveStatus((prev) => ({ ...prev, [questionId]: "error" }));

      // Still cache locally so state isn't lost even if server failed
      try {
        const key = STORAGE_KEY(quizId);
        const existing = JSON.parse(localStorage.getItem(key) || "{}");
        existing[questionId] = { score, answerText };
        localStorage.setItem(key, JSON.stringify(existing));
      } catch {
        /* ignore */
      }
    }
  };

  const handleSelect = (q, score, answerText) => {
    if (submitted) return;

    // update local state immediately (optimistic UI)
    setAnswers((prev) => ({ ...prev, [q.id]: score }));
    setChosenText((prev) => ({ ...prev, [q.id]: answerText }));

    // fire and forget — status handled inside
    saveAnswer(q.id, score, answerText);
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    const unanswered = quiz.questions.filter(
      (q) => answers[q.id] === undefined
    );

    if (unanswered.length > 0) {
      if (answeredCount === 0) return;
      alert(`Please answer all questions. (${unanswered.length} remaining)`);
      return;
    }

    setSubmitting(true);
    try {
      // Wait a moment if any are still saving so we don't cut them off
      const stillSaving = Object.values(saveStatus).includes("saving");
      if (stillSaving) {
        await new Promise((r) => setTimeout(r, 400));
      }

      // Retry any that failed
      const failed = Object.keys(saveStatus).filter(
        (k) => saveStatus[k] === "error"
      );
      for (const qid of failed) {
        const q = quiz.questions.find((x) => String(x.id) === String(qid));
        if (q && answers[q.id] !== undefined) {
          await saveAnswer(q.id, answers[q.id], chosenText[q.id]);
        }
      }

      // Clear local cache — attempt is complete
      try {
        localStorage.removeItem(STORAGE_KEY(quizId));
      } catch {
        /* ignore */
      }

      setSubmitted(true);
      scrollCenterTop();
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Derived data ----------
  const sortedQuestions = useMemo(
    () =>
      quiz?.questions
        ? quiz.questions
            .slice()
            .sort((a, b) => a.display_order - b.display_order)
        : [],
    [quiz]
  );

  const blocks = useMemo(() => {
    const out = [];
    for (let i = 0; i < sortedQuestions.length; i += BLOCK_SIZE) {
      const items = sortedQuestions.slice(i, i + BLOCK_SIZE);
      out.push({
        index: out.length,
        start: i + 1,
        end: i + items.length,
        questions: items,
      });
    }
    return out;
  }, [sortedQuestions]);

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = sortedQuestions.length;
  const remaining = Math.max(totalQuestions - answeredCount, 0);
  const progressPct = totalQuestions
    ? (answeredCount / totalQuestions) * 100
    : 0;
  const allAnswered = totalQuestions > 0 && answeredCount === totalQuestions;

  const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);
  const maxScore = quiz
    ? quiz.questions.reduce(
        (sum, q) => sum + Math.max(...(q.scores?.length ? q.scores : [0])),
        0
      )
    : 0;

  const scorePct = maxScore ? Math.round((totalScore / maxScore) * 100) : 0;
  const RING_LEN = 2 * Math.PI * 52;

  const isYesNo =
    sortedQuestions.length > 0 &&
    sortedQuestions.every(
      (q) =>
        q.options?.length === 2 &&
        q.options.every((o) =>
          ["yes", "no"].includes(String(o).trim().toLowerCase())
        )
    );

  const typeLabel = isYesNo ? "Yes/No" : "Multiple choice";
  const instructionText =
    quiz?.instructions ||
    (isYesNo
      ? "Please answer each question with Yes or No based on your experience."
      : "Please choose the option that best matches your experience.");
  const durationText =
    quiz?.duration ||
    quiz?.estimated_time ||
    `${Math.max(Math.round(totalQuestions / 3), 1)}-${Math.max(
      Math.round(totalQuestions * 0.42),
      2
    )} mins`;

  const currentBlock = blocks[activeBlock] || blocks[0];
  const blockAnswered = (b) =>
    b.questions.filter((q) => answers[q.id] !== undefined).length;

  const goToBlock = (i) => {
    setActiveBlock(i);
    scrollCenterTop();
  };

  const renderSaveBadge = (qid) => {
    const s = saveStatus[qid];
    if (!s) return null;
    if (s === "saving") {
      return (
        <span className="ap-badge ap-badge-saving">
          <span className="ap-spin" /> Saving
        </span>
      );
    }
    if (s === "saved") {
      return <span className="ap-badge ap-badge-saved">✓ Saved</span>;
    }
    return <span className="ap-badge ap-badge-error">! Retry</span>;
  };

  return (
    <main className="ap-page">
      <style>{`
        .ap-page {
          --teal-50: #f0fdfa;
          --teal-100: #ccfbf1;
          --teal-300: #5eead4;
          --teal-400: #2dd4bf;
          --teal-600: #0d9488;
          --o-50: #fff7ed;
          --o-100: #ffedd5;
          --o-500: #f97316;
          --o-600: #ea580c;
          --ink: #1f2937;
          --ink-strong: #111827;
          --muted: #6b7280;
          --line: #e5e7eb;
          --soft: #f3f4f6;
          --header-h: 71px;
          height: 100vh;
          display: flex;
          flex-direction: column;
          font-family: "Inter", system-ui, -apple-system, "Segoe UI", "Noto Sans Tamil", sans-serif;
          color: var(--ink);
          background: #fff;
          overflow: hidden;
        }
        .ap-page * { box-sizing: border-box; }

        /* ---------- header ---------- */
        .ap-header {
          flex: none; height: var(--header-h);
          display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
          padding: 0 22px; background: #fff;
          border-bottom: 1px solid var(--line);
          box-shadow: 0 2px 4px rgba(0,0,0,.05);
          position: relative; z-index: 20;
        }
        .ap-back {
          justify-self: start; display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; color: var(--muted); text-decoration: none;
          transition: color .2s;
        }
        .ap-back:hover { color: var(--teal-600); }
        .ap-logos { display: flex; align-items: center; gap: 14px; }
        .ap-logos img { height: 50px; width: auto; object-fit: contain; display: block; }
        .ap-logo-sep { width: 1px; height: 44px; background: var(--line); }
        .ap-head-right { justify-self: end; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
        .ap-head-title { font-size: 12px; font-weight: 600; letter-spacing: .02em; color: var(--teal-600); }
        .ap-head-pill {
          padding: 2px 10px; border-radius: 999px; background: var(--soft);
          font-size: 10.5px; font-weight: 600; color: var(--ink);
        }

        /* ---------- body grid ---------- */
        .ap-body {
          flex: 1; min-height: 0;
          display: grid; grid-template-columns: 360px minmax(0, 1fr) 360px;
        }
        .ap-left, .ap-right { overflow-y: auto; background: #fff; }
        .ap-left { padding: 22px; border-right: 1px solid var(--line); background: #fafafa; }
        .ap-right { padding: 22px 12px 22px 22px; border-left: 1px solid var(--line); }
        .ap-center {
          overflow-y: auto; padding: 30px 24px 60px;
          background: #fafafa;
          scrollbar-width: thin;
        }
        .ap-center-inner { max-width: 576px; margin: 0 auto; }

        .ap-section-label {
          margin: 0 0 18px; font-size: 11px; font-weight: 600;
          letter-spacing: .04em; text-transform: uppercase; color: var(--ink);
        }

        /* ---------- left: assessment info ---------- */
        .ap-info {
          padding: 20px; border-radius: 16px;
          background: var(--teal-50); border: 1.5px solid var(--teal-300);
        }
        .ap-info-icon {
          width: 40px; height: 40px; border-radius: 10px;
          display: grid; place-items: center;
          background: #e5e7eb; color: var(--ink); margin-bottom: 14px;
        }
        .ap-info h2 {
          margin: 0 0 6px; font-size: 18px; font-weight: 800; letter-spacing: -.01em;
          color: var(--ink-strong); text-transform: uppercase;
        }
        .ap-info-sub { margin: 0 0 16px; font-size: 13px; color: var(--ink); }
        .ap-instr {
          display: flex; gap: 8px; align-items: flex-start;
          padding: 11px 12px; border-radius: 8px; background: #fff;
          border: 1px solid var(--line); font-size: 11px; line-height: 1.5; color: var(--ink);
        }
        .ap-instr svg { flex: none; margin-top: 1px; color: #16a34a; }
        .ap-info-chips { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
        .ap-info-chip {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 10px; border-radius: 8px; background: #fff; border: 1px solid var(--line);
          font-size: 11px; font-weight: 600; color: var(--ink);
        }
        .ap-info-chip svg { color: var(--muted); flex: none; }

        .ap-stat-row { display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; color: var(--muted); }
        .ap-stat-row strong { color: var(--ink-strong); font-weight: 600; }
        .ap-stat-row .ap-red { color: var(--o-600); font-weight: 600; }
        .ap-overall { margin-top: 26px; }
        .ap-overall .ap-stat-row strong { font-size: 12px; }
        .ap-bar { height: 6px; margin: 12px 0 14px; border-radius: 999px; background: #e5e7eb; overflow: hidden; }
        .ap-bar-fill {
          height: 100%; border-radius: 999px;
          background: linear-gradient(90deg, var(--teal-400), var(--teal-600));
          transition: width .35s ease;
        }
        .ap-stats { display: flex; flex-direction: column; gap: 14px; }

        .ap-next {
          margin-top: 20px; padding: 12px 14px; border-radius: 10px;
          background: var(--teal-50); border: 1.5px solid var(--teal-300);
        }
        .ap-next small { display: block; margin-bottom: 6px; font-size: 10px; font-weight: 700; letter-spacing: .03em; color: var(--ink); }
        .ap-next span { font-size: 13px; color: var(--ink-strong); text-transform: uppercase; }

        .ap-autosave {
          margin-top: 14px; padding: 11px 14px; border-radius: 8px;
          display: flex; align-items: center; gap: 8px;
          background: #f3f4f6; font-size: 11px; color: var(--muted);
        }
        .ap-autosave svg { color: #16a34a; flex: none; }

        .ap-mascot { margin-top: 36px; text-align: center; }
        .ap-mascot img { width: 160px; height: auto; display: inline-block; }
        .ap-mascot p { margin: 12px 0 0; font-size: 12px; font-weight: 600; color: var(--ink-strong); }

        /* ---------- center: questions ---------- */
        .ap-q {
          position: relative; margin: 0 0 22px; padding: 38px 34px 26px;
          background: #fff; border: 1px solid var(--line); border-radius: 12px;
          text-align: center;
          transition: border-color .25s, box-shadow .25s;
        }
        .ap-q.answered { border-color: var(--teal-300); box-shadow: 0 8px 22px -14px rgba(13,148,136,.4); }
        .ap-q:first-of-type { margin-top: 18px; }
        .ap-qnum {
          position: absolute; top: -17px; left: 50%; transform: translateX(-50%);
          width: 34px; height: 34px; border-radius: 50%;
          display: grid; place-items: center;
          background: linear-gradient(135deg, #fb923c, #ea580c);
          color: #fff; font-size: 13px; font-weight: 700;
          box-shadow: 0 6px 14px -4px rgba(234,88,12,.55);
          border: 3px solid #fafafa;
        }
        .ap-q-en { margin: 0; padding-bottom: 14px; font-size: 14px; font-weight: 500; line-height: 1.5; color: var(--ink-strong); border-bottom: 1px solid var(--soft); }
        .ap-q-ta { margin: 14px 0 0; font-size: 13.5px; line-height: 1.7; color: var(--ink); }
        .ap-options { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 18px; }

        .ap-opt { position: relative; cursor: pointer; }
        .ap-opt input { position: absolute; opacity: 0; pointer-events: none; }
        .ap-opt-pill {
          display: inline-flex; align-items: center; gap: 10px;
          min-width: 112px; justify-content: center;
          padding: 11px 22px; border-radius: 999px;
          background: #fff; border: 1px solid var(--line);
          font-size: 12.5px; font-weight: 600; color: var(--ink-strong);
          transition: background .2s, border-color .2s, color .2s, box-shadow .2s;
        }
        .ap-opt-sep { width: 1px; height: 12px; background: var(--line); transition: background .2s; }
        .ap-opt-ta { font-weight: 500; font-size: 12px; color: var(--ink); }
        .ap-opt:hover .ap-opt-pill { background: var(--teal-50); border-color: var(--teal-300); }
        .ap-opt input:focus-visible + .ap-opt-pill { outline: 2px solid var(--teal-600); outline-offset: 2px; }
        .ap-opt.selected .ap-opt-pill {
          background: var(--teal-600); border-color: var(--teal-600); color: #fff;
          box-shadow: 0 8px 16px -8px rgba(13,148,136,.7);
        }
        .ap-opt.selected .ap-opt-ta { color: #fff; }
        .ap-opt.selected .ap-opt-sep { background: rgba(255,255,255,.5); }
        .ap-opt.locked { cursor: default; }

        /* save badge */
        .ap-badge {
          position: absolute; top: 12px; right: 14px;
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 9px; border-radius: 999px;
          font-size: 10px; font-weight: 700; white-space: nowrap;
        }
        .ap-badge-saving { background: var(--o-50); color: var(--o-600); }
        .ap-badge-saved { background: #ecfdf5; color: #047857; }
        .ap-badge-error { background: #fef2f2; color: #b91c1c; }
        .ap-spin {
          width: 9px; height: 9px; border-radius: 50%;
          border: 2px solid currentColor; border-right-color: transparent;
          animation: ap-spin .7s linear infinite;
        }
        @keyframes ap-spin { to { transform: rotate(360deg); } }

        /* block nav / submit */
        .ap-footer { margin-top: 28px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .ap-footer-row { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; width: 100%; }
        .ap-btn {
          padding: 12px 26px; border-radius: 999px; border: 1px solid var(--line);
          background: #fff; color: var(--ink-strong);
          font-family: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer;
          transition: background .2s, border-color .2s, transform .2s, opacity .2s;
        }
        .ap-btn:hover:not(:disabled) { background: var(--teal-50); border-color: var(--teal-300); transform: translateY(-1px); }
        .ap-btn.primary {
          border: none; color: #fff;
          background: linear-gradient(135deg, #fb923c, #ea580c);
          box-shadow: 0 12px 24px -10px rgba(234,88,12,.6);
        }
        .ap-btn.primary:hover:not(:disabled) { background: linear-gradient(135deg, #fb923c, #ea580c); }
        .ap-btn:disabled { opacity: .45; cursor: not-allowed; box-shadow: none; }
        .ap-hint { font-size: 12px; color: var(--muted); }

        /* result */
        .ap-result {
          display: flex; align-items: center; gap: 26px;
          padding: 26px; margin-bottom: 26px; border-radius: 16px;
          background: linear-gradient(135deg, #fff, var(--teal-50));
          border: 1.5px solid var(--teal-300);
        }
        .ap-ring { position: relative; flex: none; width: 112px; height: 112px; }
        .ap-ring svg { transform: rotate(-90deg); width: 112px; height: 112px; }
        .ap-ring-num {
          position: absolute; inset: 0; display: grid; place-items: center; text-align: center;
          font-size: 24px; font-weight: 800; line-height: 1;
        }
        .ap-ring-num small { display: block; margin-top: 4px; font-size: 10px; font-weight: 600; color: var(--muted); letter-spacing: .04em; }
        .ap-result h2 { margin: 0 0 6px; font-size: 18px; font-weight: 800; line-height: 1.3; }
        .ap-result p { margin: 0; font-size: 13.5px; line-height: 1.6; color: var(--muted); }
        .ap-result p strong { color: var(--teal-600); }
        .ap-result-actions { margin-top: 14px; display: flex; gap: 10px; flex-wrap: wrap; }
        .ap-link-btn {
          display: inline-flex; padding: 10px 18px; border-radius: 999px;
          border: 1px solid var(--line); background: #fff; color: var(--ink-strong);
          font-family: inherit; font-size: 13px; font-weight: 600; text-decoration: none; cursor: pointer;
        }
        .ap-link-btn.primary { border: none; color: #fff; background: linear-gradient(135deg, #fb923c, #ea580c); }

        /* ---------- right: question blocks ---------- */
        .ap-blocks { display: flex; flex-direction: column; gap: 12px; }
        .ap-block {
          width: 100%; display: flex; align-items: center; gap: 14px;
          padding: 14px 16px; border-radius: 10px; text-align: left;
          background: #fff; border: 1px solid transparent;
          font-family: inherit; cursor: pointer;
          transition: background .2s, border-color .2s;
        }
        .ap-block:hover { background: #f9fafb; }
        .ap-block.active { background: var(--teal-50); border-color: var(--teal-300); border-width: 1.5px; }
        .ap-block-num {
          flex: none; width: 24px; height: 24px; border-radius: 50%;
          display: grid; place-items: center;
          background: #e5e7eb; color: var(--ink); font-size: 11px; font-weight: 600;
        }
        .ap-block.active .ap-block-num { background: transparent; }
        .ap-block.done .ap-block-num { background: #dcfce7; color: #15803d; }
        .ap-block-main { flex: 1; min-width: 0; }
        .ap-block-main strong { display: block; font-size: 13px; font-weight: 500; color: var(--ink-strong); }
        .ap-block-main span { font-size: 11px; color: var(--muted); }
        .ap-block-count { font-size: 11px; color: var(--muted); align-self: flex-end; margin-right: 4px; }
        .ap-block-arrow { flex: none; color: var(--muted); }

        /* ---------- states ---------- */
        .ap-skel {
          height: 170px; border-radius: 12px; border: 1px solid var(--line); margin-bottom: 22px;
          background: linear-gradient(100deg, #fff 30%, var(--teal-50) 50%, #fff 70%);
          background-size: 200% 100%; animation: ap-shimmer 1.4s infinite linear;
        }
        @keyframes ap-shimmer { to { background-position: -200% 0; } }
        .ap-state {
          padding: 56px 24px; text-align: center; color: var(--muted);
          background: #fff; border: 1px dashed var(--teal-300); border-radius: 14px;
        }
        .ap-error { color: #b91c1c; margin: 0 0 4px; font-weight: 500; }

        @media (prefers-reduced-motion: reduce) {
          .ap-page * { animation: none !important; transition: none !important; }
        }

        /* ---------- responsive ---------- */
        @media (max-width: 1200px) {
          .ap-body { grid-template-columns: 300px minmax(0, 1fr) 280px; }
        }
        @media (max-width: 960px) {
          .ap-page { height: auto; min-height: 100vh; overflow: visible; }
          .ap-header { position: sticky; top: 0; padding: 0 14px; grid-template-columns: auto 1fr auto; gap: 10px; }
          .ap-logos img { height: 38px; }
          .ap-body { display: flex; flex-direction: column; }
          .ap-left, .ap-right, .ap-center { overflow: visible; border: none; }
          .ap-center { order: 2; }
          .ap-left { order: 1; }
          .ap-right { order: 3; padding: 22px; }
          .ap-mascot { display: none; }
          .ap-q { padding: 36px 18px 22px; }
          .ap-result { flex-direction: column; text-align: center; }
          .ap-result-actions { justify-content: center; }
        }
        @media (max-width: 560px) {
          .ap-back span { display: none; }
          .ap-head-right { display: none; }
          .ap-logos { justify-self: center; }
        }
      `}</style>

      {/* ---------------- Header ---------------- */}
      <header className="ap-header">
        <Link href="/questions" className="ap-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          <span>Back to Categories</span>
        </Link>

        <div className="ap-logos">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_SRC} alt="Athma Mind Care Hospital" onError={(e) => (e.currentTarget.style.display = "none")} />
          <span className="ap-logo-sep" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BADGE_SRC} alt="Accreditation" onError={(e) => (e.currentTarget.style.display = "none")} />
        </div>

        <div className="ap-head-right">
          {quiz && (
            <>
              <span className="ap-head-title">{quiz.title}</span>
              <span className="ap-head-pill">{typeLabel}</span>
            </>
          )}
        </div>
      </header>

      <div className="ap-body">
        {/* ---------------- Left: assessment info ---------------- */}
        <aside className="ap-left">
          <h3 className="ap-section-label">Assessment Info</h3>

          {quiz && (
            <>
              <div className="ap-info">
                <div className="ap-info-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="4" />
                    <path d="M9.5 9.5a2.5 2.5 0 0 1 4.9.6c0 1.6-2.4 2.4-2.4 2.4" />
                    <path d="M12 16.5h.01" />
                  </svg>
                </div>
                <h2>{quiz.title}</h2>
                <p className="ap-info-sub">{quiz.description}</p>

                <div className="ap-instr">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm5.4 12.6 6.3-6.3-1.4-1.4-4.9 4.9-2.1-2.1-1.4 1.4 3.5 3.5z" />
                  </svg>
                  <span>{instructionText}</span>
                </div>

                <div className="ap-info-chips">
                  <div className="ap-info-chip">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="4" />
                      <path d="M9.5 9.5a2.5 2.5 0 0 1 4.9.6c0 1.6-2.4 2.4-2.4 2.4" />
                      <path d="M12 16.5h.01" />
                    </svg>
                    {quiz.total_questions || totalQuestions} Questions
                  </div>
                  <div className="ap-info-chip">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 2" />
                    </svg>
                    {durationText}
                  </div>
                </div>
              </div>

              <div className="ap-overall">
                <div className="ap-stat-row">
                  <span>Overall progress</span>
                  <strong>{Math.round(progressPct)}%</strong>
                </div>
                <div className="ap-bar">
                  <div className="ap-bar-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="ap-stats">
                  <div className="ap-stat-row">
                    <span>Answered</span>
                    <strong>
                      {answeredCount} / {totalQuestions}
                    </strong>
                  </div>
                  <div className="ap-stat-row">
                    <span>Remaining</span>
                    <span className="ap-red">{remaining}</span>
                  </div>
                </div>
              </div>

              {nextQuizTitle && (
                <div className="ap-next">
                  <small>UP NEXT</small>
                  <span>{nextQuizTitle}</span>
                </div>
              )}

              <div className="ap-autosave">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="m8.5 12.5 2.5 2.5 4.5-5" />
                </svg>
                Answers are saved automatically
              </div>

              <div className="ap-mascot">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={MASCOT_SRC} alt="" onError={(e) => (e.currentTarget.style.display = "none")} />
                <p>Take your time, we&apos;re here with you</p>
              </div>
            </>
          )}
        </aside>

        {/* ---------------- Center: questions ---------------- */}
        <section className="ap-center" ref={centerRef}>
          <div className="ap-center-inner">
            {loading && (
              <>
                <div className="ap-skel" />
                <div className="ap-skel" />
                <div className="ap-skel" />
              </>
            )}

            {!loading && error && (
              <div className="ap-state">
                <p className="ap-error">{error}</p>
                <button className="ap-btn primary" style={{ marginTop: 14 }} onClick={loadQuiz}>
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && quiz && currentBlock && (
              <>
                {submitted && (
                  <div className="ap-result">
                    <div className="ap-ring">
                      <svg viewBox="0 0 128 128">
                        <defs>
                          <linearGradient id="ap-grad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#2dd4bf" />
                            <stop offset="100%" stopColor="#0d9488" />
                          </linearGradient>
                        </defs>
                        <circle cx="64" cy="64" r="52" fill="none" stroke="#ccfbf1" strokeWidth="12" />
                        <circle
                          cx="64"
                          cy="64"
                          r="52"
                          fill="none"
                          stroke="url(#ap-grad)"
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={RING_LEN}
                          strokeDashoffset={RING_LEN * (1 - scorePct / 100)}
                          style={{ transition: "stroke-dashoffset .8s ease" }}
                        />
                      </svg>
                      <div className="ap-ring-num">
                        <div>
                          {scorePct}%<small>SCORE</small>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2>Thank you for completing the assessment</h2>
                      <p>
                        Your responses have been recorded. Total score:{" "}
                        <strong>{totalScore}</strong> / {maxScore}
                      </p>
                      <p style={{ marginTop: 6, fontSize: 12.5 }}>
                        A clinician will review your results if needed.
                      </p>
                      <div className="ap-result-actions">
                        <Link href="/questions" className="ap-link-btn primary">
                          Back to quizzes
                        </Link>
                        <button
                          className="ap-link-btn"
                          onClick={() => {
                            setAnswers({});
                            setSaveStatus({});
                            setChosenText({});
                            setSubmitted(false);
                            setActiveBlock(0);
                            try {
                              localStorage.removeItem(STORAGE_KEY(quizId));
                            } catch {
                              /* ignore */
                            }
                            scrollCenterTop();
                            router.refresh();
                          }}
                        >
                          Retake
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {currentBlock.questions.map((q, i) => {
                  const number = currentBlock.start + i;
                  return (
                    <div
                      className={`ap-q${answers[q.id] !== undefined ? " answered" : ""}`}
                      key={q.id}
                    >
                      <div className="ap-qnum">{number}</div>
                      {renderSaveBadge(q.id)}

                      <p className="ap-q-en">{q.question_text}</p>
                      {q.question_text_ta && (
                        <p className="ap-q-ta">{q.question_text_ta}</p>
                      )}

                      <div className="ap-options">
                        {q.options.map((option, optIndex) => {
                          const score = q.scores[optIndex];
                          const selected =
                            chosenText[q.id] === option ||
                            (answers[q.id] === score &&
                              chosenText[q.id] === undefined);
                          const ta = getOptionTamil(q, optIndex, option);
                          return (
                            <label
                              key={optIndex}
                              className={`ap-opt${selected ? " selected" : ""}${
                                submitted ? " locked" : ""
                              }`}
                            >
                              <input
                                type="radio"
                                name={`question-${q.id}`}
                                value={score}
                                checked={selected}
                                onChange={() => handleSelect(q, score, option)}
                                disabled={submitted}
                              />
                              <span className="ap-opt-pill">
                                <span>{option}</span>
                                {ta && (
                                  <>
                                    <span className="ap-opt-sep" />
                                    <span className="ap-opt-ta">{ta}</span>
                                  </>
                                )}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <div className="ap-footer">
                  <div className="ap-footer-row">
                    {activeBlock > 0 && (
                      <button className="ap-btn" onClick={() => goToBlock(activeBlock - 1)}>
                        ← Previous block
                      </button>
                    )}
                    {activeBlock < blocks.length - 1 && (
                      <button className="ap-btn primary" onClick={() => goToBlock(activeBlock + 1)}>
                        Next block →
                      </button>
                    )}
                    {activeBlock === blocks.length - 1 && !submitted && (
                      <button
                        className="ap-btn primary"
                        onClick={handleSubmit}
                        disabled={submitting || !allAnswered}
                      >
                        {submitting ? "Submitting..." : "Submit answers"}
                      </button>
                    )}
                  </div>
                  {activeBlock === blocks.length - 1 && !submitted && !allAnswered && (
                    <span className="ap-hint">
                      {remaining} question{remaining > 1 ? "s" : ""} remaining
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* ---------------- Right: question blocks ---------------- */}
        <aside className="ap-right">
          <h3 className="ap-section-label">Question Blocks</h3>
          <div className="ap-blocks">
            {blocks.map((b) => {
              const done = blockAnswered(b);
              const isActive = b.index === activeBlock;
              const isDone = done === b.questions.length;
              return (
                <button
                  key={b.index}
                  type="button"
                  className={`ap-block${isActive ? " active" : ""}${isDone ? " done" : ""}`}
                  onClick={() => goToBlock(b.index)}
                >
                  <span className="ap-block-num">{isDone ? "✓" : b.index + 1}</span>
                  <span className="ap-block-main">
                    <strong>
                      Q {b.start} - {b.end}
                    </strong>
                    <span>{b.questions.length} questions</span>
                  </span>
                  <span className="ap-block-count">
                    {done}/{b.questions.length}
                  </span>
                  <svg className="ap-block-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {isActive ? <path d="m6 9 6 6 6-6" /> : <path d="m9 6 6 6-6 6" />}
                  </svg>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </main>
  );
}

export default function QuizQuestionsPage() {
  return (
    <Suspense
      fallback={<main style={{ minHeight: "100vh", background: "#fff" }} />}
    >
      <QuizQuestions />
    </Suspense>
  );
}