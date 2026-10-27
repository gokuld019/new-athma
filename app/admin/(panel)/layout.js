"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const Icon = ({ children, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const NAV = [
  {
    href: "/admin/dashboard", label: "Overview", title: "Overview", sub: "Today at Athma Counselling",
    icon: <Icon><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></Icon>,
  },
  {
    href: "/admin/patients", label: "Patients", title: "Patients", sub: "Everyone registered on the platform",
    icon: <Icon><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" /><path d="M18 14.8c1.9.6 3.1 2.4 3.5 5.2" /></Icon>,
  },
  {
    href: "/admin/questions", label: "Questions & Answers", title: "Questions & Answers", sub: "How patients respond to each assessment question",
    icon: <Icon><path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L3 21l1.5-5.4A8.5 8.5 0 1 1 21 12z" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5" /><path d="M12 16.5h.01" /></Icon>,
  },
  {
    href: "/admin/reports", label: "Reports", title: "Reports", sub: "Download summaries for your team",
    icon: <Icon><path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h4" /></Icon>,
  },
  {
    href: "/admin/activity", label: "Activity", title: "Activity", sub: "Recent events across the platform",
    icon: <Icon><path d="M3 12h4l2.5-7 5 14 2.5-7H21" /></Icon>,
  },
];

const LogoutIcon = (
  <Icon><path d="M9 21H5.5A1.5 1.5 0 0 1 4 19.5v-15A1.5 1.5 0 0 1 5.5 3H9" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></Icon>
);
const MenuIcon = (
  <Icon size={20}><path d="M4 7h16M4 12h16M4 17h16" /></Icon>
);

const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export default function AdminPanelLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [ready, setReady] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [navOpen, setNavOpen] = useState(false);

  // auth guard for every page inside the admin panel
  useEffect(() => {
    const token = localStorage.getItem("athma_token");
    const role = localStorage.getItem("athma_role");
    if (!token || role !== "admin") {
      router.replace("/admin/login");
      return;
    }
    try {
      const raw = localStorage.getItem("athma_user");
      if (raw) setAdmin(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, [router]);

  // close the mobile menu after navigating
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("athma_token");
    localStorage.removeItem("athma_role");
    localStorage.removeItem("athma_user");
    router.replace("/admin/login");
  };

  if (!ready) return null;

  const current = NAV.find((n) => pathname === n.href || pathname.startsWith(n.href + "/")) || NAV[0];
  const adminName = admin?.name || admin?.fullName || "Admin";
  const adminEmail = admin?.email || "";

  return (
    <div className="ad-shell">
      <style>{`
        .ad-shell {
          --o-50: #fff7ed;
          --o-100: #ffedd5;
          --o-200: #fed7aa;
          --o-400: #fb923c;
          --o-500: #f97316;
          --o-600: #ea580c;
          --o-700: #c2410c;
          --ink: #1c1917;
          --ink-2: #44403c;
          --muted: #78716c;
          --line: #f1e7df;
          --bg: #fffaf6;
          --green: #15803d;
          --green-bg: #dcfce7;
          --red: #b91c1c;
          --red-bg: #fee2e2;
          --blue: #1d4ed8;
          --blue-bg: #dbeafe;
          --amber: #a16207;
          --amber-bg: #fef3c7;
          display: grid;
          grid-template-columns: 264px 1fr;
          min-height: 100vh;
          font-family: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
          color: var(--ink);
          background: var(--bg);
        }
        .ad-shell *, .ad-shell *::before, .ad-shell *::after { box-sizing: border-box; }
        .ad-shell button { font-family: inherit; }
        .ad-shell :focus-visible { outline: 2px solid var(--o-500); outline-offset: 2px; }

        /* ---------- sidebar ---------- */
        .ad-side {
          position: sticky; top: 0; height: 100vh;
          display: flex; flex-direction: column;
          padding: 24px 16px 16px;
          background: #fff; border-right: 1px solid var(--line);
        }
        .ad-brand { display: flex; align-items: center; padding: 0 10px 22px; }
        .ad-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .ad-nav-label { padding: 0 12px 8px; font-size: 12px; font-weight: 600; color: var(--muted); }
        .ad-link {
          text-decoration: none;
          position: relative; display: flex; align-items: center; gap: 12px;
          width: 100%; padding: 11px 12px; border: none; border-radius: 12px;
          background: transparent; color: var(--ink-2);
          font-size: 14.5px; font-weight: 500; text-align: left; cursor: pointer;
          transition: background .18s, color .18s;
        }
        .ad-link:hover { background: var(--o-50); color: var(--o-700); }
        .ad-link.active { background: var(--o-100); color: var(--o-700); font-weight: 700; }
        .ad-link.active::before {
          content: ""; position: absolute; left: -16px; top: 9px; bottom: 9px;
          width: 4px; border-radius: 0 4px 4px 0; background: var(--o-500);
        }

        .ad-user {
          display: flex; align-items: center; gap: 12px;
          padding: 12px; border-radius: 16px; background: var(--o-50); border: 1px solid var(--line);
        }
        .ad-avatar {
          flex: none; width: 38px; height: 38px; display: grid; place-items: center;
          border-radius: 12px; background: linear-gradient(135deg, var(--o-400), var(--o-600));
          color: #fff; font-size: 13px; font-weight: 700;
        }
        .ad-user-info { flex: 1; min-width: 0; }
        .ad-user-name { font-size: 13.5px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ad-user-mail { font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ad-logout {
          flex: none; width: 34px; height: 34px; display: grid; place-items: center;
          border: none; border-radius: 10px; background: transparent; color: var(--muted); cursor: pointer;
          transition: background .18s, color .18s;
        }
        .ad-logout:hover { background: #fff; color: var(--red); }

        /* ---------- main ---------- */
        .ad-main { min-width: 0; padding: 28px 36px 48px; }
        .ad-top { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }
        .ad-burger {
          display: none; width: 40px; height: 40px; place-items: center;
          border: 1px solid var(--line); border-radius: 12px; background: #fff; color: var(--ink); cursor: pointer;
        }
        .ad-heading { flex: 1; min-width: 0; }
        .ad-h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.03em; }
        .ad-h1-sub { margin: 4px 0 0; font-size: 14px; color: var(--muted); }
        .ad-date {
          padding: 9px 14px; border-radius: 999px; background: #fff; border: 1px solid var(--line);
          font-size: 13px; font-weight: 600; color: var(--ink-2); white-space: nowrap;
        }

        .ad-panel {
          background: #fff; border: 1px solid var(--line); border-radius: 20px;
          box-shadow: 0 1px 2px rgba(28,25,23,.03);
        }
        .ad-panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 20px 22px 0; }
        .ad-panel-title { margin: 0; font-size: 16px; font-weight: 700; letter-spacing: -0.01em; }
        .ad-panel-note { font-size: 13px; color: var(--muted); }

        /* ---------- overview ---------- */
        .ad-hero {
          display: grid; grid-template-columns: 1.35fr 1fr 1fr; gap: 16px; margin-bottom: 16px;
        }
        .ad-feature {
          position: relative; overflow: hidden; padding: 24px; border-radius: 20px; color: #fff;
          background: linear-gradient(135deg, #fb923c 0%, #ea580c 70%, #c2410c 100%);
          box-shadow: 0 22px 40px -22px rgba(234,88,12,.7);
        }
        .ad-feature::after {
          content: ""; position: absolute; right: -50px; bottom: -70px; width: 200px; height: 200px;
          border-radius: 50%; background: rgba(255,255,255,.12);
        }
        .ad-feature-label { font-size: 13.5px; font-weight: 600; opacity: .92; }
        .ad-feature-num { margin: 10px 0 6px; font-size: 48px; font-weight: 800; letter-spacing: -0.04em; line-height: 1; }
        .ad-feature-foot { position: relative; z-index: 1; font-size: 13px; opacity: .92; }

        .ad-stat { padding: 22px; }
        .ad-stat-label { font-size: 13.5px; font-weight: 600; color: var(--muted); }
        .ad-stat-num { margin: 10px 0 6px; font-size: 34px; font-weight: 800; letter-spacing: -0.03em; line-height: 1; }
        .ad-stat-foot { font-size: 13px; color: var(--muted); }
        .ad-up { color: var(--green); font-weight: 700; }
        .ad-down { color: var(--red); font-weight: 700; }

        .ad-grid-2 { display: grid; grid-template-columns: 1.5fr 1fr; gap: 16px; }

        .ad-chart { display: flex; align-items: flex-end; gap: 14px; height: 210px; padding: 22px 22px 18px; }
        .ad-bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 10px; height: 100%; }
        .ad-bar-val { font-size: 12px; font-weight: 600; color: var(--muted); }
        .ad-bar {
          width: 100%; max-width: 44px; border-radius: 10px 10px 4px 4px;
          background: var(--o-200); transition: background .2s;
        }
        .ad-bar.peak { background: linear-gradient(180deg, var(--o-400), var(--o-600)); }
        .ad-bar-col:hover .ad-bar { background: var(--o-400); }
        .ad-bar-day { font-size: 12.5px; font-weight: 600; color: var(--ink-2); }

        .ad-risk { padding: 18px 22px 22px; }
        .ad-risk-bar { display: flex; height: 12px; border-radius: 999px; overflow: hidden; margin-bottom: 18px; background: var(--o-50); }
        .ad-risk-row { display: flex; align-items: center; gap: 10px; padding: 9px 0; font-size: 14px; }
        .ad-risk-row + .ad-risk-row { border-top: 1px solid var(--line); }
        .ad-dot { flex: none; width: 10px; height: 10px; border-radius: 50%; }
        .ad-risk-name { flex: 1; font-weight: 500; }
        .ad-risk-count { font-weight: 700; }

        .ad-feed { padding: 8px 22px 12px; }

        /* ---------- tables / pills ---------- */
        .ad-tools { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 18px 22px; }
        .ad-search { position: relative; flex: 1; min-width: 220px; max-width: 340px; }
        .ad-search svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--muted); }
        .ad-search input {
          width: 100%; padding: 11px 14px 11px 40px; border-radius: 12px;
          border: 1.5px solid var(--line); background: #fff; font-family: inherit; font-size: 14px; color: var(--ink);
          outline: none; transition: border-color .2s, box-shadow .2s;
        }
        .ad-search input:focus { border-color: var(--o-500); box-shadow: 0 0 0 4px rgba(249,115,22,.12); }
        .ad-chips { display: flex; gap: 6px; flex-wrap: wrap; }
        .ad-chip {
          padding: 8px 14px; border-radius: 999px; border: 1px solid var(--line); background: #fff;
          font-size: 13px; font-weight: 600; color: var(--ink-2); cursor: pointer; transition: all .18s;
        }
        .ad-chip:hover { border-color: var(--o-200); color: var(--o-700); }
        .ad-chip.on { background: var(--o-500); border-color: var(--o-500); color: #fff; }

        .ad-table-wrap { overflow-x: auto; }
        .ad-table { width: 100%; border-collapse: collapse; min-width: 720px; }
        .ad-table th {
          padding: 12px 22px; text-align: left; font-size: 12.5px; font-weight: 600; color: var(--muted);
          background: var(--o-50); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line);
        }
        .ad-table td { padding: 14px 22px; font-size: 14px; border-bottom: 1px solid var(--line); vertical-align: middle; }
        .ad-table tbody tr { transition: background .15s; }
        .ad-table tbody tr:hover { background: #fffbf7; }
        .ad-table tbody tr:last-child td { border-bottom: none; }
        .ad-person { display: flex; align-items: center; gap: 12px; }
        .ad-person .ad-avatar { width: 36px; height: 36px; border-radius: 50%; font-size: 12px; }
        .ad-person-name { font-weight: 600; }
        .ad-person-meta { font-size: 12.5px; color: var(--muted); }
        .ad-empty { padding: 40px 22px; text-align: center; font-size: 14px; color: var(--muted); }

        .ad-pill {
          display: inline-flex; align-items: center; gap: 6px; padding: 4px 11px; border-radius: 999px;
          font-size: 12.5px; font-weight: 600; white-space: nowrap;
        }
        .ad-pill::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
        .ad-pill.ok { color: var(--green); background: var(--green-bg); }
        .ad-pill.alert { color: var(--red); background: var(--red-bg); }
        .ad-pill.info { color: var(--blue); background: var(--blue-bg); }
        .ad-pill.warn { color: var(--amber); background: var(--amber-bg); }

        /* ---------- questions ---------- */
        .ad-q-list { display: flex; flex-direction: column; gap: 12px; }
        .ad-q { overflow: hidden; }
        .ad-q-btn {
          width: 100%; display: flex; align-items: center; gap: 16px; padding: 18px 22px;
          border: none; background: transparent; text-align: left; cursor: pointer; color: inherit;
        }
        .ad-q-cat {
          flex: none; padding: 5px 12px; border-radius: 999px; background: var(--o-100); color: var(--o-700);
          font-size: 12.5px; font-weight: 600;
        }
        .ad-q-text { flex: 1; font-size: 15px; font-weight: 600; line-height: 1.45; }
        .ad-q-count { flex: none; font-size: 13px; color: var(--muted); }
        .ad-q-chev { flex: none; color: var(--muted); transition: transform .25s; }
        .ad-q.open .ad-q-chev { transform: rotate(180deg); color: var(--o-600); }
        .ad-q-body { padding: 4px 22px 22px; border-top: 1px solid var(--line); }
        .ad-ans { display: grid; grid-template-columns: 190px 1fr 44px; align-items: center; gap: 14px; padding: 10px 0; font-size: 14px; }
        .ad-ans-track { height: 10px; border-radius: 999px; background: var(--o-50); overflow: hidden; }
        .ad-ans-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--o-400), var(--o-600)); }
        .ad-ans-pct { text-align: right; font-weight: 700; }
        .ad-q-note { margin: 8px 0 0; font-size: 13px; color: var(--muted); }

        /* ---------- reports ---------- */
        .ad-reports { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .ad-report { display: flex; align-items: center; gap: 16px; padding: 20px; }
        .ad-file {
          flex: none; width: 48px; height: 56px; display: grid; place-items: center; border-radius: 10px;
          background: var(--o-100); color: var(--o-700); font-size: 11.5px; font-weight: 800; letter-spacing: .02em;
        }
        .ad-report-info { flex: 1; min-width: 0; }
        .ad-report-name { font-size: 15px; font-weight: 700; }
        .ad-report-meta { margin-top: 4px; font-size: 13px; color: var(--muted); }
        .ad-btn {
          flex: none; display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 12px;
          border: 1.5px solid var(--o-200); background: #fff; color: var(--o-700);
          font-size: 13.5px; font-weight: 700; cursor: pointer; transition: all .18s;
        }
        .ad-btn:hover:not(:disabled) { background: var(--o-500); border-color: var(--o-500); color: #fff; }
        .ad-btn:disabled { opacity: .5; cursor: not-allowed; }

        /* ---------- timeline ---------- */
        .ad-tl { list-style: none; margin: 0; padding: 0; }
        .ad-tl li { position: relative; display: flex; gap: 16px; padding: 14px 0; }
        .ad-tl li:not(:last-child)::after {
          content: ""; position: absolute; left: 15px; top: 46px; bottom: -14px; width: 2px; background: var(--line);
        }
        .ad-tl-dot { flex: none; width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; z-index: 1; }
        .ad-tl-dot::after { content: ""; width: 10px; height: 10px; border-radius: 50%; background: currentColor; }
        .ad-tl-dot.ok { color: var(--green); background: var(--green-bg); }
        .ad-tl-dot.alert { color: var(--red); background: var(--red-bg); }
        .ad-tl-dot.info { color: var(--blue); background: var(--blue-bg); }
        .ad-tl-text { font-size: 14.5px; line-height: 1.5; }
        .ad-tl-text strong { font-weight: 700; }
        .ad-tl-when { margin-top: 2px; font-size: 12.5px; color: var(--muted); }

        /* ---------- mobile ---------- */
        .ad-scrim { display: none; }

        @media (max-width: 1100px) {
          .ad-hero { grid-template-columns: 1fr 1fr; }
          .ad-feature { grid-column: 1 / -1; }
          .ad-grid-2 { grid-template-columns: 1fr; }
        }
        @media (max-width: 900px) {
          .ad-shell { grid-template-columns: 1fr; }
          .ad-side {
            position: fixed; z-index: 50; left: 0; top: 0; width: 272px;
            transform: translateX(-100%); transition: transform .28s ease; box-shadow: none;
          }
          .ad-side.open { transform: none; box-shadow: 0 0 60px rgba(28,25,23,.25); }
          .ad-scrim.show { display: block; position: fixed; inset: 0; z-index: 40; background: rgba(28,25,23,.35); }
          .ad-burger { display: grid; }
          .ad-main { padding: 20px 16px 40px; }
          .ad-reports { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .ad-date { display: none; }
          .ad-h1 { font-size: 22px; }
          .ad-hero { grid-template-columns: 1fr; }
          .ad-q-btn { flex-wrap: wrap; gap: 10px; }
          .ad-q-text { flex-basis: 100%; order: 3; }
          .ad-q-count { margin-left: auto; }
          .ad-ans { grid-template-columns: 1fr 44px; }
          .ad-ans-track { grid-column: 1 / -1; grid-row: 2; }
          .ad-report { flex-wrap: wrap; }
          .ad-chart { gap: 8px; padding: 18px 14px 14px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ad-shell * { transition: none !important; }
        }
      `}</style>

      <div className={`ad-scrim ${navOpen ? "show" : ""}`} onClick={() => setNavOpen(false)} />

      <aside className={`ad-side ${navOpen ? "open" : ""}`}>
        <div className="ad-brand">
          <Image src="/Athmalogo.webp" alt="Athma" width={160} height={48} priority style={{ width: "auto", height: 40 }} />
        </div>

        <nav className="ad-nav" aria-label="Admin navigation">
          <div className="ad-nav-label">Menu</div>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`ad-link ${current.href === item.href ? "active" : ""}`}
              aria-current={current.href === item.href ? "page" : undefined}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ad-user">
          <div className="ad-avatar">{initials(adminName) || "A"}</div>
          <div className="ad-user-info">
            <div className="ad-user-name">{adminName}</div>
            {adminEmail && <div className="ad-user-mail">{adminEmail}</div>}
          </div>
          <button type="button" className="ad-logout" onClick={handleLogout} aria-label="Sign out" title="Sign out">
            {LogoutIcon}
          </button>
        </div>
      </aside>

      <main className="ad-main">
        <header className="ad-top">
          <button type="button" className="ad-burger" onClick={() => setNavOpen(true)} aria-label="Open menu">
            {MenuIcon}
          </button>
          <div className="ad-heading">
            <h1 className="ad-h1">{current.title}</h1>
            <p className="ad-h1-sub">{current.sub}</p>
          </div>
          <div className="ad-date">
            {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}