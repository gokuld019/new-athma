"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = "https://api.crazystory.in/api/patient/quizzes";
const LOGOUT_URL = "https://api.crazystory.in/api/patient/logout";

export default function QuestionsPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const loadQuizzes = async () => {
    setLoading(true);
    setError("");
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("athma_token") : null;

      const res = await fetch(API_URL, {
        headers: {
          Accept: "application/json",
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

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("athma_token") : null;

      // Fire API call but proceed with local cleanup regardless of result
      await fetch(LOGOUT_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }).catch(() => null);

      if (typeof window !== "undefined") {
        localStorage.removeItem("athma_token");
      }
      
      // Redirect to login page
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      // Still clear local state even if API fails
      if (typeof window !== "undefined") {
        localStorage.removeItem("athma_token");
        router.push("/login");
      }
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

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

        /* header row with logout */
        .q-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          margin-bottom: 40px;
        }
        
        .q-head { flex: 1; }
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

        /* sleek logout button */
        .q-logout-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 12px;
          background: #fff;
          border: 1.5px solid var(--line);
          color: var(--muted);
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          transition: all 0.25s ease;
          flex-shrink: 0;
          margin-top: 8px;
        }
        .q-logout-btn:hover {
          background: #fef2f2;
          border-color: #fecaca;
          color: #b91c1c;
          transform: translateY(-1px);
          box-shadow: 0 6px 12px -4px rgba(220, 38, 38, 0.15);
        }
        .q-logout-btn:active {
          transform: translateY(0);
        }
        .q-logout-btn svg {
          transition: transform 0.25s ease;
        }
        .q-logout-btn:hover svg {
          transform: translateX(2px);
        }

        /* grid & cards */
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

        /* modal overlay for logout confirm */
        .q-modal-overlay {
          position: fixed; inset: 0; z-index: 50;
          background: rgba(28, 25, 23, 0.4);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          animation: q-fade-in 0.2s ease;
        }
        @keyframes q-fade-in { from { opacity: 0; } to { opacity: 1; } }
        
        .q-modal {
          background: #fff; border-radius: 20px; padding: 28px;
          width: 100%; max-width: 400px;
          box-shadow: 0 24px 48px -12px rgba(28, 25, 23, 0.25);
          animation: q-slide-up 0.3s ease;
          text-align: center;
        }
        @keyframes q-slide-up { 
          from { opacity: 0; transform: translateY(10px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        
        .q-modal-icon {
          width: 48px; height: 48px; border-radius: 50%;
          background: #fef2f2; color: #dc2626;
          display: grid; place-items: center;
          margin: 0 auto 16px;
        }
        .q-modal h2 {
          margin: 0 0 8px; font-size: 20px; font-weight: 700; color: var(--ink);
        }
        .q-modal p {
          margin: 0 0 24px; font-size: 14.5px; line-height: 1.5; color: var(--muted);
        }
        .q-modal-actions {
          display: flex; gap: 12px;
        }
        .q-modal-btn {
          flex: 1; padding: 12px; border-radius: 12px;
          font-family: inherit; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: all 0.2s ease;
        }
        .q-modal-btn.cancel {
          background: #f5f5f5; color: var(--ink); border: none;
        }
        .q-modal-btn.cancel:hover { background: #e5e5e5; }
        .q-modal-btn.danger {
          background: #dc2626; color: #fff; border: none;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }
        .q-modal-btn.danger:hover { background: #b91c1c; box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4); }
        .q-modal-btn.danger:disabled { opacity: 0.7; cursor: not-allowed; }

        @media (max-width: 600px) {
          .q-page { padding: 40px 16px 60px; }
          .q-grid { grid-template-columns: 1fr; }
          .q-header-row { flex-direction: column; align-items: flex-start; gap: 16px; }
          .q-logout-btn { margin-top: 0; }
        }
      `}</style>

      <div className="q-wrap">
        <div className="q-header-row">
          <header className="q-head">
            <span className="q-eyebrow">Assessments</span>
            <h1 className="q-title">
              Take a <span>Quiz</span>
            </h1>
            <p className="q-sub">
              Choose an assessment below to begin. It only takes a few minutes.
            </p>
          </header>

          <button 
            className="q-logout-btn" 
            onClick={() => setShowLogoutConfirm(true)}
            aria-label="Log out"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log out
          </button>
        </div>

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

      {/* Modern Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="q-modal-overlay">
          <div className="q-modal">
            <div className="q-modal-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <h2>Log out?</h2>
            <p>Are you sure you want to log out of your account? You will need to log back in to access your quizzes.</p>
            <div className="q-modal-actions">
              <button 
                className="q-modal-btn cancel" 
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
              >
                Cancel
              </button>
              <button 
                className="q-modal-btn danger" 
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? "Logging out..." : "Yes, log out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}