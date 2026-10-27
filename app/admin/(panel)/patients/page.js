"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const BASE_URL = "https://api.crazystory.in/api/admin";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "-";

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
const val = (v) => (v === null || v === undefined || v === "" ? "-" : v);

const SearchIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);
const ArrowIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
);
const BackIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
const PhoneIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
  </svg>
);
const MailIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);

// circular completion ring
const Ring = ({ pct }) => {
  const r = 20;
  const c = 2 * Math.PI * r;
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r={r} fill="none" strokeWidth="5" style={{ stroke: "var(--o-100)" }} />
      <circle
        cx="24" cy="24" r={r} fill="none" strokeWidth="5" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
        transform="rotate(-90 24 24)" style={{ stroke: "var(--o-500)" }}
      />
      <text x="24" y="28" textAnchor="middle" fontSize="11" fontWeight="600" style={{ fill: "var(--ink)" }}>
        {Math.round(pct)}%
      </text>
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/*  Page: patients list  ->  full patient page (same file)             */
/* ------------------------------------------------------------------ */
export default function PatientsPage() {
  const router = useRouter();

  // list
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  // patient page
  const [patient, setPatient] = useState(null); // null = show the list
  const [attempts, setAttempts] = useState({ loading: false, error: "", message: "", list: [] });
  const [activeId, setActiveId] = useState(null);
  const [details, setDetails] = useState({ loading: false, error: "", data: null });
  const [lang, setLang] = useState("en");
  const [answerFilter, setAnswerFilter] = useState("All");

  const cacheRef = useRef({}); // attempt_id -> details response
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
      const failed = !data || data.status === false || data.status === "error";
      if (!res.ok || failed) {
        throw new Error(data?.message || "Something went wrong. Please try again.");
      }
      return data;
    },
    [router]
  );

  /* ---------- 1. registered patients ---------- */
  const loadPatients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api("/registered-patients");
      setPatients(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  /* ---------- 3. answers for one quiz attempt ---------- */
  const openAttempt = useCallback(
    async (attemptId) => {
      const reqId = ++reqRef.current;
      setActiveId(attemptId);
      setAnswerFilter("All");

      if (cacheRef.current[attemptId]) {
        setDetails({ loading: false, error: "", data: cacheRef.current[attemptId] });
        return;
      }

      setDetails({ loading: true, error: "", data: null });
      try {
        const data = await api(`/attempt/${attemptId}/details`);
        cacheRef.current[attemptId] = data;
        if (reqId !== reqRef.current) return;
        setDetails({ loading: false, error: "", data });
      } catch (err) {
        if (reqId !== reqRef.current) return;
        setDetails({ loading: false, error: err.message, data: null });
      }
    },
    [api]
  );

  /* ---------- 2. quizzes one patient attended ---------- */
  const loadAttempts = useCallback(
    async (p) => {
      const reqId = ++reqRef.current;
      setActiveId(null);
      setDetails({ loading: false, error: "", data: null });
      setAttempts({ loading: true, error: "", message: "", list: [] });
      try {
        const data = await api(`/patient/${p.id}/check-attempts`);
        if (reqId !== reqRef.current) return;
        const list = Array.isArray(data.attempts) ? data.attempts : [];
        setAttempts({
          loading: false,
          error: "",
          message: data.attended ? "" : data.message || "This patient has not attended any quiz yet.",
          list,
        });
        // open the first quiz that has answers (or just the first one)
        const first = list.find((a) => a.total_answered > 0) || list[0];
        if (first) openAttempt(first.attempt_id);
      } catch (err) {
        if (reqId !== reqRef.current) return;
        setAttempts({ loading: false, error: err.message, message: "", list: [] });
      }
    },
    [api, openAttempt]
  );

  const openPatient = (p) => {
    cacheRef.current = {};
    setPatient(p);
    window.scrollTo({ top: 0 });
    loadAttempts(p);
  };

  const closePatient = () => {
    reqRef.current++;
    setPatient(null);
    window.scrollTo({ top: 0 });
  };

  /* ---------- derived ---------- */
  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      total: patients.length,
      signed: patients.filter((p) => p.declarations > 0).length,
      week: patients.filter((p) => new Date(p.created_at).getTime() >= weekAgo).length,
    };
  }, [patients]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return patients.filter((p) => {
      const matchQ =
        !q ||
        [p.full_name, p.phone, p.email, p.city, p.state]
          .filter(Boolean)
          .some((f) => String(f).toLowerCase().includes(q));
      const matchF =
        filter === "All" ||
        (filter === "Declaration signed" && p.declarations > 0) ||
        (filter === "Declaration pending" && !p.declarations);
      return matchQ && matchF;
    });
  }, [patients, query, filter]);

  const activeAttempt = attempts.list.find((a) => a.attempt_id === activeId) || null;

  const rows = useMemo(() => {
    const all = details.data?.data || [];
    if (answerFilter === "Answered") return all.filter((r) => r.is_answered);
    if (answerFilter === "Not attended") return all.filter((r) => !r.is_answered);
    return all;
  }, [details.data, answerFilter]);

  const answered = details.data?.total_answered ?? activeAttempt?.total_answered ?? 0;
  const unanswered = details.data?.total_unanswered ?? activeAttempt?.balance ?? 0;
  const total = details.data?.total_questions ?? activeAttempt?.total_questions ?? 0;

  /* ---------------------------------------------------------------- */
  return (
    <div className="pt">
      <style>{`
        /* ---------- flat overrides for shared admin classes ---------- */
        .pt .ad-panel { background: #fff; border: 1px solid var(--line); border-radius: 12px; box-shadow: none; }
        .pt .ad-search { border-radius: 8px; border: 1px solid var(--line); background: #fff; }
        .pt .ad-search input { font-size: 13px; }
        .pt .ad-chip {
          padding: 6px 12px; border-radius: 8px; border: 1px solid var(--line); background: #fff;
          color: var(--ink-2); font-size: 12px; font-weight: 500; box-shadow: none;
        }
        .pt .ad-chip:hover { background: var(--o-50); }
        .pt .ad-chip.on { background: var(--o-50); border-color: var(--o-500); color: var(--o-700); font-weight: 600; }
        .pt .ad-pill { padding: 3px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 600; }
        .pt .ad-pill.ok { background: var(--o-100); color: var(--o-700); }
        .pt .ad-pill.warn { background: #f5f5f4; color: var(--muted); }
        .pt .ad-empty { padding: 40px 22px; text-align: center; font-size: 13px; color: var(--muted); }

        /* ---------- shared states ---------- */
        .pl-state { padding: 48px 22px; text-align: center; font-size: 13px; color: var(--muted); }
        .pl-state strong { display: block; margin-bottom: 6px; font-size: 14px; font-weight: 600; color: var(--ink); }
        .pl-retry {
          margin-top: 14px; padding: 8px 16px; border-radius: 8px; border: 1px solid var(--o-200);
          background: #fff; color: var(--o-700); font-size: 12.5px; font-weight: 600; cursor: pointer;
        }
        .pl-retry:hover { background: var(--o-500); border-color: var(--o-500); color: #fff; }
        .pl-spin {
          display: inline-block; width: 20px; height: 20px; margin-bottom: 12px; border-radius: 50%;
          border: 2.5px solid var(--o-100); border-top-color: var(--o-500); animation: pl-rot .7s linear infinite;
        }
        @keyframes pl-rot { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .pl-spin { animation-duration: 2s; } }

        /* ---------- list ---------- */
        .pl-stats { display: grid; grid-template-columns: repeat(3, 1fr); margin-bottom: 16px; overflow: hidden; }
        .pl-stat { padding: 18px 22px; }
        .pl-stat + .pl-stat { border-left: 1px solid var(--line); }
        .pl-stat-num { font-size: 26px; font-weight: 600; letter-spacing: -0.03em; line-height: 1; font-variant-numeric: tabular-nums; }
        .pl-stat-label { margin-top: 8px; font-size: 12px; color: var(--muted); font-weight: 500; }

        .pl-tools { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
        .pl-count { margin-left: auto; font-size: 12px; font-weight: 500; color: var(--muted); }

        .pl-table { overflow: hidden; }
        .pl-head, .pl-row {
          display: grid; grid-template-columns: 2.1fr 1.8fr 1.2fr 1fr 1fr 24px; align-items: center; gap: 16px;
        }
        .pl-head { padding: 11px 22px; background: #fafaf9; border-bottom: 1px solid var(--line); font-size: 11.5px; font-weight: 600; color: var(--muted); }
        .pl-row {
          width: 100%; padding: 12px 22px; border: 0; border-bottom: 1px solid var(--line); background: #fff;
          color: inherit; font-family: inherit; text-align: left; cursor: pointer; transition: background .15s;
        }
        .pl-row:last-child { border-bottom: 0; }
        .pl-row:hover { background: var(--o-50); }
        .pl-row:focus-visible { outline: 2px solid var(--o-500); outline-offset: -2px; }
        .pl-who { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .pl-ava {
          flex: none; width: 36px; height: 36px; display: grid; place-items: center; border-radius: 50%;
          background: var(--o-100); color: var(--o-700); font-size: 12px; font-weight: 600;
        }
        .pl-name { font-size: 13.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pl-sub { font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pl-cell { min-width: 0; font-size: 13px; }
        .pl-arrow { color: var(--muted); display: grid; place-items: center; }
        .pl-row:hover .pl-arrow { color: var(--o-600); }

        /* ---------- patient page ---------- */
        .pd-back {
          display: inline-flex; align-items: center; gap: 6px; margin-bottom: 14px; padding: 6px 12px 6px 8px;
          border-radius: 8px; background: #fff; border: 1px solid var(--line); font-family: inherit;
          font-size: 12.5px; font-weight: 500; color: var(--ink-2); cursor: pointer;
        }
        .pd-back:hover { border-color: var(--o-200); color: var(--o-700); }

        .pd-hero { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; padding: 20px 22px; margin-bottom: 16px; }
        .pd-hero-ava {
          flex: none; width: 56px; height: 56px; display: grid; place-items: center; border-radius: 50%;
          background: var(--o-100); color: var(--o-700); font-size: 18px; font-weight: 600;
        }
        .pd-hero-info { flex: 1; min-width: 220px; }
        .pd-name { margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.2; }
        .pd-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; }
        .pd-tag { padding: 3px 10px; border-radius: 999px; border: 1px solid var(--line); background: #fff; color: var(--ink-2); font-size: 11.5px; font-weight: 500; }
        .pd-tag.hl { background: var(--o-100); border-color: var(--o-100); color: var(--o-700); font-weight: 600; }
        .pd-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .pd-act {
          display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; border-radius: 8px;
          border: 1px solid var(--line); background: #fff; color: var(--ink-2); font-size: 12.5px; font-weight: 600;
          text-decoration: none; transition: background .15s;
        }
        .pd-act:hover { background: var(--o-50); }
        .pd-act.primary { background: var(--o-500); border-color: var(--o-500); color: #fff; }
        .pd-act.primary:hover { background: var(--o-600); border-color: var(--o-600); }
        .pd-act:focus-visible { outline: 2px solid var(--o-500); outline-offset: 2px; }

        .pd-grid { display: grid; grid-template-columns: 300px 1fr; gap: 16px; align-items: start; }
        .pd-side { position: sticky; top: 20px; padding: 4px 22px 8px; }
        .pd-group { padding: 16px 0; }
        .pd-group + .pd-group { border-top: 1px solid var(--line); }
        .pd-group-title { margin: 0 0 10px; font-size: 13px; font-weight: 600; }
        .pd-dl { display: grid; gap: 10px; margin: 0; }
        .pd-dl dt { font-size: 11.5px; font-weight: 500; color: var(--muted); }
        .pd-dl dd { margin: 2px 0 0; font-size: 13px; font-weight: 500; line-height: 1.5; word-break: break-word; }

        .pd-main { min-width: 0; }
        .pd-h2 { display: flex; align-items: baseline; gap: 10px; margin: 0 0 12px; font-size: 15px; font-weight: 600; letter-spacing: -0.01em; }
        .pd-h2 span { font-size: 12px; font-weight: 500; color: var(--muted); letter-spacing: 0; }

        .pd-quizzes { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 10px; margin-bottom: 16px; }
        .pd-quiz {
          display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 12px; text-align: left;
          border: 1px solid var(--line); background: #fff; color: inherit; font-family: inherit; cursor: pointer;
          transition: border-color .15s, background .15s;
        }
        .pd-quiz:hover { border-color: var(--o-200); }
        .pd-quiz.on { border-color: var(--o-500); background: var(--o-50); }
        .pd-quiz:focus-visible { outline: 2px solid var(--o-500); outline-offset: 2px; }
        .pd-quiz-ring { flex: none; }
        .pd-quiz-title { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 12.5px; font-weight: 600; line-height: 1.4; }
        .pd-quiz-meta { display: block; margin-top: 3px; font-size: 12px; color: var(--muted); }

        .pd-results { padding: 20px 22px 6px; }
        .pd-results-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
        .pd-results-title { margin: 0; font-size: 14px; font-weight: 600; line-height: 1.45; max-width: 520px; }
        .pd-mini { display: flex; gap: 22px; }
        .pd-mini-num { font-size: 20px; font-weight: 600; letter-spacing: -0.02em; line-height: 1; font-variant-numeric: tabular-nums; }
        .pd-mini-label { margin-top: 4px; font-size: 11.5px; color: var(--muted); font-weight: 500; }

        .pd-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 12px 0; border-top: 1px solid var(--line); }
        .pd-lang { display: inline-flex; margin-left: auto; padding: 2px; border-radius: 8px; background: #f5f5f4; }
        .pd-lang button {
          padding: 5px 12px; border: none; border-radius: 6px; background: transparent; color: var(--muted);
          font-family: inherit; font-size: 12px; font-weight: 600; cursor: pointer;
        }
        .pd-lang button.on { background: #fff; color: var(--o-700); box-shadow: 0 0 0 1px var(--line); }

        .pd-q { display: flex; gap: 14px; padding: 16px 0; border-top: 1px solid var(--line); }
        .pd-q-no {
          flex: none; width: 28px; height: 28px; display: grid; place-items: center; border-radius: 8px;
          background: var(--o-100); color: var(--o-700); font-size: 12px; font-weight: 600;
        }
        .pd-q.skipped .pd-q-no { background: #f5f5f4; color: var(--muted); }
        .pd-q-main { flex: 1; min-width: 0; }
        .pd-q-text { margin: 0 0 8px; font-size: 13px; line-height: 1.6; font-weight: 500; }
        .pd-q.skipped .pd-q-text { color: var(--muted); }
        .pd-ans {
          display: inline-flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 5px 6px 5px 12px;
          border-radius: 8px; background: var(--o-50); border: 1px solid var(--o-100);
        }
        .pd-ans-text { font-size: 12.5px; font-weight: 600; color: var(--o-700); }
        .pd-score { padding: 2px 8px; border-radius: 6px; background: #fff; color: var(--o-700); font-size: 11.5px; font-weight: 600; }
        .pd-skip { font-size: 12.5px; font-style: italic; color: var(--muted); }

        @media (max-width: 1100px) {
          .pd-grid { grid-template-columns: 1fr; }
          .pd-side { position: static; }
        }
        @media (max-width: 1000px) {
          .pl-head { display: none; }
          .pl-row { grid-template-columns: 1fr 24px; gap: 8px 16px; }
          .pl-row .pl-who { grid-column: 1; }
          .pl-row .pl-arrow { grid-column: 2; grid-row: 1; }
          .pl-row .pl-cell { grid-column: 1 / -1; }
        }
        @media (max-width: 600px) {
          .pl-stat { padding: 14px 16px; }
          .pl-stat-num { font-size: 22px; }
          .pl-count { margin-left: 0; }
          .pd-hero { padding: 16px; }
          .pd-results { padding: 16px 16px 4px; }
          .pd-lang { margin-left: 0; }
        }
      `}</style>

      {/* ============================================================ */}
      {/*  VIEW 1: patients list                                        */}
      {/* ============================================================ */}
      {!patient && (
        <>
          {loading && (
            <div className="ad-panel pl-state"><span className="pl-spin" /><div>Loading patients...</div></div>
          )}

          {!loading && error && (
            <div className="ad-panel pl-state">
              <strong>Couldn&apos;t load patients</strong>
              {error}
              <div><button type="button" className="pl-retry" onClick={loadPatients}>Try again</button></div>
            </div>
          )}

          {!loading && !error && (
            <>
              <section className="ad-panel pl-stats" aria-label="Patient summary">
                <div className="pl-stat">
                  <div className="pl-stat-num">{stats.total}</div>
                  <div className="pl-stat-label">Registered patients</div>
                </div>
                <div className="pl-stat">
                  <div className="pl-stat-num">{stats.signed}</div>
                  <div className="pl-stat-label">Declaration signed</div>
                </div>
                <div className="pl-stat">
                  <div className="pl-stat-num">{stats.week}</div>
                  <div className="pl-stat-label">Joined in the last 7 days</div>
                </div>
              </section>

              <div className="pl-tools">
                <div className="ad-search">
                  {SearchIcon}
                  <input
                    type="search"
                    placeholder="Search by name, phone, email or city"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search patients"
                  />
                </div>
                <div className="ad-chips">
                  {["All", "Declaration signed", "Declaration pending"].map((s) => (
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
                <span className="pl-count">{filtered.length} of {patients.length} patients</span>
              </div>

              {filtered.length === 0 ? (
                <div className="ad-panel ad-empty">
                  {patients.length === 0
                    ? "No patients have registered yet."
                    : "No patients match your search. Try a different name or clear the filter."}
                </div>
              ) : (
                <div className="ad-panel pl-table">
                  <div className="pl-head" aria-hidden="true">
                    <span>Patient</span>
                    <span>Contact</span>
                    <span>Location</span>
                    <span>Registered</span>
                    <span>Declaration</span>
                    <span />
                  </div>

                  {filtered.map((p) => (
                    <button type="button" className="pl-row" key={p.id} onClick={() => openPatient(p)}>
                      <div className="pl-who">
                        <span className="pl-ava">{initials(p.full_name)}</span>
                        <div style={{ minWidth: 0 }}>
                          <div className="pl-name">{val(p.full_name)}</div>
                          <div className="pl-sub">
                            {p.age ? `${p.age} yrs` : "Age not given"}
                            {p.gender ? `, ${cap(p.gender)}` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="pl-cell">
                        <div>{val(p.phone)}</div>
                        <div className="pl-sub">{val(p.email)}</div>
                      </div>
                      <div className="pl-cell">
                        <div>{val(p.city)}</div>
                        <div className="pl-sub">{val(p.state)}</div>
                      </div>
                      <div className="pl-cell">{fmtDate(p.created_at)}</div>
                      <div className="pl-cell">
                        <span className={`ad-pill ${p.declarations > 0 ? "ok" : "warn"}`}>
                          {p.declarations > 0 ? "Signed" : "Pending"}
                        </span>
                      </div>
                      <span className="pl-arrow">{ArrowIcon}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  VIEW 2: full patient page                                    */}
      {/* ============================================================ */}
      {patient && (
        <>
          <button type="button" className="pd-back" onClick={closePatient}>{BackIcon} All patients</button>

          {/* ---------------- Header ---------------- */}
          <section className="ad-panel pd-hero">
            <div className="pd-hero-ava">{initials(patient.full_name)}</div>
            <div className="pd-hero-info">
              <h2 className="pd-name">{val(patient.full_name)}</h2>
              <div className="pd-tags">
                <span className="pd-tag">Patient ID {patient.id}</span>
                {patient.age && <span className="pd-tag">{patient.age} yrs</span>}
                {patient.gender && <span className="pd-tag">{cap(patient.gender)}</span>}
                {patient.city && <span className="pd-tag">{patient.city}</span>}
                <span className={`pd-tag ${patient.declarations > 0 ? "hl" : ""}`}>
                  {patient.declarations > 0 ? "Declaration signed" : "Declaration pending"}
                </span>
                <span className={`pd-tag ${patient.is_active ? "hl" : ""}`}>{patient.is_active ? "Active" : "Inactive"}</span>
              </div>
            </div>
            <div className="pd-actions">
              {patient.phone && <a className="pd-act primary" href={`tel:${patient.phone}`}>{PhoneIcon} Call</a>}
              {patient.email && <a className="pd-act" href={`mailto:${patient.email}`}>{MailIcon} Email</a>}
            </div>
          </section>

          <div className="pd-grid">
            {/* ---------------- Details ---------------- */}
            <aside className="ad-panel pd-side">
              <div className="pd-group">
                <h3 className="pd-group-title">Contact</h3>
                <dl className="pd-dl">
                  <div><dt>Phone</dt><dd>{val(patient.phone)}</dd></div>
                  <div><dt>Email</dt><dd>{val(patient.email)}</dd></div>
                </dl>
              </div>
              <div className="pd-group">
                <h3 className="pd-group-title">Background</h3>
                <dl className="pd-dl">
                  <div><dt>Marital status</dt><dd>{val(patient.marital_status)}</dd></div>
                  <div><dt>Education</dt><dd>{val(patient.education)}</dd></div>
                  <div><dt>Occupation</dt><dd>{val(patient.occupation)}</dd></div>
                </dl>
              </div>
              <div className="pd-group">
                <h3 className="pd-group-title">Address</h3>
                <dl className="pd-dl">
                  <div>
                    <dt>Full address</dt>
                    <dd>{[patient.full_address, patient.city, patient.state, patient.pincode].filter(Boolean).join(", ") || "-"}</dd>
                  </div>
                </dl>
              </div>
              <div className="pd-group">
                <h3 className="pd-group-title">Registration</h3>
                <dl className="pd-dl">
                  <div><dt>Registered on</dt><dd>{fmtDate(patient.created_at)}</dd></div>
                  <div><dt>Referred by</dt><dd>{val(patient.referred_by)}</dd></div>
                </dl>
              </div>
            </aside>

            {/* ---------------- Assessments ---------------- */}
            <section className="pd-main">
              <h2 className="pd-h2">
                Assessments
                {!attempts.loading && !attempts.error && <span>{attempts.list.length} quizzes attended</span>}
              </h2>

              {attempts.loading && (
                <div className="ad-panel pl-state"><span className="pl-spin" /><div>Loading assessments...</div></div>
              )}

              {!attempts.loading && attempts.error && (
                <div className="ad-panel pl-state">
                  <strong>Couldn&apos;t load assessments</strong>
                  {attempts.error}
                  <div><button type="button" className="pl-retry" onClick={() => loadAttempts(patient)}>Try again</button></div>
                </div>
              )}

              {!attempts.loading && !attempts.error && attempts.list.length === 0 && (
                <div className="ad-panel pl-state">
                  <strong>No assessments yet</strong>
                  {attempts.message || "This patient has not attended any quiz yet."}
                </div>
              )}

              {!attempts.loading && !attempts.error && attempts.list.length > 0 && (
                <>
                  <div className="pd-quizzes">
                    {attempts.list.map((a) => {
                      const pct = a.total_questions ? (a.total_answered / a.total_questions) * 100 : 0;
                      return (
                        <button
                          type="button"
                          key={a.attempt_id}
                          className={`pd-quiz ${activeId === a.attempt_id ? "on" : ""}`}
                          onClick={() => openAttempt(a.attempt_id)}
                          aria-pressed={activeId === a.attempt_id}
                        >
                          <span className="pd-quiz-ring"><Ring pct={pct} /></span>
                          <span>
                            <span className="pd-quiz-title">{a.quiz_title}</span>
                            <span className="pd-quiz-meta">{a.total_answered} of {a.total_questions} answered</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {activeAttempt && (
                    <div className="ad-panel pd-results">
                      <div className="pd-results-head">
                        <h3 className="pd-results-title">{activeAttempt.quiz_title}</h3>
                        <div className="pd-mini">
                          <div><div className="pd-mini-num">{answered}</div><div className="pd-mini-label">Answered</div></div>
                          <div><div className="pd-mini-num">{unanswered}</div><div className="pd-mini-label">Not attended</div></div>
                          <div><div className="pd-mini-num">{total}</div><div className="pd-mini-label">Questions</div></div>
                        </div>
                      </div>

                      {details.loading && (
                        <div className="pl-state"><span className="pl-spin" /><div>Loading answers...</div></div>
                      )}

                      {!details.loading && details.error && (
                        <div className="pl-state">
                          <strong>Couldn&apos;t load answers</strong>
                          {details.error}
                          <div><button type="button" className="pl-retry" onClick={() => openAttempt(activeAttempt.attempt_id)}>Try again</button></div>
                        </div>
                      )}

                      {!details.loading && !details.error && details.data && (
                        <>
                          <div className="pd-bar">
                            <div className="ad-chips">
                              {["All", "Answered", "Not attended"].map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  className={`ad-chip ${answerFilter === s ? "on" : ""}`}
                                  onClick={() => setAnswerFilter(s)}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                            <div className="pd-lang" role="group" aria-label="Question language">
                              <button type="button" className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>English</button>
                              <button type="button" className={lang === "ta" ? "on" : ""} onClick={() => setLang("ta")}>தமிழ்</button>
                            </div>
                          </div>

                          {rows.length === 0 && <div className="ad-empty">No questions in this view.</div>}

                          {rows.map((r) => (
                            <div className={`pd-q ${r.is_answered ? "" : "skipped"}`} key={r.question_id}>
                              <span className="pd-q-no">{r.question_no}</span>
                              <div className="pd-q-main">
                                <p className="pd-q-text">
                                  {lang === "ta" ? r.question_text_ta || r.question_text : r.question_text}
                                </p>
                                {r.is_answered ? (
                                  <span className="pd-ans">
                                    <span className="pd-ans-text">{r.answer_text}</span>
                                    {r.answer_score !== null && r.answer_score !== undefined && (
                                      <span className="pd-score">Score {r.answer_score}</span>
                                    )}
                                  </span>
                                ) : (
                                  <span className="pd-skip">Not attended</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
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