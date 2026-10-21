"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.crazystory.in/api";
const EMAIL_RE = /^\S+@\S+\.\S+$/;

// Set to false if your register API creates the password itself
const REQUIRE_PASSWORD = true;

const ICONS = {
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

const INITIAL = {
  fullName: "",
  age: "",
  gender: "",
  phone: "",
  email: "",
  password: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  location: "",
  referredBy: "",
};

const digits = (max) => (v) => v.replace(/\D/g, "").slice(0, max);

function validate(f) {
  const e = {};
  if (!f.fullName.trim()) e.fullName = "Enter your full name";
  if (f.age && (+f.age < 1 || +f.age > 120)) e.age = "Enter a valid age";
  if (!/^[6-9]\d{9}$/.test(f.phone)) e.phone = "Enter a valid 10-digit mobile number";
  if (!EMAIL_RE.test(f.email)) e.email = "Enter a valid email address";
  if (REQUIRE_PASSWORD && f.password.length < 6) e.password = "Use at least 6 characters";
  if (!f.address.trim()) e.address = "Enter your full address";
  if (!f.city.trim()) e.city = "Enter your city";
  if (!f.state.trim()) e.state = "Enter your state";
  if (!/^\d{6}$/.test(f.pincode)) e.pincode = "Enter a 6-digit pincode";
  if (!f.location.trim()) e.location = "Enter your district or area";
  return e;
}

function Field({ id, label, required, optional, error, children }) {
  return (
    <div className={"field" + (error ? " err" : "")}>
      <label htmlFor={id}>
        {label}
        {required && <em> *</em>}
        {optional && <small> (optional)</small>}
      </label>
      {children}
      {error && <div className="err-text">{error}</div>}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const set = (key, clean) => (e) => {
    const value = clean ? clean(e.target.value) : e.target.value;
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    setMessage("");
    try {
      const body = { ...form };
      if (!REQUIRE_PASSWORD) delete body.password;

      const res = await fetch(`${API_URL}/patient/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Registration failed. Try again.");

      router.push("/login");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="rg">
      <style>{`
        .rg {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          background: linear-gradient(160deg, #e3ebf7 0%, #f7f9fc 60%, #fdf1ea 100%);
        }
        .rg .auth-card {
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
        .rg .auth-side {
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
        .rg .auth-side::before,
        .rg .auth-side::after {
          content: "";
          position: absolute;
          border-radius: 50%;
        }
        .rg .auth-side::before {
          width: 380px;
          height: 380px;
          right: -190px;
          top: -150px;
          background: var(--navy-2);
        }
        .rg .auth-side::after {
          width: 280px;
          height: 280px;
          left: -110px;
          bottom: -110px;
          background: var(--orange);
          opacity: 0.16;
        }
        .rg .auth-side > * {
          position: relative;
          z-index: 1;
        }
        .rg .auth-logo {
          align-self: flex-start;
          background: #fff;
          border-radius: 14px;
          padding: 10px 14px;
        }
        .rg .auth-logo img {
          display: block;
          height: 44px;
          width: auto;
        }
        .rg .auth-side h2 {
          font-size: 28px;
          font-weight: 600;
          line-height: 1.25;
          margin-bottom: 10px;
        }
        .rg .auth-side p {
          color: #c7d4ea;
          font-size: 14px;
          line-height: 1.6;
        }
        .rg .auth-note {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 14px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.09);
          border: 1px solid rgba(255, 255, 255, 0.16);
        }
        .rg .auth-note .badge {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--orange);
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }
        .rg .auth-note strong {
          display: block;
          font-size: 13px;
          font-weight: 600;
        }
        .rg .auth-note span {
          display: block;
          margin-top: 2px;
          font-size: 12px;
          color: #c7d4ea;
          line-height: 1.5;
        }

        /* right panel */
        .rg .auth-main {
          padding: 36px 44px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
        }
        .rg .progress {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 24px;
        }
        .rg .progress i {
          display: block;
          height: 4px;
          border-radius: 4px;
          background: #e3e8f0;
        }
        .rg .progress span {
          display: block;
          margin-top: 6px;
          font-size: 12px;
          color: #94a3b8;
        }
        .rg .progress .on i {
          background: var(--orange);
        }
        .rg .progress .on span {
          color: var(--navy);
          font-weight: 500;
        }
        .rg .step {
          font-size: 13px;
          font-weight: 600;
          color: var(--orange);
        }
        .rg h1 {
          font-size: 30px;
          font-weight: 600;
          color: var(--navy);
          margin: 4px 0 6px;
        }
        .rg .lead {
          font-size: 14px;
          color: var(--muted);
          margin-bottom: 26px;
        }

        /* form */
        .rg .grid {
          display: grid;
          gap: 16px;
        }
        .rg .g2 {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .rg .g3 {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .rg .field label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #334155;
          margin-bottom: 6px;
        }
        .rg .field label em {
          color: var(--orange);
          font-style: normal;
        }
        .rg .field label small {
          font-size: 13px;
          font-weight: 400;
          color: #94a3b8;
        }
        .rg .field input,
        .rg .field select,
        .rg .field textarea {
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
        .rg .field textarea {
          height: 84px;
          padding: 12px 14px;
          resize: none;
        }
        .rg .field input::placeholder,
        .rg .field textarea::placeholder {
          color: #94a3b8;
        }
        .rg .field input:focus,
        .rg .field select:focus,
        .rg .field textarea:focus {
          outline: none;
          background: #fff;
          border-color: var(--orange);
          box-shadow: 0 0 0 4px var(--orange-tint);
        }
        .rg .field.err input,
        .rg .field.err select,
        .rg .field.err textarea {
          border-color: #dc2626;
        }
        .rg .err-text {
          margin-top: 4px;
          font-size: 12px;
          color: #dc2626;
        }
        .rg .field input:-webkit-autofill,
        .rg .field input:-webkit-autofill:focus {
          -webkit-text-fill-color: var(--ink);
          -webkit-box-shadow: 0 0 0 1000px var(--field) inset;
          transition: background-color 9999s;
        }
        .rg .input-wrap {
          position: relative;
        }
        .rg .input-wrap .icon-left {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
          display: flex;
        }
        .rg .field .input-wrap input {
          padding-left: 44px;
        }
        .rg .field .input-wrap.pw input {
          padding-right: 48px;
        }
        .rg .eye {
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
        .rg .eye:hover {
          color: var(--navy);
          background: #eef2f7;
        }

        /* buttons */
        .rg .btn {
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
        .rg .btn:hover {
          background: var(--orange-dark);
        }
        .rg .btn:active {
          transform: scale(0.99);
        }
        .rg .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .rg .alt {
          margin-top: 18px;
          text-align: center;
          font-size: 14px;
          color: var(--muted);
        }
        .rg .alt a {
          color: var(--orange);
          font-weight: 600;
          text-decoration: none;
        }
        .rg .alt a:hover {
          text-decoration: underline;
        }
        .rg .alert {
          padding: 12px 14px;
          margin-bottom: 16px;
          border-radius: 12px;
          font-size: 13px;
        }
        .rg .alert.error {
          background: #fef2f2;
          color: #b91c1c;
        }

        /* mobile */
        @media (max-width: 860px) {
          .rg .auth-card {
            grid-template-columns: 1fr;
            border-radius: 22px;
          }
          .rg .auth-side {
            padding: 24px;
            gap: 16px;
          }
          .rg .auth-side h2 {
            font-size: 22px;
          }
          .rg .auth-note {
            display: none;
          }
          .rg .auth-main {
            padding: 28px 20px;
          }
          .rg .g2,
          .rg .g3 {
            grid-template-columns: 1fr;
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
            <h2>A calm place to begin</h2>
            <p>Share a few details and we'll guide you to the care that fits you.</p>
          </div>
          <div className="auth-note">
            <div className="badge"><Icon name="shield" /></div>
            <div>
              <strong>Private and confidential</strong>
              <span>Takes about a minute. Your details are only used for your care.</span>
            </div>
          </div>
        </aside>

        <section className="auth-main">
          {/* <div className="progress">
            <div className="on"><i /><span>Register</span></div>
            <div><i /><span>Package</span></div>
            <div><i /><span>Payment</span></div>
            <div><i /><span>Questions</span></div>
          </div>

          <p className="step">Step 1 of 4</p> */}
          <h1>Let's get you registered</h1>
          <p className="lead">Takes about a minute. We'll match you to the right care package.</p>

          {message && <div className="alert error">{message}</div>}

          <form onSubmit={submit} noValidate>
            <div className="grid">
              <div className="grid g2">
                <Field id="fullName" label="Full name" required error={errors.fullName}>
                  <input id="fullName" placeholder="Full name" value={form.fullName} onChange={set("fullName")} />
                </Field>
                <Field id="age" label="Age" error={errors.age}>
                  <input id="age" inputMode="numeric" placeholder="Age" value={form.age} onChange={set("age", digits(3))} />
                </Field>
              </div>

              <div className="grid g2">
                <Field id="gender" label="Gender">
                  <select id="gender" value={form.gender} onChange={set("gender")}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>
                <Field id="phone" label="Phone" required error={errors.phone}>
                  <input id="phone" inputMode="numeric" placeholder="Phone number" value={form.phone} onChange={set("phone", digits(10))} />
                </Field>
              </div>

              <Field id="email" label="Email" required error={errors.email}>
                <input id="email" type="email" placeholder="you@example.com" autoComplete="email" value={form.email} onChange={set("email")} />
              </Field>

              {REQUIRE_PASSWORD && (
                <Field id="password" label="Password" required error={errors.password}>
                  <div className="input-wrap pw">
                    <span className="icon-left"><Icon name="lock" /></span>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      value={form.password}
                      onChange={set("password")}
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
                </Field>
              )}

              <Field id="address" label="Full address" required error={errors.address}>
                <textarea id="address" placeholder="House/Flat no., street, area, landmark" value={form.address} onChange={set("address")} />
              </Field>

              <div className="grid g3">
                <Field id="city" label="City" required error={errors.city}>
                  <input id="city" placeholder="City" value={form.city} onChange={set("city")} />
                </Field>
                <Field id="state" label="State" required error={errors.state}>
                  <input id="state" placeholder="State" value={form.state} onChange={set("state")} />
                </Field>
                <Field id="pincode" label="Pincode" required error={errors.pincode}>
                  <input id="pincode" inputMode="numeric" placeholder="6-digit pincode" value={form.pincode} onChange={set("pincode", digits(6))} />
                </Field>
              </div>

              <div className="grid g2">
                <Field id="location" label="Location" required error={errors.location}>
                  <input id="location" placeholder="District/Area" value={form.location} onChange={set("location")} />
                </Field>
                <Field id="referredBy" label="Referred by" optional>
                  <input id="referredBy" placeholder="Doctor, clinic, or person name" value={form.referredBy} onChange={set("referredBy")} />
                </Field>
              </div>
            </div>

            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Registering…" : <>Register <Icon name="arrow" size={18} /></>}
            </button>
          </form>

          <p className="alt">
            Already have an account? <Link href="/login">Log in</Link>
          </p>
        </section>
      </div>
    </main>
  );
}