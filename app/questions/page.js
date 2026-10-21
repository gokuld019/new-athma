"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL = "https://api.crazystory.in/api/patient/quizzes";

export default function QuestionsPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadQuizzes = async () => {
    setLoading(true);
    setError("");
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const res = await fetch(API_URL, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error(`Request failed (${res.status})`);

      const data = await res.json();
      if (!data.success) throw new Error("Could not load quizzes");

      setQuizzes(data.quizzes || []);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  return (
    <main className="q-page">
      <style>{`
        .q-page {
          --o-50: #fff7ed;
          --o-100: #ffedd5;
          --o-200: #fed7aa;
          --o-500: #f97316;
          --o-600: #ea580c;
          --o-700: #c2410c;
          --ink: #1c1917;
          --muted: #78716c;
          min-height: 100vh;
          padding: 64px 24px 80px;
          font-family: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
          color: var(--ink);
          background:
            radial-gradient(900px 400px at 85% -10%, rgba(249,115,22,.14), transparent 60%),
            radial-gradient(700px 360px at -10% 0%, rgba(251,146,60,.10), transparent 60%),
            #fffdfb;
        }
        .q-wrap { max-width: 1120px; margin: 0 auto; }

        .q-head { margin-bottom: 40px; }
        .q-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 14px; border-radius: 999px;
          background: var(--o-100); color: var(--o-700);
          font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase;
        }
        .q-eyebrow::before {
          content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--o-500);
        }
        .q-title {
          margin: 16px 0 10px;
          font-size: clamp(32px, 5vw, 46px);
          font-weight: 700; letter-spacing: -0.03em; line-height: 1.1;
        }
        .q-title span {
          background: linear-gradient(90deg, #f97316, #ea580c);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .q-sub { margin: 0; font-size: 16px; color: var(--muted); max-width: 520px; line-height: 1.6; }

        .q-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 22px; }

        .q-card {
          position: relative; display: flex; flex-direction: column; gap: 14px;
          padding: 24px; border-radius: 20px; overflow: hidden;
          background: #fff; border: 1px solid #f1e7df;
          text-decoration: none; color: inherit;
          box-shadow: 0 1px 2px rgba(28,25,23,.04);
          transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
        }
        .q-card::before {
          content: ""; position: absolute; left: 0; top: 0; right: 0; height: 4px;
          background: linear-gradient(90deg, #fb923c, #ea580c);
          transform: scaleX(0); transform-origin: left; transition: transform .35s ease;
        }
        .q-card:hover {
          transform: translateY(-6px);
          border-color: var(--o-200);
          box-shadow: 0 20px 40px -12px rgba(234,88,12,.25);
        }
        .q-card:hover::before { transform: scaleX(1); }

        .q-top { display: flex; align-items: center; justify-content: space-between; }
        .q-icon {
          width: 44px; height: 44px; border-radius: 14px;
          display: grid; place-items: center;
          background: linear-gradient(135deg, #fb923c, #ea580c); color: #fff;
          box-shadow: 0 8px 16px -6px rgba(234,88,12,.5);
        }
        .q-cat {
          font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 999px;
          background: var(--o-50); color: var(--o-700); border: 1px solid var(--o-100);
        }

        .q-card h3 { margin: 4px 0 0; font-size: 19px; font-weight: 700; line-height: 1.35; letter-spacing: -0.01em; }
        .q-desc {
          margin: 0; font-size: 14.5px; line-height: 1.6; color: var(--muted); flex: 1;
          display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
        }

        .q-foot {
          display: flex; justify-content: space-between; align-items: center;
          padding-top: 16px; border-top: 1px dashed #f1e7df;
        }
        .q-count { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: var(--muted); }
        .q-start {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 14px; font-weight: 600; color: var(--o-600);
        }
        .q-start svg { transition: transform .25s ease; }
        .q-card:hover .q-start svg { transform: translateX(4px); }

        /* skeleton */
        .q-skel { height: 236px; border-radius: 20px; border: 1px solid #f1e7df;
          background: linear-gradient(100deg, #fff 30%, var(--o-50) 50%, #fff 70%);
          background-size: 200% 100%; animation: q-shimmer 1.4s infinite linear; }
        @keyframes q-shimmer { to { background-position: -200% 0; } }

        .q-state {
          padding: 56px 24px; text-align: center; color: var(--muted);
          background: #fff; border: 1px dashed var(--o-200); border-radius: 20px;
        }
        .q-error { color: #b91c1c; margin: 0 0 4px; font-weight: 500; }
        .q-btn {
          margin-top: 16px; padding: 11px 24px; border: none; border-radius: 12px;
          background: linear-gradient(135deg, #fb923c, #ea580c); color: #fff;
          font-weight: 600; font-size: 14px; cursor: pointer;
          box-shadow: 0 10px 20px -8px rgba(234,88,12,.6);
          transition: transform .2s, box-shadow .2s;
        }
        .q-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 24px -8px rgba(234,88,12,.7); }

        @media (max-width: 600px) {
          .q-page { padding: 40px 16px 60px; }
          .q-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="q-wrap">
        <header className="q-head">
          <span className="q-eyebrow">Assessments</span>
          <h1 className="q-title">
            Take a <span>Quiz</span>
          </h1>
          <p className="q-sub">
            Choose an assessment below to begin. It only takes a few minutes.
          </p>
        </header>

        {loading && (
          <div className="q-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="q-skel" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="q-state">
            <p className="q-error">{error}</p>
            <button className="q-btn" onClick={loadQuizzes}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && quizzes.length === 0 && (
          <div className="q-state">No quizzes available.</div>
        )}

        {!loading && !error && quizzes.length > 0 && (
          <div className="q-grid">
            {quizzes.map((quiz) => (
              <Link
                key={quiz.id}
                href={`/questions/${quiz.id}`}
                className="q-card"
              >
                <div className="q-top">
                  <div className="q-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 11l3 3L22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  </div>
                  <span className="q-cat">{quiz.category}</span>
                </div>

                <h3>{quiz.title}</h3>
                <p className="q-desc">{quiz.description}</p>

                <div className="q-foot">
                  <span className="q-count">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <path d="M12 17h.01" />
                    </svg>
                    {quiz.total_questions} questions
                  </span>
                  <span className="q-start">
                    Start
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}