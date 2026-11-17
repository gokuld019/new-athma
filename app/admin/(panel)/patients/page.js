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

// snake_case -> Title Case ("appraisal_of_own_emotions" -> "Appraisal of Own Emotions")
const SMALL_WORDS = ["of", "and", "the", "in", "to", "for"];
const formatKey = (key) =>
  key
    .split("_")
    .map((w, i) => (i > 0 && SMALL_WORDS.includes(w.toLowerCase()) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Is this attempt the Big Five Inventory-10 (quiz 6)?
const isBigFive = (attempt) => {
  const t = attempt?.quiz_title?.toLowerCase() || "";
  return Number(attempt?.quiz_id) === 6 || t.includes("bfi-10") || t.includes("big five");
};

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */
const ICONS = {
  user: (<><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></>),
  users: (<><circle cx="9" cy="8" r="3.5" /><path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7" /><path d="M22 21v-1a6 6 0 0 0-4-5.6" /></>),
  sliders: (<><path d="M4 6h8M18 6h2M4 12h2M12 12h8M4 18h10M20 18h0" /><circle cx="15" cy="6" r="2.2" /><circle cx="9" cy="12" r="2.2" /><circle cx="17" cy="18" r="2.2" /></>),
  bolt: (<path d="M13 2L4 14h7l-1 8 9-12h-7z" />),
  chart: (<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />),
  pulse: (<path d="M3 12h4l3-8 4 16 3-8h4" />),
  cloud: (<path d="M7 18a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 9.5 4 4 0 0 1 17.5 18z" />),
  smile: (<><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><path d="M9 9.5h.01M15 9.5h.01" /></>),
  shield: (<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />),
  alert: (<><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18h.01" /></>),
  arrowUp: (<path d="M12 19V5M5 12l7-7 7 7" />),
  arrowDown: (<path d="M12 5v14M19 12l-7 7-7-7" />),
  check: (<><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.7 2.7L16 9.5" /></>),
  minus: (<><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></>),
  list: (<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />),
  clipboard: (<><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4h6v3H9z" /><path d="M9 12h6M9 16h4" /></>),
  target: (<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>),
  phone: (<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />),
  briefcase: (<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" /></>),
  pin: (<><path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></>),
  calendar: (<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>),
};

const Ico = ({ name, size = 16, sw = 1.9 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {ICONS[name] || ICONS.chart}
  </svg>
);

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
const ReportIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h6" />
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
/*  Score summary helpers                                              */
/* ------------------------------------------------------------------ */
const LEVELS = {
  low: { key: "low", label: "Low", icon: "arrowDown", cls: "lv-low", idx: 0 },
  normal: { key: "normal", label: "Normal", icon: "check", cls: "lv-normal", idx: 1 },
  high: { key: "high", label: "High", icon: "arrowUp", cls: "lv-high", idx: 2 },
  indicated: { key: "indicated", label: "Indicated", icon: "alert", cls: "lv-indicated", idx: 2 },
  not_indicated: { key: "not_indicated", label: "Not Indicated", icon: "check", cls: "lv-normal", idx: 1 },
};

const getLevel = (text) => {
  const t = String(text || "").toLowerCase();
  if (!t) return { key: "none", label: "", icon: "chart", cls: "lv-neutral", idx: -1 };
  
  if (t.includes("not indicated")) return LEVELS.not_indicated;
  if (t.includes("indicated")) return LEVELS.indicated;
  
  if (t.includes("low")) return LEVELS.low;
  if (t.includes("high") || t.includes("very high")) return LEVELS.high;
  if (t.includes("normal") || t.includes("average")) return LEVELS.normal;
  
  return { key: "other", label: cap(String(text)), icon: "chart", cls: "lv-neutral", idx: -1 };
};

const subIcon = (key) => {
  const k = key.toLowerCase();
  if (k.includes("appraisal") && k.includes("own")) return "user";
  if (k.includes("appraisal")) return "users";
  if (k.includes("regulation")) return "sliders";
  if (k.includes("utilis") || k.includes("utiliz")) return "bolt";
  if (k.includes("anxi")) return "pulse";
  if (k.includes("depress")) return "cloud";
  if (k.includes("positive") || k.includes("well")) return "smile";
  if (k.includes("control")) return "shield";
  if (k.includes("distress")) return "alert";
  if (k.includes("panic") || k.includes("somatic")) return "pulse";
  if (k.includes("separation")) return "users";
  if (k.includes("social")) return "users";
  if (k.includes("school") || k.includes("avoid")) return "shield";
  if (k.includes("emotion")) return "smile";
  if (k.includes("speech") || k.includes("language")) return "clipboard";
  if (k.includes("behaviour") || k.includes("behavior")) return "users";
  if (k.includes("sensory")) return "pulse";
  if (k.includes("cognitive")) return "target";
  // Big Five traits
  if (k.includes("extraversion")) return "users";
  if (k.includes("agreeable")) return "smile";
  if (k.includes("conscientious")) return "clipboard";
  if (k.includes("neurotic")) return "cloud";
  if (k.includes("openness")) return "bolt";
  return "chart";
};

const LevelBadge = ({ level, text }) => (
  <span className={`sm-badge ${level.cls}`}>
    <Ico name={level.icon} size={13} sw={2.2} />
    {text || level.label}
  </span>
);

function SummaryCard({ data, quizTitle }) {
  const report = data?.report || {};
  const interps = data?.sub_scale_interpretations || {};
  
  const totalScore = report.total_score ?? report.total_anxiety_score;
  const totalInterpretation = data?.total_score_interpretation || data?.total_interpretation;
  const totalLevel = getLevel(totalInterpretation);
  
  const subs = Object.entries(report).filter(([k]) => !k.includes("total"));

  const counts = { low: 0, normal: 0, high: 0, indicated: 0, not_indicated: 0 };
  subs.forEach(([k]) => {
    const lv = getLevel(interps[k]);
    if (counts[lv.key] !== undefined) counts[lv.key]++;
  });
  const hasCounts = Object.values(counts).some((c) => c > 0);

  return (
    <div className="ad-panel sm-card">
      <div className="sm-body">
        <div className="sm-head">
          <div className="sm-title-wrap">
            <span className="sm-tile"><Ico name="clipboard" size={20} /></span>
            <div style={{ minWidth: 0 }}>
              <h3 className="sm-title">Score Summary</h3>
              <div className="sm-sub">{quizTitle}</div>
            </div>
          </div>

          {(totalScore !== undefined || totalLevel.key !== "none") && (
            <div className="sm-total">
              <span className="sm-total-ico"><Ico name="target" size={20} /></span>
              <div>
                <div className="sm-total-label">Total score</div>
                <div className="sm-total-num">{totalScore ?? "N/A"}</div>
              </div>
              {totalLevel.key !== "none" && <LevelBadge level={totalLevel} text={totalInterpretation} />}
            </div>
          )}
        </div>

        {hasCounts && (
          <div className="sm-counts">
            <span className="sm-counts-label">Sub-scales</span>
            {["low", "normal", "high", "indicated", "not_indicated"].map(
              (k) =>
                counts[k] > 0 && (
                  <LevelBadge key={k} level={LEVELS[k]} text={`${counts[k]} ${LEVELS[k].label}`} />
                )
            )}
          </div>
        )}

        {subs.length > 0 && (
          <div className="sm-grid">
            {subs.map(([key, value]) => {
              const lv = getLevel(interps[key]);
              return (
                <div className={`sm-item ${lv.cls}`} key={key}>
                  <div className="sm-item-top">
                    <span className="sm-ico"><Ico name={subIcon(key)} size={17} /></span>
                    <span className="sm-name">{formatKey(key)}</span>
                  </div>
                  <div className="sm-mid">
                    <span className="sm-val">{String(value)}</span>
                    {lv.key !== "none" && <LevelBadge level={lv} />}
                  </div>
                  
                  {(lv.key === "indicated" || lv.key === "not_indicated") ? (
                    <>
                      <div className="sm-seg" aria-hidden="true" style={{ gridTemplateColumns: "1fr 1fr" }}>
                        <i className={lv.key === "not_indicated" ? "on" : ""} />
                        <i className={lv.key === "indicated" ? "on" : ""} />
                      </div>
                      <div className="sm-seg-labels" aria-hidden="true" style={{ gridTemplateColumns: "1fr 1fr" }}>
                        <span className={lv.key === "not_indicated" ? "on" : ""}>Normal</span>
                        <span className={lv.key === "indicated" ? "on" : ""}>Indicated</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="sm-seg" aria-hidden="true">
                        {[0, 1, 2].map((i) => <i key={i} className={i === lv.idx ? "on" : ""} />)}
                      </div>
                      <div className="sm-seg-labels" aria-hidden="true">
                        {["Low", "Normal", "High"].map((l, i) => <span key={l} className={i === lv.idx ? "on" : ""}>{l}</span>)}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Big Five Inventory-10 (BFI-10) summary                             */
/*  API: GET /attempt/{attempt_id}/sixth-quiz-report                   */
/*  { report: { extraversion: 8, ... }, interpretations: { ... } }     */
/* ------------------------------------------------------------------ */
const BIG_FIVE_ORDER = ["extraversion", "agreeableness", "conscientiousness", "neuroticism", "openness"];

function BigFiveSummaryCard({ data, quizTitle }) {
  const report = data?.report || {};
  const interps = data?.interpretations || {};

  // known traits first (in standard OCEAN-style order), then anything extra the API sends
  const keys = [
    ...BIG_FIVE_ORDER.filter((k) => report[k] !== undefined),
    ...Object.keys(report).filter((k) => !BIG_FIVE_ORDER.includes(k)),
  ];

  const counts = { low: 0, normal: 0, high: 0 };
  keys.forEach((k) => {
    const lv = getLevel(interps[k]);
    if (counts[lv.key] !== undefined) counts[lv.key]++;
  });
  const hasCounts = Object.values(counts).some((c) => c > 0);

  return (
    <div className="ad-panel sm-card">
      <div className="sm-body">
        <div className="sm-head">
          <div className="sm-title-wrap">
            <span className="sm-tile"><Ico name="clipboard" size={20} /></span>
            <div style={{ minWidth: 0 }}>
              <h3 className="sm-title">Score Summary</h3>
              <div className="sm-sub">{quizTitle}</div>
            </div>
          </div>
        </div>

        {hasCounts && (
          <div className="sm-counts">
            <span className="sm-counts-label">Traits</span>
            {[
              ["high", "High"],
              ["normal", "Average"],
              ["low", "Low"],
            ].map(
              ([k, label]) =>
                counts[k] > 0 && <LevelBadge key={k} level={LEVELS[k]} text={`${counts[k]} ${label}`} />
            )}
          </div>
        )}

        {keys.length > 0 && (
          <div className="sm-grid">
            {keys.map((key) => {
              const lv = getLevel(interps[key]);
              const interpText = interps[key] || "";
              return (
                <div className={`sm-item ${lv.cls}`} key={key}>
                  <div className="sm-item-top">
                    <span className="sm-ico"><Ico name={subIcon(key)} size={17} /></span>
                    <span className="sm-name">{formatKey(key)}</span>
                  </div>
                  <div className="sm-mid">
                    <span className="sm-val">
                      {String(report[key])}
                      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)" }}>/10</span>
                    </span>
                    {lv.key !== "none" && <LevelBadge level={lv} text={interpText} />}
                  </div>
                  <div className="sm-seg" aria-hidden="true">
                    {[0, 1, 2].map((i) => <i key={i} className={i === lv.idx ? "on" : ""} />)}
                  </div>
                  <div className="sm-seg-labels" aria-hidden="true">
                    {["Low", "Average", "High"].map((l, i) => <span key={l} className={i === lv.idx ? "on" : ""}>{l}</span>)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function AutismSummaryCard({ data, quizTitle }) {
  const scaleScores = data?.scale_scores || {};
  const totalScore = data?.total_score;
  const classification = data?.classification;
  const percentage = data?.percentage;

  return (
    <div className="ad-panel sm-card">
      <div className="sm-body">
        <div className="sm-head">
          <div className="sm-title-wrap">
            <span className="sm-tile"><Ico name="clipboard" size={20} /></span>
            <div style={{ minWidth: 0 }}>
              <h3 className="sm-title">Score Summary</h3>
              <div className="sm-sub">{quizTitle}</div>
            </div>
          </div>

          {totalScore !== undefined && (
            <div className="sm-total">
              <span className="sm-total-ico"><Ico name="target" size={20} /></span>
              <div>
                <div className="sm-total-label">Total score</div>
                <div className="sm-total-num">{totalScore}</div>
              </div>
              {classification && (
                 <span className="sm-badge" style={{ "--lv": "#b91c1c", "--lv-bg": "#fef2f2", "--lv-bd": "#fecaca" }}>
                   <Ico name="alert" size={13} sw={2.2} />
                   {classification} {percentage ? `(${percentage})` : ""}
                 </span>
              )}
            </div>
          )}
        </div>

        {Object.keys(scaleScores).length > 0 && (
          <div className="sm-grid" style={{ marginTop: "20px" }}>
            {Object.entries(scaleScores).map(([key, value]) => (
              <div className="sm-item lv-neutral" key={key}>
                <div className="sm-item-top">
                  <span className="sm-ico" style={{ background: "#f5f5f4", color: "#57534e" }}>
                    <Ico name={subIcon(key)} size={17} />
                  </span>
                  <span className="sm-name">{formatKey(key)}</span>
                </div>
                <div className="sm-mid" style={{ margin: "12px 0 0" }}>
                  <span className="sm-val">{String(value)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GeriatricSummaryCard({ data, quizTitle }) {
  const totalScore = data?.total_score;
  const interpretation = data?.interpretation;
  
  // Custom styling for the interpretation badge
  const isDepressed = interpretation?.toLowerCase().includes("suggests depression");
  const badgeStyle = isDepressed 
    ? { "--lv": "#b91c1c", "--lv-bg": "#fef2f2", "--lv-bd": "#fecaca" } 
    : { "--lv": "#1f8a4c", "--lv-bg": "#ecf8f1", "--lv-bd": "#bfe6cf" };

  return (
    <div className="ad-panel sm-card">
      <div className="sm-body">
        <div className="sm-head">
          <div className="sm-title-wrap">
            <span className="sm-tile"><Ico name="clipboard" size={20} /></span>
            <div style={{ minWidth: 0 }}>
              <h3 className="sm-title">Score Summary</h3>
              <div className="sm-sub">{quizTitle}</div>
            </div>
          </div>

          {totalScore !== undefined && (
            <div className="sm-total">
              <span className="sm-total-ico"><Ico name="target" size={20} /></span>
              <div>
                <div className="sm-total-label">Total score</div>
                <div className="sm-total-num">{totalScore}</div>
              </div>
              {interpretation && (
                 <span className="sm-badge" style={badgeStyle}>
                   <Ico name={isDepressed ? "alert" : "check"} size={13} sw={2.2} />
                   {interpretation}
                 </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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

  // Report state for specific assessment
  const [reportDetails, setReportDetails] = useState({ loading: false, error: "", data: null });

  const [lang, setLang] = useState("en");
  const [answerFilter, setAnswerFilter] = useState("All");
  const [reporting, setReporting] = useState(false);

  // 1. Added state to store the computed stats to avoid Date.now() in render
  const [stats, setStats] = useState({ total: 0, signed: 0, week: 0 });

  const cacheRef = useRef({}); // attempt_id -> details response
  const reportCacheRef = useRef({}); // attempt_id -> report response
  const reqRef = useRef(0); // ignores stale responses when you switch quickly
  const reportReqRef = useRef(0);

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

  /* ---------- 2. quizzes one patient attended ---------- */
  const loadAttempts = useCallback(
    async (p) => {
      const reqId = ++reqRef.current;
      setActiveId(null);
      setDetails({ loading: false, error: "", data: null });
      setReportDetails({ loading: false, error: "", data: null });
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
        const first = list.find((a) => a.total_answered > 0) || list[0];
        if (first) openAttempt(first);
      } catch (err) {
        if (reqId !== reqRef.current) return;
        setAttempts({ loading: false, error: err.message, message: "", list: [] });
      }
    },
    [api] // openAttempt intentionally omitted to avoid circular deps
  );

  /* ---------- 3. answers + specific report for one quiz attempt ---------- */
  const openAttempt = useCallback(
    async (attempt) => {
      const attemptId = attempt.attempt_id;
      const reqId = ++reqRef.current;
      const reportReqId = ++reportReqRef.current;

      setActiveId(attemptId);
      setAnswerFilter("All");

      /* --- Fetch Question Details --- */
      if (cacheRef.current[attemptId]) {
        setDetails({ loading: false, error: "", data: cacheRef.current[attemptId] });
      } else {
        setDetails({ loading: true, error: "", data: null });
        try {
          const data = await api(`/attempt/${attemptId}/details`);
          cacheRef.current[attemptId] = data;
          if (reqId === reqRef.current) setDetails({ loading: false, error: "", data });
        } catch (err) {
          if (reqId === reqRef.current) setDetails({ loading: false, error: err.message, data: null });
        }
      }

      /* --- Fetch Specific Report --- */
      if (reportCacheRef.current[attemptId]) {
        setReportDetails({ loading: false, error: "", data: reportCacheRef.current[attemptId] });
      } else {
        setReportDetails({ loading: true, error: "", data: null });
        try {
          let endpoint = null;

          // Map based on quiz_id or exact quiz title
          const titleLower = attempt.quiz_title?.toLowerCase() || "";

          if (attempt.quiz_id === 1 || titleLower.includes("beis-10") || titleLower.includes("emotional intelligence")) {
            endpoint = `/attempt/${attemptId}/first-quiz-report`;
          } else if (attempt.quiz_id === 2 || titleLower.includes("mhi-38") || titleLower.includes("mental health inventory")) {
            endpoint = `/attempt/${attemptId}/second-quiz-report`;
          } else if (attempt.quiz_id === 3 || titleLower.includes("scared") || titleLower.includes("screen for child anxiety")) {
            endpoint = `/attempt/${attemptId}/third-quiz-report`;
          } else if (attempt.quiz_id === 4 || titleLower.includes("autism") || titleLower.includes("indian scale")) {
            endpoint = `/attempt/${attemptId}/fourth-quiz-report`;
          } else if (attempt.quiz_id === 5 || titleLower.includes("geriatric") || titleLower.includes("gds")) {
            endpoint = `/attempt/${attemptId}/fifth-quiz-report`;
          } else if (isBigFive(attempt)) {
            // Big Five Inventory-10 (BFI-10)
            endpoint = `/attempt/${attemptId}/sixth-quiz-report`;
          }

          if (endpoint) {
            const data = await api(endpoint);
            reportCacheRef.current[attemptId] = data;
            if (reportReqId === reportReqRef.current) setReportDetails({ loading: false, error: "", data });
          } else {
            if (reportReqId === reportReqRef.current) {
              setReportDetails({ loading: false, error: "Report API not configured for this assessment.", data: null });
            }
          }
        } catch (err) {
          if (reportReqId === reportReqRef.current) setReportDetails({ loading: false, error: err.message, data: null });
        }
      }
    },
    [api]
  );

  const openPatient = (p) => {
    cacheRef.current = {};
    reportCacheRef.current = {};
    setPatient(p);
    window.scrollTo({ top: 0 });
    loadAttempts(p);
  };

  const closePatient = () => {
    reqRef.current++;
    reportReqRef.current++;
    setPatient(null);
    window.scrollTo({ top: 0 });
  };

  /* ---------- derived ---------- */
  
  // 2. Moved Date.now() into useEffect to avoid prerender build error
  useEffect(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    setStats({
      total: patients.length,
      signed: patients.filter((p) => p.declarations > 0).length,
      week: patients.filter((p) => new Date(p.created_at).getTime() >= weekAgo).length,
    });
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

  /* ---------- report: printable summary of every assessment ---------- */
  const generateReport = async () => {
    if (!patient || attempts.list.length === 0 || reporting) return;

    // open the tab right away (inside the click) so pop-up blockers allow it
    const w = window.open("", "_blank");
    if (!w) {
      alert("Please allow pop-ups to open the report.");
      return;
    }
    w.document.write("<p style=\"font-family:sans-serif;padding:24px\">Preparing report...</p>");
    setReporting(true);

    try {
      const results = await Promise.all(
        attempts.list.map(async (a) => {
          let d = cacheRef.current[a.attempt_id];
          if (!d) {
            d = await api(`/attempt/${a.attempt_id}/details`);
            cacheRef.current[a.attempt_id] = d;
          }
          return { a, d };
        })
      );

      const info = [
        ["Patient ID", patient.id],
        ["Age / Gender", [patient.age ? `${patient.age} yrs` : "", cap(patient.gender)].filter(Boolean).join(", ") || "-"],
        ["Phone", val(patient.phone)],
        ["Email", val(patient.email)],
        ["Address", [patient.full_address, patient.city, patient.state, patient.pincode].filter(Boolean).join(", ") || "-"],
        ["Registered on", fmtDate(patient.created_at)],
      ];

      const sections = results
        .map(({ a, d }) => {
          const qs = d?.data || [];
          const body = qs
            .map(
              (r) => `
            <div class="q ${r.is_answered ? "" : "skip"}">
              <span class="no">${esc(r.question_no)}</span>
              <div>
                <div class="qt">${esc(lang === "ta" ? r.question_text_ta || r.question_text : r.question_text)}</div>
                <div class="an">${
                  r.is_answered
                    ? `${esc(r.answer_text)}${
                        r.answer_score !== null && r.answer_score !== undefined
                          ? ` <span class="sc">Score ${esc(r.answer_score)}</span>`
                          : ""
                      }`
                    : "<i>Not attended</i>"
                }</div>
              </div>
            </div>`
            )
            .join("");
          return `
          <section>
            <h2>${esc(a.quiz_title)}</h2>
            <p class="meta">${esc(d?.total_answered ?? a.total_answered)} answered &middot; ${esc(
            d?.total_unanswered ?? a.balance ?? 0
          )} not attended &middot; ${esc(d?.total_questions ?? a.total_questions)} questions</p>
            ${body}
          </section>`;
        })
        .join("");

      const html = `<!doctype html><html><head><meta charset="utf-8" />
        <title>Assessment report - ${esc(patient.full_name)}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: -apple-system, "Segoe UI", Roboto, "Noto Sans Tamil", sans-serif; color: #1c1917; margin: 0; padding: 32px; font-size: 13px; line-height: 1.5; }
          h1 { margin: 0 0 4px; font-size: 22px; }
          .sub { color: #78716c; margin: 0 0 20px; }
          .info { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 24px; padding: 14px 16px; border: 1px solid #e7e5e4; border-radius: 10px; margin-bottom: 24px; }
          .info b { display: block; font-size: 11px; font-weight: 600; color: #78716c; }
          section { margin-bottom: 28px; }
          h2 { margin: 0 0 2px; font-size: 16px; padding-bottom: 6px; border-bottom: 2px solid #f97316; }
          .meta { margin: 6px 0 10px; color: #78716c; font-size: 12px; }
          .q { display: flex; gap: 12px; padding: 9px 0; border-top: 1px solid #e7e5e4; break-inside: avoid; }
          .no { flex: none; width: 24px; height: 24px; display: grid; place-items: center; border-radius: 6px; background: #ffedd5; color: #c2410c; font-size: 11px; font-weight: 600; }
          .qt { font-weight: 500; }
          .an { margin-top: 3px; color: #c2410c; font-weight: 600; }
          .skip .qt, .skip .an { color: #78716c; font-weight: 400; }
          .sc { margin-left: 6px; padding: 1px 7px; border-radius: 6px; background: #fff7ed; border: 1px solid #fed7aa; font-size: 11px; }
          @media print { body { padding: 0; } }
        </style></head><body>
        <h1>${esc(patient.full_name)}</h1>
        <p class="sub">Assessment report &middot; Generated on ${esc(fmtDate(new Date().toISOString()))}</p>
        <div class="info">${info.map(([k, v]) => `<div><b>${esc(k)}</b>${esc(v)}</div>`).join("")}</div>
        ${sections}
      </body></html>`;

      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 400);
    } catch (err) {
      w.document.body.innerHTML = `<p style="font-family:sans-serif;padding:24px">Couldn't build the report: ${esc(err.message)}</p>`;
    } finally {
      setReporting(false);
    }
  };

  /* ---------------------------------------------------------------- */
  return (
    <div className="pt">
      <style>{`
        /* ---------- brand tokens (Athma logo: orange + blue + green) ---------- */
        .pt {
          --navy: #1f4e8c; --navy-50: #eef4fb; --navy-100: #d6e4f5;
          --green: #2e9d5b; --green-50: #ecf8f1; --green-100: #c6e8d4;
        }

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
        @media (prefers-reduced-motion: reduce) { .pl-spin { animation-duration: 2s; } .sm-item { transition: none; } }

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

        /* 3 columns: details | selected assessment (center) | assessments list (right) */
        .pd-grid { display: grid; grid-template-columns: 270px minmax(0, 1fr) 300px; gap: 16px; align-items: start; }
        .pd-side { position: sticky; top: 20px; padding: 4px 22px 8px; }
        .pd-group { padding: 16px 0; }
        .pd-group + .pd-group { border-top: 1px solid var(--line); }
        .pd-group-title { display: flex; align-items: center; gap: 8px; margin: 0 0 10px; font-size: 13px; font-weight: 600; }
        .pd-group-title svg { color: var(--navy); }
        .pd-dl { display: grid; gap: 10px; margin: 0; }
        .pd-dl dt { font-size: 11.5px; font-weight: 500; color: var(--muted); }
        .pd-dl dd { margin: 2px 0 0; font-size: 13px; font-weight: 500; line-height: 1.5; word-break: break-word; }

        .pd-main { min-width: 0; display: flex; flex-direction: column; gap: 16px; }

        /* right sidebar: assessments list */
        .pd-rail { position: sticky; top: 20px; padding: 16px; }
        .pd-rail-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 0 0 12px; }
        .pd-rail-title { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 14px; font-weight: 600; letter-spacing: -0.01em; }
        .pd-rail-title svg { color: var(--navy); }
        .pd-rail-count { display: block; margin-top: 2px; font-size: 12px; font-weight: 500; color: var(--muted); }
        .pd-report {
          flex: none; display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 8px;
          border: 1px solid var(--o-500); background: var(--o-500); color: #fff; font-family: inherit;
          font-size: 12.5px; font-weight: 600; cursor: pointer; transition: background .15s;
        }
        .pd-report:hover:not(:disabled) { background: var(--o-600); border-color: var(--o-600); }
        .pd-report:disabled { opacity: .5; cursor: not-allowed; }
        .pd-report:focus-visible { outline: 2px solid var(--o-500); outline-offset: 2px; }
        .pd-rail .pl-state { padding: 28px 8px; }

        .pd-quizzes { display: flex; flex-direction: column; gap: 10px; }
        .pd-quiz {
          display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 14px; border-radius: 12px; text-align: left;
          border: 1px solid var(--line); background: #fff; color: inherit; font-family: inherit; cursor: pointer;
          transition: border-color .15s, background .15s;
        }
        .pd-quiz:hover { border-color: var(--o-200); }
        .pd-quiz.on { border-color: var(--o-500); background: var(--o-50); }
        .pd-quiz:focus-visible { outline: 2px solid var(--o-500); outline-offset: 2px; }
        .pd-quiz-ring { flex: none; }
        .pd-quiz-body { min-width: 0; }
        .pd-quiz-title { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 12.5px; font-weight: 600; line-height: 1.4; }
        .pd-quiz-meta { display: block; margin-top: 3px; font-size: 12px; color: var(--muted); }

        /* ---------- score summary ---------- */
        .lv-low { --lv: #1f4e8c; --lv-bg: #eef4fb; --lv-bd: #cfe0f3; }
        .lv-normal { --lv: #1f8a4c; --lv-bg: #ecf8f1; --lv-bd: #bfe6cf; }
        .lv-high { --lv: #c2410c; --lv-bg: #fff2e8; --lv-bd: #fed7aa; }
        .lv-indicated { --lv: #b91c1c; --lv-bg: #fef2f2; --lv-bd: #fecaca; }
        .lv-neutral { --lv: #57534e; --lv-bg: #f5f5f4; --lv-bd: #e7e5e4; }

        .sm-card { overflow: hidden; }
        .sm-card::before { content: ""; display: block; height: 4px; background: linear-gradient(90deg, var(--o-500), var(--navy) 62%, var(--green)); }
        .sm-body { padding: 20px 22px 22px; }
        .sm-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .sm-title-wrap { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .sm-tile {
          flex: none; width: 40px; height: 40px; display: grid; place-items: center; border-radius: 10px;
          background: var(--o-50); color: var(--o-600); border: 1px solid var(--o-100);
        }
        .sm-title { margin: 0; font-size: 15px; font-weight: 600; letter-spacing: -0.01em; }
        .sm-sub { margin-top: 2px; font-size: 12px; color: var(--muted); }

        .sm-total {
          display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 12px;
          background: var(--navy-50); border: 1px solid var(--navy-100);
        }
        .sm-total-ico { color: var(--navy); display: grid; place-items: center; }
        .sm-total-label { font-size: 11.5px; font-weight: 500; color: var(--muted); }
        .sm-total-num { font-size: 26px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.05; color: var(--navy); font-variant-numeric: tabular-nums; }

        .sm-badge {
          display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px 4px 8px; border-radius: 999px;
          border: 1px solid var(--lv-bd); background: var(--lv-bg); color: var(--lv);
          font-size: 12px; font-weight: 600; white-space: nowrap;
        }

        .sm-counts { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin: 16px 0 14px; padding-top: 14px; border-top: 1px solid var(--line); }
        .sm-counts-label { margin-right: 2px; font-size: 12px; font-weight: 500; color: var(--muted); }

        .sm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 12px; }
        .sm-item {
          padding: 14px; border-radius: 12px; border: 1px solid var(--line); border-top: 3px solid var(--lv);
          background: #fff; transition: box-shadow .15s, transform .15s;
        }
        .sm-item:hover { box-shadow: 0 4px 14px rgba(28, 25, 23, .07); transform: translateY(-1px); }
        .sm-item-top { display: flex; align-items: center; gap: 10px; }
        .sm-ico { flex: none; width: 32px; height: 32px; display: grid; place-items: center; border-radius: 8px; background: var(--lv-bg); color: var(--lv); }
        .sm-name { font-size: 12.5px; font-weight: 600; line-height: 1.35; color: var(--ink); }
        .sm-mid { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 12px 0 10px; }
        .sm-val { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; line-height: 1; font-variant-numeric: tabular-nums; color: var(--ink); }
        .sm-seg { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
        .sm-seg i { height: 5px; border-radius: 99px; background: #e7e5e4; }
        .sm-seg i.on { background: var(--lv); }
        .sm-seg-labels { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-top: 5px; font-size: 10.5px; color: var(--muted); text-align: center; }
        .sm-seg-labels span.on { color: var(--lv); font-weight: 600; }

        .sm-error {
          display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 10px;
          background: #fffbeb; border: 1px solid #fde68a; color: #92400e; font-size: 13px; line-height: 1.5;
        }
        .sm-error svg { flex: none; margin-top: 1px; }

        /* ---------- question results ---------- */
        .pd-results { padding: 20px 22px 6px; }
        .pd-results-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
        .pd-results-title { margin: 0; font-size: 14px; font-weight: 600; line-height: 1.45; max-width: 520px; }
        .pd-mini { display: flex; gap: 10px; flex-wrap: wrap; }
        .pd-mini-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 10px; background: #fafaf9; border: 1px solid var(--line); }
        .pd-mini-ico { flex: none; width: 28px; height: 28px; display: grid; place-items: center; border-radius: 8px; }
        .pd-mini-item.ok .pd-mini-ico { background: var(--green-50); color: var(--green); }
        .pd-mini-item.skip .pd-mini-ico { background: #f5f5f4; color: var(--muted); }
        .pd-mini-item.all .pd-mini-ico { background: var(--navy-50); color: var(--navy); }
        .pd-mini-num { font-size: 18px; font-weight: 600; letter-spacing: -0.02em; line-height: 1; font-variant-numeric: tabular-nums; }
        .pd-mini-label { margin-top: 3px; font-size: 11.5px; color: var(--muted); font-weight: 500; }

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
          display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 5px 6px 5px 10px;
          border-radius: 8px; background: var(--green-50); border: 1px solid var(--green-100);
        }
        .pd-ans > svg { color: var(--green); flex: none; }
        .pd-ans-text { font-size: 12.5px; font-weight: 600; color: #1f6b43; }
        .pd-score { padding: 2px 8px; border-radius: 6px; background: #fff; color: var(--navy); font-size: 11.5px; font-weight: 600; border: 1px solid var(--navy-100); }
        .pd-skip { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-style: italic; color: var(--muted); }

        @media (max-width: 1280px) {
          .pd-grid { grid-template-columns: 1fr; }
          .pd-side, .pd-rail { position: static; }
          .pd-rail { order: 1; }
          .pd-main { order: 2; }
          .pd-side { order: 3; }
          .pd-quizzes { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
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
          .sm-body { padding: 16px; }
          .sm-grid { grid-template-columns: 1fr; }
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
            {/* ---------------- LEFT: patient details ---------------- */}
            <aside className="ad-panel pd-side">
              <div className="pd-group">
                <h3 className="pd-group-title"><Ico name="phone" size={15} /> Contact</h3>
                <dl className="pd-dl">
                  <div><dt>Phone</dt><dd>{val(patient.phone)}</dd></div>
                  <div><dt>Email</dt><dd>{val(patient.email)}</dd></div>
                </dl>
              </div>
              <div className="pd-group">
                <h3 className="pd-group-title"><Ico name="briefcase" size={15} /> Background</h3>
                <dl className="pd-dl">
                  <div><dt>Marital status</dt><dd>{val(patient.marital_status)}</dd></div>
                  <div><dt>Education</dt><dd>{val(patient.education)}</dd></div>
                  <div><dt>Occupation</dt><dd>{val(patient.occupation)}</dd></div>
                </dl>
              </div>
              <div className="pd-group">
                <h3 className="pd-group-title"><Ico name="pin" size={15} /> Address</h3>
                <dl className="pd-dl">
                  <div>
                    <dt>Full address</dt>
                    <dd>{[patient.full_address, patient.city, patient.state, patient.pincode].filter(Boolean).join(", ") || "-"}</dd>
                  </div>
                </dl>
              </div>
              <div className="pd-group">
                <h3 className="pd-group-title"><Ico name="calendar" size={15} /> Registration</h3>
                <dl className="pd-dl">
                  <div><dt>Registered on</dt><dd>{fmtDate(patient.created_at)}</dd></div>
                  <div><dt>Referred by</dt><dd>{val(patient.referred_by)}</dd></div>
                </dl>
              </div>
            </aside>

            {/* ---------------- CENTER: selected assessment & report ---------------- */}
            <section className="pd-main">
              {activeAttempt ? (
                <>
                  {/* --- Specific Assessment Report Card --- */}
                  {reportDetails.loading && (
                    <div className="ad-panel pl-state"><span className="pl-spin" /><div>Loading report data...</div></div>
                  )}
                  {!reportDetails.loading && reportDetails.data && (
                    // Pick the custom layout for each assessment
                    (activeAttempt.quiz_id === 4 || activeAttempt.quiz_title?.toLowerCase().includes("autism")) ? (
                      <AutismSummaryCard data={reportDetails.data} quizTitle={activeAttempt.quiz_title} />
                    ) : (activeAttempt.quiz_id === 5 || activeAttempt.quiz_title?.toLowerCase().includes("geriatric")) ? (
                      <GeriatricSummaryCard data={reportDetails.data} quizTitle={activeAttempt.quiz_title} />
                    ) : isBigFive(activeAttempt) ? (
                      <BigFiveSummaryCard data={reportDetails.data} quizTitle={activeAttempt.quiz_title} />
                    ) : (
                      <SummaryCard data={reportDetails.data} quizTitle={activeAttempt.quiz_title} />
                    )
                  )}
                  {!reportDetails.loading && reportDetails.error && (
                    <div className="sm-error">
                      <Ico name="alert" size={16} />
                      <div><strong>Score summary unavailable.</strong> {reportDetails.error}</div>
                    </div>
                  )}

                  {/* --- Question Results --- */}
                  <div className="ad-panel pd-results">
                    <div className="pd-results-head">
                      <h3 className="pd-results-title">{activeAttempt.quiz_title}</h3>
                      <div className="pd-mini">
                        <div className="pd-mini-item ok">
                          <span className="pd-mini-ico"><Ico name="check" size={16} /></span>
                          <div><div className="pd-mini-num">{answered}</div><div className="pd-mini-label">Answered</div></div>
                        </div>
                        <div className="pd-mini-item skip">
                          <span className="pd-mini-ico"><Ico name="minus" size={16} /></span>
                          <div><div className="pd-mini-num">{unanswered}</div><div className="pd-mini-label">Not attended</div></div>
                        </div>
                        <div className="pd-mini-item all">
                          <span className="pd-mini-ico"><Ico name="list" size={16} /></span>
                          <div><div className="pd-mini-num">{total}</div><div className="pd-mini-label">Questions</div></div>
                        </div>
                      </div>
                    </div>

                    {details.loading && (
                      <div className="pl-state"><span className="pl-spin" /><div>Loading answers...</div></div>
                    )}

                    {!details.loading && details.error && (
                      <div className="pl-state">
                        <strong>Couldn&apos;t load answers</strong>
                        {details.error}
                        <div><button type="button" className="pl-retry" onClick={() => openAttempt(activeAttempt)}>Try again</button></div>
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
                                  <Ico name="check" size={14} sw={2.2} />
                                  <span className="pd-ans-text">{r.answer_text}</span>
                                  {r.answer_score !== null && r.answer_score !== undefined && (
                                    <span className="pd-score">Score {r.answer_score}</span>
                                  )}
                                </span>
                              ) : (
                                <span className="pd-skip"><Ico name="minus" size={14} /> Not attended</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="ad-panel pl-state">
                  <strong>
                    {attempts.loading
                      ? "Loading assessments..."
                      : attempts.list.length > 0
                      ? "Select an assessment"
                      : "No assessment to show"}
                  </strong>
                  {attempts.list.length > 0 && "Choose a quiz from the list on the right to see its answers here."}
                </div>
              )}
            </section>

            {/* ---------------- RIGHT: assessments list ---------------- */}
            <aside className="ad-panel pd-rail" aria-label="Assessments">
              <div className="pd-rail-head">
                <div>
                  <h2 className="pd-rail-title"><Ico name="clipboard" size={16} /> Assessments</h2>
                  {!attempts.loading && !attempts.error && (
                    <span className="pd-rail-count">{attempts.list.length} quizzes attended</span>
                  )}
                </div>
                <button
                  type="button"
                  className="pd-report"
                  onClick={generateReport}
                  disabled={attempts.loading || !!attempts.error || attempts.list.length === 0 || reporting}
                >
                  {ReportIcon} {reporting ? "Preparing..." : "Report"}
                </button>
              </div>

              {attempts.loading && (
                <div className="pl-state"><span className="pl-spin" /><div>Loading assessments...</div></div>
              )}

              {!attempts.loading && attempts.error && (
                <div className="pl-state">
                  <strong>Couldn&apos;t load assessments</strong>
                  {attempts.error}
                  <div><button type="button" className="pl-retry" onClick={() => loadAttempts(patient)}>Try again</button></div>
                </div>
              )}

              {!attempts.loading && !attempts.error && attempts.list.length === 0 && (
                <div className="pl-state">
                  <strong>No assessments yet</strong>
                  {attempts.message || "This patient has not attended any quiz yet."}
                </div>
              )}

              {!attempts.loading && !attempts.error && attempts.list.length > 0 && (
                <div className="pd-quizzes">
                  {attempts.list.map((a) => {
                    const pct = a.total_questions ? (a.total_answered / a.total_questions) * 100 : 0;
                    return (
                      <button
                        type="button"
                        key={a.attempt_id}
                        className={`pd-quiz ${activeId === a.attempt_id ? "on" : ""}`}
                        onClick={() => openAttempt(a)}
                        aria-pressed={activeId === a.attempt_id}
                      >
                        <span className="pd-quiz-ring"><Ring pct={pct} /></span>
                        <span className="pd-quiz-body">
                          <span className="pd-quiz-title">{a.quiz_title}</span>
                          <span className="pd-quiz-meta">{a.total_answered} of {a.total_questions} answered</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}