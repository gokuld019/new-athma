import Link from "next/link";

// Sample data — replace with your API response later
const WEEK = [
  { d: "Mon", v: 42 }, { d: "Tue", v: 58 }, { d: "Wed", v: 51 }, { d: "Thu", v: 73 },
  { d: "Fri", v: 66 }, { d: "Sat", v: 34 }, { d: "Sun", v: 27 },
];

const RISK = [
  { name: "Low", color: "#fdba74", count: 542 },
  { name: "Moderate", color: "#f97316", count: 344 },
  { name: "High", color: "#9a3412", count: 156 },
];

const RECENT = [
  { who: "Priya Raman", what: "completed the EPI assessment", when: "12 min ago", tone: "ok", tag: "Completed" },
  { who: "Meena Lakshmi", what: "was flagged as high risk", when: "1 hr ago", tone: "alert", tag: "High risk" },
  { who: "Dr. Anitha", what: "added notes to ATH-1038", when: "2 hr ago", tone: "info", tag: "Notes" },
  { who: "Karthik Subramanian", what: "started the assessment", when: "3 hr ago", tone: "info", tag: "In progress" },
];

const initials = (name) =>
  name.replace(/^Dr\.\s*/, "").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

const CSS = `
.ov { --bg:#f6f7f8; --surface:#ffffff; --ink:#111827; --muted:#6b7280; --line:#e5e7eb;
  --accent:#ea580c; --accent-soft:#ffedd5; --accent-ink:#c2410c;
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif; color: var(--ink);
  display:flex; flex-direction:column; gap:20px; }
.ov * { box-sizing:border-box; }
.ov h2 { margin:0; font-size:14px; font-weight:600; letter-spacing:-0.01em; }

.ov-panel { background:var(--surface); border:1px solid var(--line); border-radius:12px; }
.ov-head { display:flex; align-items:center; justify-content:space-between; padding:14px 22px; border-bottom:1px solid var(--line); }
.ov-note { font-size:12px; color:var(--muted); }

/* KPI strip: one panel, three columns split by hairlines */
.ov-kpis { display:grid; grid-template-columns:repeat(3, 1fr); }
.ov-kpi { padding:18px 22px; }
.ov-kpi + .ov-kpi { border-left:1px solid var(--line); }
.ov-kpi-label { font-size:12px; color:var(--muted); font-weight:500; }
.ov-kpi-num { font-size:28px; line-height:1.1; font-weight:600; letter-spacing:-0.03em; margin-top:10px; font-variant-numeric:tabular-nums; }
.ov-kpi-foot { font-size:12px; color:var(--muted); margin-top:6px; }
.ov-up { color:#c2410c; font-weight:600; }
.ov-down { color:#b91c1c; font-weight:600; }

.ov-grid { display:grid; grid-template-columns:minmax(0, 1.7fr) minmax(0, 1fr); gap:20px; }

/* Bar chart */
.ov-chart { padding:22px 22px 18px; }
.ov-plot { position:relative; height:220px; }
.ov-gl { position:absolute; left:0; right:0; border-top:1px solid var(--line); }
.ov-gl span { position:absolute; left:0; top:-9px; font-size:11px; color:var(--muted); background:var(--surface); padding-right:8px; }
.ov-bars { position:absolute; inset:0 0 0 34px; display:flex; align-items:flex-end; justify-content:space-between; gap:14px; }
.ov-col { flex:1; height:100%; display:flex; align-items:flex-end; justify-content:center; }
.ov-bar { width:100%; max-width:34px; background:#cbd5e1; border-radius:6px 6px 0 0; position:relative; }
.ov-bar.peak { background:var(--accent); }
.ov-bar:hover { background:#94a3b8; }
.ov-bar.peak:hover { background:var(--accent-ink); }
.ov-bar-val { position:absolute; top:-22px; left:50%; transform:translateX(-50%); font-size:12px; font-weight:600; font-variant-numeric:tabular-nums; }
.ov-days { display:flex; justify-content:space-between; gap:14px; margin:10px 0 0 34px; }
.ov-days span { flex:1; text-align:center; font-size:12px; color:var(--muted); }

/* Donut */
.ov-risk { padding:22px; display:flex; flex-direction:column; align-items:center; gap:20px; }
.ov-donut { position:relative; width:148px; height:148px; }
.ov-donut svg { transform:rotate(-90deg); display:block; }
.ov-donut-mid { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
.ov-donut-mid b { font-size:20px; font-weight:600; letter-spacing:-0.02em; }
.ov-donut-mid span { font-size:12px; color:var(--muted); }
.ov-legend { width:100%; display:flex; flex-direction:column; }
.ov-legend-row { display:flex; align-items:center; gap:10px; padding:9px 0; border-top:1px solid var(--line); font-size:13px; }
.ov-dot { width:8px; height:8px; border-radius:50%; flex:none; }
.ov-legend-name { flex:1; color:var(--muted); }
.ov-legend-count { font-weight:600; font-variant-numeric:tabular-nums; }
.ov-legend-pct { width:44px; text-align:right; color:var(--muted); font-size:12px; font-variant-numeric:tabular-nums; }

/* Activity */
.ov-link { font-size:12px; font-weight:500; color:var(--accent-ink); text-decoration:none; padding:6px 12px; border:1px solid var(--line); border-radius:8px; }
.ov-link:hover { background:var(--bg); }
.ov-feed { list-style:none; margin:0; padding:0; }
.ov-item { display:flex; align-items:center; gap:14px; padding:14px 22px; }
.ov-item + .ov-item { border-top:1px solid var(--line); }
.ov-avatar { width:36px; height:36px; border-radius:50%; background:var(--bg); border:1px solid var(--line); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:600; color:#374151; flex:none; }
.ov-text { flex:1; min-width:0; font-size:13px; }
.ov-text strong { font-weight:600; }
.ov-when { font-size:11.5px; color:var(--muted); margin-top:2px; }
.ov-tag { font-size:11.5px; font-weight:500; padding:4px 10px; border-radius:999px; white-space:nowrap; }
.ov-tag.ok { background:#ffedd5; color:#9a3412; }
.ov-tag.alert { background:#fee2e2; color:#991b1b; }
.ov-tag.info { background:#e0f2fe; color:#075985; }

.ov a:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }

@media (max-width: 900px) {
  .ov-grid { grid-template-columns:1fr; }
}
@media (max-width: 640px) {
  .ov-kpis { grid-template-columns:1fr; }
  .ov-kpi + .ov-kpi { border-left:0; border-top:1px solid var(--line); }
  .ov-tag { display:none; }
}
`;

export default function OverviewPage() {
  const maxWeek = Math.max(...WEEK.map((w) => w.v));
  const total = RISK.reduce((s, r) => s + r.count, 0);

  // Donut geometry
  const R = 58;
  const C = 2 * Math.PI * R;
  let offset = 0;
  const segments = RISK.map((r) => {
    const len = (r.count / total) * C;
    const seg = { ...r, len, offset };
    offset += len;
    return seg;
  });

  return (
    <div className="ov">
      <style>{CSS}</style>

      {/* KPI strip */}
      <section className="ov-panel ov-kpis">
        <div className="ov-kpi">
          <div className="ov-kpi-label">Assessments completed this week</div>
          <div className="ov-kpi-num">351</div>
          <div className="ov-kpi-foot"><span className="ov-up">+12%</span> vs last week</div>
        </div>
        <div className="ov-kpi">
          <div className="ov-kpi-label">Registered patients</div>
          <div className="ov-kpi-num">1,042</div>
          <div className="ov-kpi-foot"><span className="ov-up">+28</span> this month</div>
        </div>
        <div className="ov-kpi">
          <div className="ov-kpi-label">High-risk follow-ups</div>
          <div className="ov-kpi-num">14</div>
          <div className="ov-kpi-foot"><span className="ov-down">5 waiting</span> for a call</div>
        </div>
      </section>

      {/* Chart + risk */}
      <section className="ov-grid">
        <div className="ov-panel">
          <div className="ov-head">
            <h2>Assessments by day</h2>
            <span className="ov-note">Last 7 days</span>
          </div>
          <div className="ov-chart">
            <div className="ov-plot">
              {[100, 75, 50, 25, 0].map((p) => (
                <div className="ov-gl" key={p} style={{ top: `${100 - p}%` }}>
                  <span>{Math.round((maxWeek * p) / 100)}</span>
                </div>
              ))}
              <div className="ov-bars">
                {WEEK.map((w) => (
                  <div className="ov-col" key={w.d}>
                    <div
                      className={`ov-bar ${w.v === maxWeek ? "peak" : ""}`}
                      style={{ height: `${(w.v / maxWeek) * 100}%` }}
                    >
                      <span className="ov-bar-val">{w.v}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="ov-days">
              {WEEK.map((w) => <span key={w.d}>{w.d}</span>)}
            </div>
          </div>
        </div>

        <div className="ov-panel">
          <div className="ov-head">
            <h2>Risk levels</h2>
            <span className="ov-note">All patients</span>
          </div>
          <div className="ov-risk">
            <div className="ov-donut">
              <svg width="148" height="148" viewBox="0 0 148 148" role="img" aria-label="Risk level distribution">
                <circle cx="74" cy="74" r={R} fill="none" stroke="#f1f5f9" strokeWidth="16" />
                {segments.map((s) => (
                  <circle
                    key={s.name}
                    cx="74" cy="74" r={R}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="16"
                    strokeDasharray={`${s.len - 2} ${C - s.len + 2}`}
                    strokeDashoffset={-s.offset}
                  />
                ))}
              </svg>
              <div className="ov-donut-mid">
                <b>{total.toLocaleString("en-IN")}</b>
                <span>patients</span>
              </div>
            </div>
            <div className="ov-legend">
              {RISK.map((r) => (
                <div className="ov-legend-row" key={r.name}>
                  <span className="ov-dot" style={{ background: r.color }} />
                  <span className="ov-legend-name">{r.name}</span>
                  <span className="ov-legend-count">{r.count}</span>
                  <span className="ov-legend-pct">{Math.round((r.count / total) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Activity */}
      <section className="ov-panel">
        <div className="ov-head">
          <h2>Latest activity</h2>
          <Link href="/admin/activity" className="ov-link">View all</Link>
        </div>
        <ul className="ov-feed">
          {RECENT.map((a, i) => (
            <li className="ov-item" key={i}>
              <span className="ov-avatar">{initials(a.who)}</span>
              <div className="ov-text">
                <div><strong>{a.who}</strong> {a.what}</div>
                <div className="ov-when">{a.when}</div>
              </div>
              <span className={`ov-tag ${a.tone}`}>{a.tag}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}