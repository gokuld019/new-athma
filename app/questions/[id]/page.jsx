"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_BASE = "https://api.crazystory.in/api/patient/quizzes";
const SAVE_ANSWER_URL = "https://api.crazystory.in/api/patient/answer/save";

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

  // { [questionId]: score }
  const [answers, setAnswers] = useState({});
  // { [questionId]: "saving" | "saved" | "error" }
  const [saveStatus, setSaveStatus] = useState({});
  // { [questionId]: answer_text chosen (for reference) }
  const [chosenText, setChosenText] = useState({});

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

      setQuiz(data.quiz);
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

  const scrollTop = () => {
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
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || (data && data.success === false)) {
        throw new Error((data && data.message) || `Save failed (${res.status})`);
      }

      setSaveStatus((prev) => ({ ...prev, [questionId]: "saved" }));
    } catch (err) {
      console.warn("saveAnswer failed:", err.message);
      setSaveStatus((prev) => ({ ...prev, [questionId]: "error" }));
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
      alert(`Please answer all questions. (${unanswered.length} remaining)`);
      return;
    }

    setSubmitting(true);
    try {
      // Wait a moment if any are still saving so we don't cut them off
      const stillSaving = Object.values(saveStatus).includes("saving");
      if (stillSaving) {
        // small wait — the requests are already in-flight
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

      setSubmitted(true);
      scrollTop();
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = quiz?.questions?.length || 0;
  const progressPct = totalQuestions
    ? (answeredCount / totalQuestions) * 100
    : 0;

  const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);
  const maxScore = quiz
    ? quiz.questions.reduce(
        (sum, q) => sum + Math.max(...(q.scores?.length ? q.scores : [0])),
        0
      )
    : 0;

  const scorePct = maxScore ? Math.round((totalScore / maxScore) * 100) : 0;
  const RING_LEN = 2 * Math.PI * 52;

  const renderSaveBadge = (qid) => {
    const s = saveStatus[qid];
    if (!s) return null;
    if (s === "saving") {
      return (
        <span className="qd-badge qd-badge-saving" title="Saving…">
          <span className="qd-spin" /> Saving
        </span>
      );
    }
    if (s === "saved") {
      return (
        <span className="qd-badge qd-badge-saved" title="Saved">
          ✓ Saved
        </span>
      );
    }
    return (
      <span className="qd-badge qd-badge-error" title="Failed to save">
        ! Retry
      </span>
    );
  };

  return (
    <main className="qd-page">
      <style>{`
        .qd-page {
          --o-50: #fff7ed;
          --o-100: #ffedd5;
          --o-200: #fed7aa;
          --o-500: #f97316;
          --o-600: #ea580c;
          --o-700: #c2410c;
          --ink: #1c1917;
          --muted: #78716c;
          --line: #f1e7df;
          min-height: 100vh;
          padding: 48px 24px 96px;
          font-family: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
          color: var(--ink);
          background:
            radial-gradient(900px 400px at 85% -10%, rgba(249,115,22,.14), transparent 60%),
            radial-gradient(700px 360px at -10% 0%, rgba(251,146,60,.10), transparent 60%),
            #fffdfb;
        }
        .qd-wrap { max-width: 800px; margin: 0 auto; }

        .qd-back {
          display: inline-flex; align-items: center; gap: 8px;
          margin-bottom: 28px; padding: 8px 16px; border-radius: 999px;
          background: #fff; border: 1px solid var(--line);
          font-size: 13px; font-weight: 600; color: var(--o-700); text-decoration: none;
          transition: background .2s, border-color .2s, transform .2s;
        }
        .qd-back:hover { background: var(--o-50); border-color: var(--o-200); transform: translateX(-2px); }

        /* header */
        .qd-cat {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 14px; border-radius: 999px;
          background: var(--o-100); color: var(--o-700);
          font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase;
        }
        .qd-cat::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--o-500); }
        .qd-title {
          margin: 16px 0 10px;
          font-size: clamp(28px, 4.6vw, 40px);
          font-weight: 700; letter-spacing: -0.03em; line-height: 1.15;
        }
        .qd-desc { margin: 0 0 18px; font-size: 16px; line-height: 1.65; color: var(--muted); max-width: 620px; }
        .qd-meta { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 28px; }
        .qd-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 999px;
          background: #fff; border: 1px solid var(--line);
          font-size: 13px; font-weight: 500; color: var(--muted);
        }
        .qd-chip svg { color: var(--o-500); }

        /* progress */
        .qd-progress-wrap {
          position: sticky; top: 0; z-index: 10;
          margin: 0 -8px 24px; padding: 14px 8px;
          background: rgba(255,253,251,.85);
          backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--line);
        }
        .qd-progress-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 13px; font-weight: 600; }
        .qd-progress-row span:first-child { color: var(--ink); }
        .qd-progress-row span:last-child { color: var(--o-600); }
        .qd-progress-bar { height: 8px; background: var(--o-100); border-radius: 999px; overflow: hidden; }
        .qd-progress-fill {
          height: 100%; border-radius: 999px;
          background: linear-gradient(90deg, #fb923c, #ea580c);
          transition: width .35s ease;
        }

        /* question */
        .qd-question {
          position: relative; padding: 26px; margin-bottom: 20px;
          border-radius: 20px; background: #fff; border: 1px solid var(--line);
          box-shadow: 0 1px 2px rgba(28,25,23,.04);
          transition: border-color .25s ease, box-shadow .25s ease;
        }
        .qd-question.answered { border-color: var(--o-200); box-shadow: 0 12px 28px -16px rgba(234,88,12,.25); }
        .qd-qhead { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 18px; }
        .qd-qnum {
          flex: none; width: 36px; height: 36px; border-radius: 12px;
          display: grid; place-items: center;
          background: var(--o-50); color: var(--o-700); border: 1px solid var(--o-100);
          font-size: 14px; font-weight: 700;
          transition: background .25s, color .25s, border-color .25s;
        }
        .qd-question.answered .qd-qnum {
          background: linear-gradient(135deg, #fb923c, #ea580c); color: #fff; border-color: transparent;
          box-shadow: 0 8px 16px -6px rgba(234,88,12,.5);
        }
        .qd-qtext { margin: 0; font-size: 17px; font-weight: 700; line-height: 1.45; letter-spacing: -0.01em; }
        .qd-qtext-ta { margin: 6px 0 0; font-size: 14px; line-height: 1.6; color: var(--muted); }

        .qd-options { display: flex; flex-direction: column; gap: 10px; }
        .qd-option {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 16px; border-radius: 14px;
          background: #fff; border: 1.5px solid var(--line);
          font-size: 14.5px; font-weight: 500; line-height: 1.4;
          cursor: pointer;
          transition: background .2s, border-color .2s, transform .2s, box-shadow .2s;
        }
        .qd-option:hover { background: var(--o-50); border-color: var(--o-200); }
        .qd-option.selected {
          background: var(--o-50); border-color: var(--o-500);
          box-shadow: 0 0 0 4px rgba(249,115,22,.12);
        }
        .qd-option.locked { cursor: default; }
        .qd-option.locked:not(.selected):hover { background: #fff; border-color: var(--line); }
        .qd-option input { position: absolute; opacity: 0; pointer-events: none; }
        .qd-radio {
          flex: none; width: 20px; height: 20px; border-radius: 50%;
          border: 2px solid #d6cbc2; background: #fff;
          display: grid; place-items: center;
          transition: border-color .2s, background .2s;
        }
        .qd-radio::after {
          content: ""; width: 8px; height: 8px; border-radius: 50%; background: #fff;
          transform: scale(0); transition: transform .2s ease;
        }
        .qd-option.selected .qd-radio { border-color: var(--o-500); background: var(--o-500); }
        .qd-option.selected .qd-radio::after { transform: scale(1); }

        /* save badge */
        .qd-badge {
          display: inline-flex; align-items: center; gap: 6px;
          margin-left: auto; padding: 4px 10px; border-radius: 999px;
          font-size: 11px; font-weight: 700; letter-spacing: .03em; white-space: nowrap;
        }
        .qd-badge-saving { background: #fff7ed; color: var(--o-700); }
        .qd-badge-saved  { background: #ecfdf5; color: #047857; }
        .qd-badge-error  { background: #fef2f2; color: #b91c1c; cursor: pointer; }
        .qd-spin {
          width: 10px; height: 10px; border-radius: 50%;
          border: 2px solid currentColor; border-right-color: transparent;
          animation: qd-spin .7s linear infinite;
        }
        @keyframes qd-spin { to { transform: rotate(360deg); } }

        /* submit */
        .qd-footer { margin-top: 32px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .qd-submit {
          width: 100%; max-width: 360px; padding: 15px 28px; border: none; border-radius: 14px;
          background: linear-gradient(135deg, #fb923c, #ea580c); color: #fff;
          font-family: inherit; font-size: 15px; font-weight: 700; cursor: pointer;
          box-shadow: 0 14px 28px -10px rgba(234,88,12,.6);
          transition: transform .2s, box-shadow .2s, opacity .2s;
        }
        .qd-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 18px 32px -10px rgba(234,88,12,.7); }
        .qd-submit:disabled { opacity: .6; cursor: not-allowed; }
        .qd-hint { font-size: 13px; color: var(--muted); }

        /* result */
        .qd-result {
          display: flex; align-items: center; gap: 32px;
          padding: 32px; margin-bottom: 28px; border-radius: 24px;
          background: linear-gradient(135deg, #fff, var(--o-50));
          border: 1px solid var(--o-200);
          box-shadow: 0 24px 48px -24px rgba(234,88,12,.3);
        }
        .qd-ring { position: relative; flex: none; width: 128px; height: 128px; }
        .qd-ring svg { transform: rotate(-90deg); }
        .qd-ring-num {
          position: absolute; inset: 0; display: grid; place-items: center; text-align: center;
          font-size: 28px; font-weight: 800; letter-spacing: -0.03em; line-height: 1;
        }
        .qd-ring-num small { display: block; margin-top: 4px; font-size: 11px; font-weight: 600; color: var(--muted); letter-spacing: .04em; }
        .qd-result h2 { margin: 0 0 8px; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.25; }
        .qd-result p { margin: 0; font-size: 15px; line-height: 1.6; color: var(--muted); }
        .qd-result p strong { color: var(--o-600); font-weight: 700; }
        .qd-note { margin-top: 8px !important; font-size: 13px !important; }
        .qd-result-actions { margin-top: 18px; display: flex; gap: 10px; flex-wrap: wrap; }
        .qd-link-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 11px 20px; border-radius: 12px; border: 1.5px solid var(--o-200);
          background: #fff; color: var(--o-700);
          font-family: inherit; font-size: 14px; font-weight: 600; text-decoration: none; cursor: pointer;
          transition: background .2s, border-color .2s, transform .2s;
        }
        .qd-link-btn:hover { background: var(--o-50); border-color: var(--o-500); transform: translateY(-2px); }
        .qd-link-btn.primary {
          border: none; color: #fff;
          background: linear-gradient(135deg, #fb923c, #ea580c);
          box-shadow: 0 10px 20px -8px rgba(234,88,12,.6);
        }

        /* states */
        .qd-skel {
          border-radius: 20px; border: 1px solid var(--line); margin-bottom: 18px;
          background: linear-gradient(100deg, #fff 30%, var(--o-50) 50%, #fff 70%);
          background-size: 200% 100%; animation: qd-shimmer 1.4s infinite linear;
        }
        @keyframes qd-shimmer { to { background-position: -200% 0; } }
        .qd-state {
          padding: 56px 24px; text-align: center; color: var(--muted);
          background: #fff; border: 1px dashed var(--o-200); border-radius: 20px;
        }
        .qd-error { color: #b91c1c; margin: 0 0 4px; font-weight: 500; }
        .qd-btn {
          margin-top: 16px; padding: 11px 24px; border: none; border-radius: 12px;
          background: linear-gradient(135deg, #fb923c, #ea580c); color: #fff;
          font-family: inherit; font-weight: 600; font-size: 14px; cursor: pointer;
          box-shadow: 0 10px 20px -8px rgba(234,88,12,.6);
          transition: transform .2s, box-shadow .2s;
        }
        .qd-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 24px -8px rgba(234,88,12,.7); }

        @media (max-width: 600px) {
          .qd-page { padding: 28px 16px 72px; }
          .qd-question { padding: 20px 16px; }
          .qd-qtext { font-size: 16px; }
          .qd-result { flex-direction: column; text-align: center; padding: 28px 20px; gap: 20px; }
          .qd-result-actions { justify-content: center; }
        }
      `}</style>

      <div className="qd-wrap">
        <Link href="/questions" className="qd-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Back to quizzes
        </Link>

        {loading && (
          <>
            <div className="qd-skel" style={{ height: 150 }} />
            <div className="qd-skel" style={{ height: 230 }} />
            <div className="qd-skel" style={{ height: 230 }} />
          </>
        )}

        {!loading && error && (
          <div className="qd-state">
            <p className="qd-error">{error}</p>
            <button className="qd-btn" onClick={loadQuiz}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && quiz && (
          <>
            {submitted && (
              <div className="qd-result">
                <div className="qd-ring">
                  <svg width="128" height="128" viewBox="0 0 128 128">
                    <defs>
                      <linearGradient id="qd-grad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#fb923c" />
                        <stop offset="100%" stopColor="#ea580c" />
                      </linearGradient>
                    </defs>
                    <circle cx="64" cy="64" r="52" fill="none" stroke="#ffedd5" strokeWidth="12" />
                    <circle
                      cx="64"
                      cy="64"
                      r="52"
                      fill="none"
                      stroke="url(#qd-grad)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={RING_LEN}
                      strokeDashoffset={RING_LEN * (1 - scorePct / 100)}
                      style={{ transition: "stroke-dashoffset .8s ease" }}
                    />
                  </svg>
                  <div className="qd-ring-num">
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
                  <p className="qd-note">
                    A clinician will review your results if needed.
                  </p>
                  <div className="qd-result-actions">
                    <Link href="/questions" className="qd-link-btn primary">
                      Back to quizzes
                    </Link>
                    <button
                      className="qd-link-btn"
                      onClick={() => {
                        setAnswers({});
                        setSaveStatus({});
                        setChosenText({});
                        setSubmitted(false);
                        scrollTop();
                        router.refresh();
                      }}
                    >
                      Retake
                    </button>
                  </div>
                </div>
              </div>
            )}

            <span className="qd-cat">{quiz.category}</span>
            <h1 className="qd-title">{quiz.title}</h1>
            <p className="qd-desc">{quiz.description}</p>

            <div className="qd-meta">
              <span className="qd-chip">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <path d="M12 17h.01" />
                </svg>
                {quiz.total_questions} questions
              </span>
              <span className="qd-chip">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4" />
                  <path d="M8 2v4" />
                  <path d="M3 10h18" />
                </svg>
                Measures over the past month
              </span>
            </div>

            <div className="qd-progress-wrap">
              <div className="qd-progress-row">
                <span>
                  {answeredCount} of {totalQuestions} answered
                </span>
                <span>{Math.round(progressPct)}%</span>
              </div>
              <div className="qd-progress-bar">
                <div
                  className="qd-progress-fill"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {quiz.questions
              .slice()
              .sort((a, b) => a.display_order - b.display_order)
              .map((q, index) => (
                <div
                  className={`qd-question${
                    answers[q.id] !== undefined ? " answered" : ""
                  }`}
                  key={q.id}
                >
                  <div className="qd-qhead">
                    <div className="qd-qnum">{index + 1}</div>
                    <div style={{ flex: 1 }}>
                      <p className="qd-qtext">{q.question_text}</p>
                      {q.question_text_ta && (
                        <p className="qd-qtext-ta">{q.question_text_ta}</p>
                      )}
                    </div>
                    {renderSaveBadge(q.id)}
                  </div>

                  <div className="qd-options">
                    {q.options.map((option, optIndex) => {
                      const score = q.scores[optIndex];
                      const selected =
                        chosenText[q.id] === option ||
                        (answers[q.id] === score &&
                          chosenText[q.id] === undefined);
                      return (
                        <label
                          key={optIndex}
                          className={`qd-option${selected ? " selected" : ""}${
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
                          <span className="qd-radio" />
                          <span>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

            {!submitted && (
              <div className="qd-footer">
                <button
                  className="qd-submit"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit answers"}
                </button>
                <span className="qd-hint">
                  {totalQuestions - answeredCount > 0
                    ? `${totalQuestions - answeredCount} question${
                        totalQuestions - answeredCount > 1 ? "s" : ""
                      } remaining`
                    : "All answered. Ready to submit."}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function QuizQuestionsPage() {
  return (
    <Suspense
      fallback={
        <main style={{ minHeight: "100vh", background: "#fffdfb" }} />
      }
    >
      <QuizQuestions />
    </Suspense>
  );
}