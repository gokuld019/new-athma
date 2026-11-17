"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const BASE_URL = "https://api.crazystory.in/api/admin";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "-";

// options / scores usually arrive as arrays, but accept a JSON string too
const toList = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const typeLabel = (t) => {
  if (!t) return "Question";
  const s = String(t).replace(/[_-]/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

// Format snake_case keys to Title Case (e.g. "appraisal_of_own_emotions" -> "Appraisal Of Own Emotions")
const formatKey = (key) =>
  key.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

const SearchIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);
const QuestionIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);
const BackIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
const ChevronRight = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
);
const CheckIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
const ClipboardIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M9 14l2 2 4-4" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Page: quiz list  ->  full quiz page (same file)                    */
/* ------------------------------------------------------------------ */
export default function QuestionsPage() {
  const router = useRouter();

  // quiz list
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  // quiz page: questions of the selected quiz (null = show the list)
  const [selected, setSelected] = useState(null);
  const [qs, setQs] = useState({ loading: false, error: "", title: "", list: [] });
  const [lang, setLang] = useState("en");
  const [qSearch, setQSearch] = useState("");

  // NEW: report state for the specific quiz
  const [attemptId, setAttemptId] = useState("");
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  const reqRef = useRef(0); // ignores stale responses when you switch quickly

  // GET helper (adds the admin token, handles expired sessions)
  const api = useCallback(
    async (path) => {
      const token = localStorage.getItem("athma_token");
      const res = await fetch(`${BASE_URL}${path}`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem("athma_token");
        localStorage.removeItem("athma_role");
        localStorage.removeItem("athma_user");
        router.replace("/admin/login");
        throw new Error("Your session has expired. Please sign in again.");
      }

      const data = await res.json().catch(() => null);
      // these APIs return status: true, other admin APIs return status: "success"
      const failed = !data || data.status === false || data.status === "error";
      if (!res.ok || failed) {
        throw new Error(data?.message || "Something went wrong. Please try again.");
      }
      return data;
    },
    [router]
  );

  /* ---------- 1. quizzes ---------- */
  const loadQuizzes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api("/quizzes");
      setQuizzes(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  /* ---------- 2. questions of one quiz ---------- */
  const loadQuestions = useCallback(
    async (z) => {
      const id = ++reqRef.current;
      setQs({ loading: true, error: "", title: z.title, list: [] });

      try {
        const data = await api(`/quizzes/${z.id}/questions`);
        if (id !== reqRef.current) return;
        const list = Array.isArray(data.data) ? [...data.data] : [];
        list.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
        setQs({ loading: false, error: "", title: data.quiz_title || z.title, list });
      } catch (err) {
        if (id !== reqRef.current) return;
        setQs({ loading: false, error: err.message, title: z.title, list: [] });
      }
    },
    [api]
  );

  const openQuiz = (z) => {
    setSelected(z);
    setQSearch("");
    setAttemptId(""); // Reset report state when switching quizzes
    setReportData(null);
    setReportError("");
    window.scrollTo({ top: 0 });
    loadQuestions(z);
  };

  const closeQuiz = () => {
    reqRef.current++;
    setSelected(null);
    window.scrollTo({ top: 0 });
  };

  /* ---------- 3. fetch report for specific attempt ---------- */
  const fetchReport = async () => {
    if (!attemptId.trim()) return;
    setReportLoading(true);
    setReportError("");
    setReportData(null);

    try {
      // Using the specific endpoint provided in your prompt
      const data = await api(`/attempt/${attemptId.trim()}/first-quiz-report`);
      setReportData(data);
    } catch (err) {
      setReportError(err.message);
    } finally {
      setReportLoading(false);
    }
  };

  /* ---------- derived ---------- */
  const totals = useMemo(
    () => ({
      quizzes: quizzes.length,
      questions: quizzes.reduce((sum, q) => sum + (q.questions_count ?? q.total_questions ?? 0), 0),
      active: quizzes.filter((q) => q.is_active).length,
    }),
    [quizzes]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return quizzes.filter((z) => {
      const matchQ =
        !q ||
        [z.title, z.category, z.description]
          .filter(Boolean)
          .some((f) => String(f).toLowerCase().includes(q));
      const matchF =
        filter === "All" || (filter === "Active" && z.is_active) || (filter === "Inactive" && !z.is_active);
      return matchQ && matchF;
    });
  }, [quizzes, query, filter]);

  const visibleQs = useMemo(() => {
    const q = qSearch.trim().toLowerCase();
    if (!q) return qs.list;
    return qs.list.filter((item) =>
      [item.question_text, item.question_text_ta].filter(Boolean).some((t) => t.toLowerCase().includes(q))
    );
  }, [qs.list, qSearch]);

  /* ---------------------------------------------------------------- */
  return (
    <div className="qt">
      <style>{`
        /* ---------- flat overrides for shared admin classes ---------- */
        .qt .ad-panel { background: #fff; border: 1px solid var(--line); border-radius: 12px; box-shadow: none; }
        .qt .ad-search { border-radius: 8px; border: 1px solid var(--line); background: #fff; }
        .qt .ad-search input { font-size: 13px; }
        .qt .ad-chip {
          padding: 6px 12px; border-radius: 8px; border: 1px solid var(--line); background: #fff;
          color: var(--ink-2); font-size: 12px; font-weight: 500; box-shadow: none;
        }
        .qt .ad-chip:hover { background: var(--o-50); }
        .qt .ad-chip.on { background: var(--o-50); border-color: var(--o-500); color: var(--o-700); font-weight: 600; }
        .qt .ad-pill { padding: 3px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 600; }
        .qt .ad-pill.ok { background: var(--o-100); color: var(--o-700); }
        .qt .ad-pill.alert { background: #f5f5f4; color: var(--muted); }
        .qt .ad-q-cat {
          display: inline-block; padding: 3px 10px; border-radius: 6px; background: var(--o-50);
          border: 1px solid var(--o-100); color: var(--o-700); font-size: 11.5px; font-weight: 600;
        }
        .qt .ad-empty { padding: 40px 22px; text-align: center; font-size: 13px; color: var(--muted); }

        /* ---------- shared states ---------- */
        .qz-state { padding: 48px 22px; text-align: center; font-size: 13px; color: var(--muted); }
        .qz-state strong { display: block; margin-bottom: 6px; font-size: 14px; font-weight: 600; color: var(--ink); }
        .qz-retry {
          margin-top: 14px; padding: 8px 16px; border-radius: 8px; border: 1px solid var(--o-200);
          background: #fff; color: var(--o-700); font-size: 12.5px; font-weight: 600; cursor: pointer;
        }
        .qz-retry:hover { background: var(--o-500); border-color: var(--o-500); color: #fff; }
        .qz-spin {
          display: inline-block; width: 20px; height: 20px; margin-bottom: 12px; border-radius: 50%;
          border: 2.5px solid var(--o-100); border-top-color: var(--o-500); animation: qz-rot .7s linear infinite;
        }
        @keyframes qz-rot { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .qz-spin { animation-duration: 2s; } }

        /* ---------- quiz list ---------- */
        .qz-summary { display: grid; grid-template-columns: repeat(3, 1fr); margin-bottom: 16px; overflow: hidden; }
        .qz-sum { padding: 18px 22px; }
        .qz-sum + .qz-sum { border-left: 1px solid var(--line); }
        .qz-sum-num { font-size: 26px; font-weight: 600; letter-spacing: -0.03em; line-height: 1; font-variant-numeric: tabular-nums; }
        .qz-sum-label { margin-top: 8px; font-size: 12px; font-weight: 500; color: var(--muted); }

        .qz-tools { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
        .qz-count { margin-left: auto; font-size: 12px; font-weight: 500; color: var(--muted); }

        .qz-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .qz-card {
          position: relative; display: flex; flex-direction: column; padding: 20px 22px; cursor: pointer; transition: border-color .15s, background .15s;
        }
        .qz-card:hover { border-color: var(--o-200); background: var(--o-50); }
        .qz-card:focus-visible { outline: 2px solid var(--o-500); outline-offset: 2px; }
        
        /* Match the image layout */
        .qz-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 16px; }
        .qz-icon-box { 
          width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; 
          background: #ea580c; color: #fff; border-radius: 12px;
        }
        .qz-title { margin: 0 0 8px; font-size: 16px; font-weight: 700; line-height: 1.4; letter-spacing: -0.01em; color: #1c1917; }
        .qz-desc { flex: 1; margin: 0 0 20px; font-size: 13.5px; line-height: 1.6; color: var(--muted); }
        .qz-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding-top: 16px; border-top: 1px dashed var(--line); }
        .qz-qcount { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 500; color: var(--muted); }
        .qz-view { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; color: #ea580c; }

        /* ---------- quiz page ---------- */
        .qp-back {
          display: inline-flex; align-items: center; gap: 6px; margin-bottom: 14px; padding: 6px 12px 6px 8px;
          border-radius: 8px; background: #fff; border: 1px solid var(--line); font-family: inherit;
          font-size: 12.5px; font-weight: 500; color: var(--ink-2); cursor: pointer;
        }
        .qp-back:hover { border-color: var(--o-200); color: var(--o-700); }

        .qp-head { padding: 20px 22px; margin-bottom: 16px; }
        .qp-title { margin: 10px 0 4px; font-size: 20px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.3; }
        .qp-sub { font-size: 12.5px; color: var(--muted); }

        .qp-grid { display: grid; grid-template-columns: 300px 1fr; gap: 16px; align-items: start; }
        .qp-side { position: sticky; top: 20px; padding: 4px 22px 8px; }
        .qp-group { padding: 16px 0; }
        .qp-group + .qp-group { border-top: 1px solid var(--line); }
        .qp-group-title { margin: 0 0 10px; font-size: 13px; font-weight: 600; }
        .qp-dl { display: grid; gap: 10px; margin: 0; }
        .qp-dl dt { font-size: 11.5px; font-weight: 500; color: var(--muted); }
        .qp-dl dd { margin: 2px 0 0; font-size: 13px; font-weight: 500; line-height: 1.5; word-break: break-word; }

        /* Report fetch form */
        .qp-report-form { display: flex; gap: 8px; margin-top: 10px; }
        .qp-report-form input { 
          flex: 1; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--line); 
          font-size: 13px; font-family: inherit; outline: none;
        }
        .qp-report-form input:focus { border-color: var(--o-500); }
        .qp-report-form button {
          padding: 8px 12px; border-radius: 8px; background: var(--o-500); color: #fff; 
          border: none; font-size: 12px; font-weight: 600; cursor: pointer;
        }
        .qp-report-form button:hover { background: var(--o-600); }

        /* Report Data display */
        .qp-report-data { margin-top: 16px; background: var(--o-50); border: 1px solid var(--o-100); border-radius: 10px; padding: 14px; }
        .qp-report-title { font-size: 12px; font-weight: 600; color: var(--o-700); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        .qp-report-row { display: flex; justify-content: space-between; font-size: 12.5px; padding: 6px 0; border-bottom: 1px solid var(--o-100); }
        .qp-report-row:last-child { border-bottom: none; }
        .qp-report-key { color: var(--muted); }
        .qp-report-val { font-weight: 600; color: var(--ink); }
        .qp-report-val.low { color: #b91c1c; }
        .qp-report-val.normal { color: #15803d; }
        .qp-report-val.high { color: #ea580c; }

        .qp-main { min-width: 0; }
        .qp-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
        .qp-bar .ad-search { flex: 1; min-width: 200px; max-width: none; }
        .qp-lang { display: inline-flex; padding: 2px; border-radius: 8px; background: #f5f5f4; }
        .qp-lang button {
          padding: 5px 12px; border: none; border-radius: 6px; background: transparent; color: var(--muted);
          font-family: inherit; font-size: 12px; font-weight: 600; cursor: pointer;
        }
        .qp-lang button.on { background: #fff; color: var(--o-700); box-shadow: 0 0 0 1px var(--line); }

        .qp-list { padding: 4px 22px; }
        .qp-q { display: flex; gap: 14px; padding: 16px 0; border-bottom: 1px solid var(--line); }
        .qp-q:last-child { border-bottom: none; }
        .qp-no {
          flex: none; width: 28px; height: 28px; display: grid; place-items: center; border-radius: 8px;
          background: var(--o-100); color: var(--o-700); font-size: 12px; font-weight: 600;
        }
        .qp-qmain { flex: 1; min-width: 0; }
        .qp-text { margin: 0 0 8px; font-size: 13px; line-height: 1.6; font-weight: 500; }
        .qp-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
        .qp-type { padding: 2px 9px; border-radius: 6px; background: #f5f5f4; color: var(--ink-2); font-size: 11.5px; font-weight: 500; }

        .qp-opts { display: flex; flex-wrap: wrap; gap: 6px; }
        .qp-opt {
          display: inline-flex; align-items: center; gap: 8px; padding: 4px 10px 4px 5px; border-radius: 8px;
          border: 1px solid var(--line); background: #fff; font-size: 12.5px; font-weight: 500;
        }
        .qp-opt.correct { border-color: var(--o-500); background: var(--o-50); color: var(--o-700); font-weight: 600; }
        .qp-score {
          min-width: 20px; height: 20px; padding: 0 5px; display: grid; place-items: center; border-radius: 6px;
          background: #f5f5f4; color: var(--ink-2); font-size: 11px; font-weight: 600;
        }
        .qp-opt.correct .qp-score { background: var(--o-100); color: var(--o-700); }
        .qp-note { margin: 8px 0 0; font-size: 12.5px; color: var(--ink-2); line-height: 1.5; }
        .qp-note span { color: var(--muted); }

        @media (max-width: 1000px) {
          .qp-grid { grid-template-columns: 1fr; }
          .qp-side { position: static; }
        }
        @media (max-width: 900px) {
          .qz-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .qz-summary { grid-template-columns: 1fr; }
          .qz-sum + .qz-sum { border-left: 0; border-top: 1px solid var(--line); }
          .qz-count { margin-left: 0; }
          .qp-head { padding: 16px; }
          .qp-list { padding: 2px 16px; }
        }
      `}</style>

      {/* ============================================================ */}
      {/*  VIEW 1: quiz list                                            */}
      {/* ============================================================ */}
      {!selected && (
        <>
          {loading && (
            <div className="ad-panel qz-state">
              <span className="qz-spin" />
              <div>Loading quizzes...</div>
            </div>
          )}

          {!loading && error && (
            <div className="ad-panel qz-state">
              <strong>Couldn&apos;t load quizzes</strong>
              {error}
              <div><button type="button" className="qz-retry" onClick={loadQuizzes}>Try again</button></div>
            </div>
          )}

          {!loading && !error && (
            <>
              <section className="ad-panel qz-summary" aria-label="Quiz summary">
                <div className="qz-sum">
                  <div className="qz-sum-num">{totals.quizzes}</div>
                  <div className="qz-sum-label">Quizzes</div>
                </div>
                <div className="qz-sum">
                  <div className="qz-sum-num">{totals.questions}</div>
                  <div className="qz-sum-label">Total questions</div>
                </div>
                <div className="qz-sum">
                  <div className="qz-sum-num">{totals.active}</div>
                  <div className="qz-sum-label">Active quizzes</div>
                </div>
              </section>
            
              <div className="qz-tools">
                <div className="ad-search">
                  {SearchIcon}
                  <input
                    type="search"
                    placeholder="Search by title or category"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search quizzes"   
                  />
                </div>
                <div className="ad-chips">
                  {["All", "Active", "Inactive"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`ad-chip ${filter === s ? "on" : ""}`}
                      onClick={() => setFilter(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <span className="qz-count">{filtered.length} of {quizzes.length} quizzes</span>
              </div>

              {filtered.length === 0 ? (
                <div className="ad-panel ad-empty">
                  {quizzes.length === 0
                    ? "No quizzes have been added yet."
                    : "No quizzes match your search. Try a different word or clear the filter."}
                </div>
              ) : (
                <section className="qz-grid">
                  {filtered.map((z) => (
                    <article
                      className="ad-panel qz-card"
                      key={z.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openQuiz(z)}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), openQuiz(z))}
                    >
                      <div className="qz-card-top">
                        <div className="qz-icon-box">
                          {ClipboardIcon}
                        </div>
                        <span className="ad-q-cat">{z.category || "General"}</span>
                      </div>
                      <h2 className="qz-title">{z.title}</h2>
                      <p className="qz-desc">{z.description || "No description added."}</p>
                      <div className="qz-foot">
                        <span className="qz-qcount">
                          {QuestionIcon}
                          {z.questions_count ?? z.total_questions} questions
                        </span>
                        <span className="qz-view">Start {ChevronRight}</span>
                      </div>
                    </article>
                  ))}
                </section>
              )}
            </>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  VIEW 2: full quiz page (replaces the old right-side drawer)  */}
      {/* ============================================================ */}
      {selected && (
        <>
          <button type="button" className="qp-back" onClick={closeQuiz}>{BackIcon} All quizzes</button>

          <section className="ad-panel qp-head">
            <span className="ad-q-cat">{selected.category || "General"}</span>
            <h2 className="qp-title">{qs.title}</h2>
            <div className="qp-sub">
              {qs.loading ? "Loading questions..." : `${qs.list.length} questions, added ${fmtDate(selected.created_at)}`}
            </div>
          </section>

          <div className="qp-grid">
            {/* ---------------- Quiz details ---------------- */}
            <aside className="ad-panel qp-side">
              <div className="qp-group">
                <h3 className="qp-group-title">About this quiz</h3>
                <dl className="qp-dl">
                  <div><dt>Description</dt><dd>{selected.description || "No description added."}</dd></div>
                </dl>
              </div>
              <div className="qp-group">
                <h3 className="qp-group-title">Details</h3>
                <dl className="qp-dl">
                  <div><dt>Category</dt><dd>{selected.category || "General"}</dd></div>
                  <div>
                    <dt>Status</dt>
                    <dd><span className={`ad-pill ${selected.is_active ? "ok" : "alert"}`}>{selected.is_active ? "Active" : "Inactive"}</span></dd>
                  </div>
                  <div><dt>Questions</dt><dd>{selected.questions_count ?? selected.total_questions ?? qs.list.length}</dd></div>
                  <div><dt>Added on</dt><dd>{fmtDate(selected.created_at)}</dd></div>
                </dl>
              </div>

              {/* NEW: Fetch Report section */}
              <div className="qp-group">
                <h3 className="qp-group-title">Patient Report</h3>
                <p style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 8 }}>
                  Enter an Attempt ID to view the calculated scores.
                </p>
                <div className="qp-report-form">
                  <input 
                    type="text" 
                    placeholder="e.g. ATT-1-6" 
                    value={attemptId}
                    onChange={(e) => setAttemptId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchReport()}
                  />
                  <button type="button" onClick={fetchReport} disabled={reportLoading}>
                    {reportLoading ? "..." : "Load"}
                  </button>
                </div>
                
                {reportError && <div style={{ color: "red", fontSize: 12, marginTop: 8 }}>{reportError}</div>}

                {reportData && (
                  <div className="qp-report-data">
                    <div className="qp-report-title">Total Score Interpretation: {reportData.total_score_interpretation}</div>
                    
                    {reportData.report && (
                      <div style={{ marginBottom: 12 }}>
                        {Object.entries(reportData.report).map(([key, val]) => (
                          <div className="qp-report-row" key={key}>
                            <span className="qp-report-key">{formatKey(key)}</span>
                            <span className="qp-report-val">{val}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {reportData.sub_scale_interpretations && (
                      <>
                        <div className="qp-report-title" style={{ marginTop: 12 }}>Sub-scale Interpretations</div>
                        {Object.entries(reportData.sub_scale_interpretations).map(([key, val]) => (
                          <div className="qp-report-row" key={key}>
                            <span className="qp-report-key">{formatKey(key)}</span>
                            <span className={`qp-report-val ${String(val).toLowerCase()}`}>{val}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </aside>

            {/* ---------------- Questions ---------------- */}
            <section className="qp-main">
              {qs.loading && (
                <div className="ad-panel qz-state"><span className="qz-spin" /><div>Loading questions...</div></div>
              )}

              {!qs.loading && qs.error && (
                <div className="ad-panel qz-state">
                  <strong>Couldn&apos;t load questions</strong>
                  {qs.error}
                  <div><button type="button" className="qz-retry" onClick={() => loadQuestions(selected)}>Try again</button></div>
                </div>
              )}

              {!qs.loading && !qs.error && (
                <>
                  <div className="qp-bar">
                    <div className="ad-search">
                      {SearchIcon}
                      <input
                        type="search"
                        placeholder="Search questions"
                        value={qSearch}
                        onChange={(e) => setQSearch(e.target.value)}
                        aria-label="Search questions"
                      />
                    </div>
                    <div className="qp-lang" role="group" aria-label="Question language">
                      <button type="button" className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>English</button>
                      <button type="button" className={lang === "ta" ? "on" : ""} onClick={() => setLang("ta")}>தமிழ்</button>
                    </div>
                  </div>

                  {visibleQs.length === 0 ? (
                    <div className="ad-panel ad-empty">
                      {qs.list.length === 0 ? "This quiz has no questions yet." : "No questions match your search."}
                    </div>
                  ) : (
                    <div className="ad-panel qp-list">
                      {visibleQs.map((item, idx) => {
                        const options = toList(item.options);
                        const scores = toList(item.scores);
                        return (
                          <div className="qp-q" key={item.id}>
                            <span className="qp-no">{item.display_order ?? idx + 1}</span>
                            <div className="qp-qmain">
                              <p className="qp-text">
                                {lang === "ta" ? item.question_text_ta || item.question_text : item.question_text}
                              </p>

                              <div className="qp-meta">
                                <span className="qp-type">{typeLabel(item.question_type)}</span>
                                {item.scale && <span className="qp-type">Scale: {item.scale}</span>}
                                {!item.is_active && <span className="ad-pill alert">Inactive</span>}
                              </div>

                              {options.length > 0 && (
                                <div className="qp-opts">
                                  {options.map((opt, i) => {
                                    const isCorrect = item.correct_answer && String(item.correct_answer) === String(opt);
                                    return (
                                      <span className={`qp-opt ${isCorrect ? "correct" : ""}`} key={`${item.id}-${i}`}>
                                        {scores[i] !== undefined && scores[i] !== null && (
                                          <span className="qp-score">{scores[i]}</span>
                                        )}
                                        {opt}
                                        {isCorrect && CheckIcon}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}

                              {item.correct_answer && options.length === 0 && (
                                <p className="qp-note"><span>Correct answer: </span>{item.correct_answer}</p>
                              )}
                              {item.sample_answer && (
                                <p className="qp-note"><span>Sample answer: </span>{item.sample_answer}</p>
                              )}
                              {item.answer_placeholder && (
                                <p className="qp-note"><span>Placeholder: </span>{item.answer_placeholder}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}