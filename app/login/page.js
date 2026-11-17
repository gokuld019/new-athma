"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.crazystory.in/api";
const EMAIL_RE = /^\S+@\S+\.\S+$/;

const ICONS = {
  mail: (<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>),
  lock: (<><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>),
  eye: (<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>),
  eyeOff: (<><path d="M3 3l18 18" /><path d="M10.6 6.1A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.7C3.9 8.5 2 12 2 12s3.5 7 10 7c1.6 0 3-.4 4.3-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>),
  arrow: (<><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>),
  shield: (<><path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3z" /><path d="m9 12 2 2 4-4" /></>),
};

function Icon({ name, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

async function api(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong. Try again.");
  return data;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setMsg({ type: "error", text: "Enter a valid email address" });
      return;
    }
    if (!password) {
      setMsg({ type: "error", text: "Enter your password" });
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      const data = await api("/patient/login", { email, password });

      localStorage.setItem("athma_token", data.token);
      localStorage.setItem("athma_role", data.user?.role || "patient");
      localStorage.setItem("athma_user", JSON.stringify(data.user || { email }));

      router.push("/questions");
    } catch (err) {
      setMsg({ type: "error", text: err.message });
      setLoading(false);
    }
  };

  return (
    <main className="lg">
      <style>{`
        .lg {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          background: linear-gradient(160deg, #e3ebf7 0%, #f7f9fc 60%, #fdf1ea 100%);
        }
        .lg .auth-card {
          width: 100%;
          max-width: 1040px;
          display: grid;
          grid-template-columns: 360px minmax(0, 1fr);
          background: #fff;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 30px 80px rgba(30, 58, 109, 0.16), 0 2px 6px rgba(30, 58, 109, 0.06);
        }

        /* left panel */
        .lg .auth-side {
          position: relative;
          overflow: hidden;
          background: var(--navy);
          color: #fff;
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 32px;
        }
        .lg .auth-side::before,
        .lg .auth-side::after {
          content: "";
          position: absolute;
          border-radius: 50%;
        }
        .lg .auth-side::before {
          width: 380px;
          height: 380px;
          right: -190px;
          top: -150px;
          background: var(--navy-2);
        }
        .lg .auth-side::after {
          width: 280px;
          height: 280px;
          left: -110px;
          bottom: -110px;
          background: var(--orange);
          opacity: 0.16;
        }
        .lg .auth-side > * {
          position: relative;
          z-index: 1;
        }
        .lg .auth-logo {
          align-self: flex-start;
          background: #fff;
          border-radius: 14px;
          padding: 10px 14px;
        }
        .lg .auth-logo img {
          display: block;
          height: 44px;
          width: auto;
        }
        .lg .auth-side h2 {
          font-size: 28px;
          font-weight: 600;
          line-height: 1.25;
          margin-bottom: 10px;
        }
        .lg .auth-side p {
          color: #c7d4ea;
          font-size: 14px;
          line-height: 1.6;
        }
        .lg .auth-note {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 14px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.09);
          border: 1px solid rgba(255, 255, 255, 0.16);
        }
        .lg .auth-note .badge {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--orange);
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }
        .lg .auth-note strong {
          display: block;
          font-size: 13px;
          font-weight: 600;
        }
        .lg .auth-note span {
          display: block;
          margin-top: 2px;
          font-size: 12px;
          color: #c7d4ea;
          line-height: 1.5;
        }

        /* right panel */
        .lg .auth-main {
          padding: 36px 44px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
        }
        .lg .auth-top {
          text-align: right;
          font-size: 13px;
          color: var(--muted);
          margin-bottom: 24px;
        }
        .lg .auth-top a {
          color: var(--orange);
          font-weight: 600;
          text-decoration: none;
        }
        .lg .auth-top a:hover {
          text-decoration: underline;
        }
        .lg h1 {
          font-size: 30px;
          font-weight: 600;
          color: var(--navy);
          margin-bottom: 6px;
        }
        .lg .lead {
          font-size: 14px;
          color: var(--muted);
          margin-bottom: 26px;
        }

        /* form */
        .lg .grid {
          display: grid;
          gap: 16px;
        }
        .lg .field label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #334155;
          margin-bottom: 6px;
        }
        .lg .field input {
          width: 100%;
          height: 48px;
          padding: 0 14px;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: var(--field);
          color: var(--ink);
          font-size: 14px;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .lg .field input::placeholder {
          color: #94a3b8;
        }
        .lg .field input:focus {
          outline: none;
          background: #fff;
          border-color: var(--orange);
          box-shadow: 0 0 0 4px var(--orange-tint);
        }
        .lg .field input:-webkit-autofill,
        .lg .field input:-webkit-autofill:focus {
          -webkit-text-fill-color: var(--ink);
          -webkit-box-shadow: 0 0 0 1000px var(--field) inset;
          transition: background-color 9999s;
        }
        .lg .input-wrap {
          position: relative;
        }
        .lg .input-wrap .icon-left {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
          display: flex;
        }
        .lg .field .input-wrap input {
          padding-left: 44px;
        }
        .lg .field .input-wrap.pw input {
          padding-right: 48px;
        }
        .lg .eye {
          position: absolute;
          right: 6px;
          top: 50%;
          transform: translateY(-50%);
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 8px;
          background: none;
          color: #94a3b8;
          cursor: pointer;
          display: grid;
          place-items: center;
        }
        .lg .eye:hover {
          color: var(--navy);
          background: #eef2f7;
        }

        /* buttons */
        .lg .btn {
          width: 100%;
          height: 52px;
          margin-top: 24px;
          border: none;
          border-radius: 12px;
          background: var(--orange);
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 8px 20px rgba(232, 87, 31, 0.28);
          transition: background 0.15s, transform 0.1s;
        }
        .lg .btn:hover {
          background: var(--orange-dark);
        }
        .lg .btn:active {
          transform: scale(0.99);
        }
        .lg .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .lg .btn-ghost {
          height: 48px;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          background: #fff;
          color: var(--navy);
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .lg .btn-ghost:hover {
          background: #f1f5f9;
        }
        .lg .or {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 18px 0;
          font-size: 12px;
          color: #94a3b8;
        }
        .lg .or::before,
        .lg .or::after {
          content: "";
          flex: 1;
          height: 1px;
          background: var(--line);
        }

        .lg .alert {
          padding: 12px 14px;
          margin-bottom: 16px;
          border-radius: 12px;
          font-size: 13px;
        }
        .lg .alert.error {
          background: #fef2f2;
          color: #b91c1c;
        }
        .lg .alert.ok {
          background: #ecfdf5;
          color: #047857;
        }

        /* mobile */
        @media (max-width: 860px) {
          .lg .auth-card {
            grid-template-columns: 1fr;
            border-radius: 22px;
          }
          .lg .auth-side {
            padding: 24px;
            gap: 16px;
          }
          .lg .auth-side h2 {
            font-size: 22px;
          }
          .lg .auth-note {
            display: none;
          }
          .lg .auth-main {
            padding: 28px 20px;
          }
        }
      `}</style>

      <div className="auth-card">
        <aside className="auth-side">
          <div className="auth-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Athmalogo.webp" alt="Athma Mind Care Hospital" />
          </div>
          <div>
            <h2>Good to see you again</h2>
            <p>Pick up right where you left off, at your own pace.</p>
          </div>
          <div className="auth-note">
            <div className="badge"><Icon name="shield" /></div>
            <div>
              <strong>Private and confidential</strong>
              <span>Your details are only used for your care.</span>
            </div>
          </div>
        </aside>

        <section className="auth-main">
          <div className="auth-top">
            New here? <Link href="/register">Create account</Link>
          </div>

          <h1>Welcome back</h1>
          <p className="lead">Log in with your registered email and password.</p>

          {msg && <div className={"alert " + msg.type}>{msg.text}</div>}

          <form onSubmit={submit} noValidate>
            <div className="grid">
              <div className="field">
                <label htmlFor="email">Email</label>
                <div className="input-wrap">
                  <span className="icon-left"><Icon name="mail" /></span>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setMsg(null);
                    }}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="password">Password</label>
                <div className="input-wrap pw">
                  <span className="icon-left"><Icon name="lock" /></span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setMsg(null);
                    }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="eye"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <Icon name={showPassword ? "eyeOff" : "eye"} />
                  </button>
                </div>
              </div>
            </div>

            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Please wait…" : <>Log in <Icon name="arrow" size={18} /></>}
            </button>
          </form>

          <div className="or">or</div>
          <Link href="/register" className="btn-ghost">Create a new account</Link>
        </section>
      </div>
    </main>
  );
}