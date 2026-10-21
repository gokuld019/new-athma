"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const API_URL = "https://api.crazystory.in/api/admin/login";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // already logged in as admin -> skip the form
  useEffect(() => {
    const token = localStorage.getItem("athma_token");
    const role = localStorage.getItem("athma_role");
    if (token && role === "admin") router.replace("/admin/dashboard");
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || data.success === false) {
        throw new Error(data?.message || "Invalid email or password");
      }

      const token = data.token || data.data?.token;
      if (!token) throw new Error("Login failed. No token received.");

      const admin = data.admin || data.user || data.data?.admin || null;

      localStorage.setItem("athma_token", token);
      localStorage.setItem("athma_role", "admin");
      if (admin) localStorage.setItem("athma_user", JSON.stringify(admin));

      router.replace("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="al-page">
      <style>{`
        .al-page {
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
          display: grid;
          place-items: center;
          padding: 32px 16px;
          font-family: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
          color: var(--ink);
          background:
            radial-gradient(900px 400px at 85% -10%, rgba(249,115,22,.14), transparent 60%),
            radial-gradient(700px 360px at -10% 0%, rgba(251,146,60,.10), transparent 60%),
            #fffdfb;
        }

        .al-card {
          width: 100%; max-width: 420px;
          padding: 40px 36px 32px;
          border-radius: 24px;
          background: #fff; border: 1px solid var(--line);
          box-shadow: 0 24px 48px -24px rgba(234,88,12,.22), 0 1px 2px rgba(28,25,23,.04);
          animation: al-in .5s ease both;
        }
        @keyframes al-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }

        .al-logo { display: flex; justify-content: center; margin-bottom: 22px; }
        .al-badge {
          display: flex; width: fit-content; align-items: center; gap: 8px;
          margin: 0 auto 14px; padding: 6px 14px; border-radius: 999px;
          background: var(--o-100); color: var(--o-700);
          font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase;
        }
        .al-badge::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--o-500); }
        .al-title { margin: 0 0 6px; text-align: center; font-size: 26px; font-weight: 800; letter-spacing: -0.03em; }
        .al-sub { margin: 0 0 28px; text-align: center; font-size: 14.5px; line-height: 1.6; color: var(--muted); }

        .al-field { margin-bottom: 16px; }
        .al-label { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 600; }
        .al-input-wrap { position: relative; }
        .al-input {
          width: 100%; padding: 13px 16px; border-radius: 14px;
          border: 1.5px solid var(--line); background: #fff;
          font-family: inherit; font-size: 15px; color: var(--ink);
          outline: none; transition: border-color .2s, box-shadow .2s;
        }
        .al-input::placeholder { color: #b8aea6; }
        .al-input:focus { border-color: var(--o-500); box-shadow: 0 0 0 4px rgba(249,115,22,.12); }
        .al-input.has-toggle { padding-right: 48px; }

        .al-toggle {
          position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
          width: 34px; height: 34px; display: grid; place-items: center;
          border: none; border-radius: 10px; background: transparent;
          color: var(--muted); cursor: pointer; transition: background .2s, color .2s;
        }
        .al-toggle:hover { background: var(--o-50); color: var(--o-600); }

        .al-error {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 16px; padding: 11px 14px; border-radius: 12px;
          background: #fef2f2; border: 1px solid #fecaca;
          font-size: 13.5px; font-weight: 500; color: #b91c1c;
        }

        .al-submit {
          width: 100%; padding: 14px 24px; margin-top: 4px;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          border: none; border-radius: 14px;
          background: linear-gradient(135deg, #fb923c, #ea580c); color: #fff;
          font-family: inherit; font-size: 15px; font-weight: 700; cursor: pointer;
          box-shadow: 0 14px 28px -10px rgba(234,88,12,.6);
          transition: transform .2s, box-shadow .2s, opacity .2s;
        }
        .al-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 18px 32px -10px rgba(234,88,12,.7); }
        .al-submit:disabled { opacity: .7; cursor: not-allowed; }
        .al-spin {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,.4); border-top-color: #fff;
          animation: al-rotate .7s linear infinite;
        }
        @keyframes al-rotate { to { transform: rotate(360deg); } }

        .al-foot { margin: 24px 0 0; text-align: center; font-size: 12.5px; color: var(--muted); }

        @media (max-width: 480px) {
          .al-card { padding: 32px 22px 26px; border-radius: 20px; }
          .al-title { font-size: 23px; }
        }
      `}</style>

      <form className="al-card" onSubmit={handleSubmit} noValidate>
        <div className="al-logo">
          <Image
            src="/Athmalogo.webp"
            alt="Athma"
            width={160}
            height={48}
            priority
            style={{ width: "auto", height: 44 }}
          />
        </div>

        <span className="al-badge">Admin</span>
        <h1 className="al-title">Welcome back</h1>
        <p className="al-sub">Sign in to manage your counselling platform.</p>

        {error && (
          <div className="al-error" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
            {error}
          </div>
        )}

        <div className="al-field">
          <label className="al-label" htmlFor="al-email">Email</label>
          <input
            id="al-email"
            className="al-input"
            type="email"
            autoComplete="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="al-field">
          <label className="al-label" htmlFor="al-password">Password</label>
          <div className="al-input-wrap">
            <input
              id="al-password"
              className="al-input has-toggle"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="al-toggle"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  <path d="M1 1l22 22" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button type="submit" className="al-submit" disabled={loading}>
          {loading && <span className="al-spin" />}
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="al-foot">Authorized personnel only</p>
      </form>
    </main>
  );
}