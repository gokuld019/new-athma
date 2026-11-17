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
  confirmPassword: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  location: "",
  referredBy: "",
  education: "",
  occupation: "",
  maritalStatus: "",
  declarations: false,
};

const digits = (max) => (v) => v.replace(/\D/g, "").slice(0, max);

function validate(f) {
  const e = {};
  if (!f.fullName.trim()) e.fullName = "Enter your full name";
  if (f.age && (+f.age < 1 || +f.age > 120)) e.age = "Enter a valid age";
  if (!/^[6-9]\d{9}$/.test(f.phone)) e.phone = "Enter a valid 10-digit mobile number";
  if (!EMAIL_RE.test(f.email)) e.email = "Enter a valid email address";
  if (REQUIRE_PASSWORD) {
    if (f.password.length < 6) e.password = "Use at least 6 characters";
    if (!f.confirmPassword) e.confirmPassword = "Confirm your password";
    else if (f.confirmPassword !== f.password) e.confirmPassword = "Passwords do not match";
  }
  if (!f.address.trim()) e.address = "Enter your full address";
  if (!f.city.trim()) e.city = "Enter your city";
  if (!f.state.trim()) e.state = "Enter your state";
  if (!/^\d{6}$/.test(f.pincode)) e.pincode = "Enter a 6-digit pincode";
  if (!f.location.trim()) e.location = "Enter your district or area";
  if (!f.declarations) e.declarations = "Please accept the declaration to continue";
  return e;
}

function Field({ id, label, required, optional, error, span2, children }) {
  return (
    <div className={"field" + (error ? " err" : "") + (span2 ? " span2" : "")}>
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
  const [showConfirm, setShowConfirm] = useState(false);
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
      const payload = {
        full_name: form.fullName,
        age: form.age,
        gender: form.gender.toLowerCase(),
        phone: form.phone,
        email: form.email,
        full_address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        location: form.location,
        referred_by: form.referredBy,
        education: form.education,
        occupation: form.occupation,
        marital_status: form.maritalStatus,
        declarations: form.declarations,
      };
      if (REQUIRE_PASSWORD) {
        payload.password = form.password;
        payload.password_confirmation = form.confirmPassword;
      }

      const res = await fetch(`${API_URL}/patient/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
          --navy: #1b2f5b;
          --navy-soft: #3b4f7a;
          --orange: #ec5b22;
          --orange-dark: #d44a14;
          --orange-tint: rgba(236, 91, 34, 0.14);
          --ink: #0f172a;
          --muted: #64748b;
          --line: #e2e8f0;
          --field: #f8fafc;

          position: relative;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 36px 16px 28px;
          overflow: hidden;
          font-family: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
          color: var(--ink);
          background: #f6f8fc;
        }
        .rg * { box-sizing: border-box; }

        /* soft ambient glow behind the card */
        .rg::before,
        .rg::after {
          content: "";
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
        }
        .rg::before {
          width: 520px; height: 520px;
          top: -220px; left: -160px;
          background: rgba(59, 99, 190, 0.20);
        }
        .rg::after {
          width: 460px; height: 460px;
          bottom: -200px; right: -140px;
          background: rgba(236, 91, 34, 0.16);
        }
        .rg > * { position: relative; z-index: 1; }

        /* logo */
        .rg .brand {
          margin-bottom: 30px;
          display: flex;
          justify-content: center;
        }
        .rg .brand img {
          display: block;
          height: 64px;
          width: auto;
        }

        /* card */
        .rg .card {
          width: 100%;
          max-width: 1040px;
          padding: 48px 56px 44px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          border-radius: 28px;
          box-shadow:
            0 1px 2px rgba(15, 23, 42, 0.04),
            0 24px 60px -20px rgba(27, 47, 91, 0.22);
        }

        /* step indicator */
        .rg .steps {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 18px;
        }
        .rg .step-label {
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--orange);
          white-space: nowrap;
        }
        .rg .step-bar {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }
        .rg .step-bar span {
          height: 4px;
          border-radius: 99px;
          background: #e8edf5;
        }
        .rg .step-bar span.on {
          background: linear-gradient(90deg, #ff8a4c, var(--orange));
        }

        .rg h1 {
          margin: 0 0 8px;
          font-size: 32px;
          font-weight: 700;
          letter-spacing: -0.025em;
          line-height: 1.15;
          color: var(--navy);
        }
        .rg .lead {
          margin: 0 0 30px;
          font-size: 14.5px;
          color: var(--muted);
        }

        /* form */
        .rg .grid { display: grid; gap: 18px; }
        .rg .g2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .rg .g3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .rg .g4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        .rg .span2 { grid-column: span 2; }
        .rg form > .grid + .grid,
        .rg form > .grid + .divider,
        .rg form > .divider + .grid { margin-top: 18px; }

        .rg .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 26px;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #94a3b8;
        }
        .rg .divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: var(--line);
        }

        .rg .field label {
          display: block;
          margin-bottom: 7px;
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
        }
        .rg .field label em { color: var(--orange); font-style: normal; }
        .rg .field label small { font-size: 12.5px; font-weight: 400; color: #94a3b8; }

        .rg .field input,
        .rg .field select,
        .rg .field textarea {
          width: 100%;
          height: 50px;
          padding: 0 16px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: var(--field);
          color: var(--ink);
          font-family: inherit;
          font-size: 14.5px;
          transition: border-color .18s, box-shadow .18s, background .18s;
        }
        .rg .field input:hover,
        .rg .field select:hover,
        .rg .field textarea:hover { border-color: #cbd5e1; }
        .rg .field select {
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
          background-repeat: no-repeat;
          background-position: right 16px center;
          padding-right: 40px;
        }
        .rg .field textarea {
          height: 92px;
          padding: 14px 16px;
          resize: none;
          line-height: 1.5;
        }
        .rg .field input::placeholder,
        .rg .field textarea::placeholder { color: #a3aec0; }
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
        .rg .field.err textarea { border-color: #ef4444; background: #fffafa; }
        .rg .err-text { margin-top: 5px; font-size: 12px; color: #dc2626; }

        .rg .field input:-webkit-autofill,
        .rg .field input:-webkit-autofill:focus {
          -webkit-text-fill-color: var(--ink);
          -webkit-box-shadow: 0 0 0 1000px var(--field) inset;
          transition: background-color 9999s;
        }

        .rg .input-wrap { position: relative; }
        .rg .input-wrap .icon-left {
          position: absolute;
          left: 15px; top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
          display: flex;
        }
        .rg .field .input-wrap input { padding-left: 44px; }
        .rg .field .input-wrap.pw input { padding-right: 50px; }
        .rg .eye {
          position: absolute;
          right: 7px; top: 50%;
          transform: translateY(-50%);
          width: 36px; height: 36px;
          border: none;
          border-radius: 10px;
          background: none;
          color: #94a3b8;
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: color .15s, background .15s;
        }
        .rg .eye:hover { color: var(--navy); background: #eef2f7; }

        /* declaration */
        .rg .check {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px 18px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: var(--field);
          cursor: pointer;
          font-size: 13px;
          line-height: 1.6;
          color: #334155;
          transition: border-color .18s, background .18s;
        }
        .rg .check:hover { border-color: #cbd5e1; }
        .rg .check input {
          appearance: none;
          -webkit-appearance: none;
          width: 20px; height: 20px;
          flex: none;
          margin: 1px 0 0;
          border: 1.5px solid #cbd5e1;
          border-radius: 6px;
          background: #fff;
          cursor: pointer;
          position: relative;
          transition: background .15s, border-color .15s;
        }
        .rg .check input:checked { background: var(--orange); border-color: var(--orange); }
        .rg .check input:checked::after {
          content: "";
          position: absolute;
          left: 6px; top: 2px;
          width: 5px; height: 10px;
          border: solid #fff;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
        .rg .check input:focus-visible { outline: none; box-shadow: 0 0 0 4px var(--orange-tint); }
        .rg .check.err { border-color: #ef4444; }

        /* submit */
        .rg .actions { margin-top: 28px; display: flex; flex-direction: column; align-items: center; }
        .rg .btn {
          width: 100%;
          max-width: 320px;
          height: 54px;
          border: none;
          border-radius: 14px;
          background: linear-gradient(135deg, #ff7a3c 0%, var(--orange) 55%, var(--orange-dark) 100%);
          color: #fff;
          font-family: inherit;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.01em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 14px 28px -10px rgba(236, 91, 34, 0.55);
          transition: transform .15s, box-shadow .15s, filter .15s;
        }
        .rg .btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 18px 32px -10px rgba(236, 91, 34, 0.6);
          filter: brightness(1.03);
        }
        .rg .btn:active:not(:disabled) { transform: translateY(0) scale(0.99); }
        .rg .btn:focus-visible { outline: none; box-shadow: 0 0 0 4px var(--orange-tint), 0 14px 28px -10px rgba(236,91,34,.55); }
        .rg .btn:disabled { opacity: 0.65; cursor: not-allowed; }
        .rg .btn svg { transition: transform .15s; }
        .rg .btn:hover:not(:disabled) svg { transform: translateX(3px); }

        .rg .alt {
          margin: 18px 0 0;
          text-align: center;
          font-size: 14px;
          color: var(--muted);
        }
        .rg .alt a {
          margin-left: 4px;
          color: var(--orange);
          font-weight: 600;
          text-decoration: none;
        }
        .rg .alt a:hover { text-decoration: underline; }

        .rg .alert {
          padding: 12px 16px;
          margin-bottom: 20px;
          border-radius: 12px;
          font-size: 13.5px;
        }
        .rg .alert.error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        /* footer note */
        .rg .foot {
          margin-top: 22px;
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12.5px;
          color: var(--muted);
          text-align: center;
        }
        .rg .foot svg { color: #16a34a; flex: none; }

        @media (prefers-reduced-motion: reduce) {
          .rg * { transition: none !important; }
        }

        /* tablet */
        @media (max-width: 960px) {
          .rg .card { padding: 36px 32px 34px; }
          .rg .g3,
          .rg .g4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        /* mobile */
        @media (max-width: 720px) {
          .rg { padding: 24px 12px 24px; }
          .rg .brand img { height: 48px; }
          .rg .card { padding: 28px 20px 26px; border-radius: 22px; }
          .rg h1 { font-size: 26px; }
          .rg .g2,
          .rg .g3,
          .rg .g4 { grid-template-columns: 1fr; }
          .rg .span2 { grid-column: auto; }
          .rg .btn { max-width: none; }
        }
      `}</style>

      <div className="brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/Athmalogo.webp" alt="Athma Mind Care Hospital" />
      </div>

      <section className="card">
        <div className="steps">
          <span className="step-label">Step 1 of 4</span>
          <div className="step-bar" aria-hidden="true">
            <span className="on" />
            <span />
            <span />
            <span />
          </div>
        </div>

        <h1>Let&apos;s get you registered</h1>
        <p className="lead">Takes about a minute. Matches you to the right care package.</p>

        {message && <div className="alert error">{message}</div>}

        <form onSubmit={submit} noValidate>
          {/* ---------- Personal & contact ---------- */}
          <div className="grid">
            <div className="grid g3">
              <Field id="fullName" label="Full name" required error={errors.fullName}>
                <input id="fullName" placeholder="Full Name" autoComplete="name" value={form.fullName} onChange={set("fullName")} />
              </Field>
              <Field id="age" label="Age" error={errors.age}>
                <input id="age" inputMode="numeric" placeholder="Age" value={form.age} onChange={set("age", digits(3))} />
              </Field>
              <Field id="gender" label="Gender">
                <select id="gender" value={form.gender} onChange={set("gender")}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
            </div>

            <div className="grid g3">
              <Field id="phone" label="Phone" required error={errors.phone}>
                <input id="phone" inputMode="numeric" placeholder="Phone Number" autoComplete="tel" value={form.phone} onChange={set("phone", digits(10))} />
              </Field>
              <Field id="email" label="Email" required error={errors.email} span2>
                <input id="email" type="email" placeholder="Email" autoComplete="email" value={form.email} onChange={set("email")} />
              </Field>
            </div>

            <Field id="address" label="Full Address" required error={errors.address}>
              <textarea id="address" placeholder="House/Flat No., Street, Area, Landmark" value={form.address} onChange={set("address")} />
            </Field>

            <div className="grid g4">
              <Field id="city" label="City" required error={errors.city}>
                <input id="city" placeholder="City" value={form.city} onChange={set("city")} />
              </Field>
              <Field id="state" label="State" required error={errors.state}>
                <input id="state" placeholder="State" value={form.state} onChange={set("state")} />
              </Field>
              <Field id="pincode" label="Pincode" required error={errors.pincode}>
                <input id="pincode" inputMode="numeric" placeholder="6-digit pincode" value={form.pincode} onChange={set("pincode", digits(6))} />
              </Field>
              <Field id="location" label="Location" required error={errors.location}>
                <input id="location" placeholder="District/Area" value={form.location} onChange={set("location")} />
              </Field>
            </div>
          </div>

          {/* ---------- Additional details ---------- */}
          <div className="divider">About you</div>
          <div className="grid g4">
            <Field id="maritalStatus" label="Marital status">
              <select id="maritalStatus" value={form.maritalStatus} onChange={set("maritalStatus")}>
                <option value="">Select</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                {/* <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option> */}
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field id="education" label="Education">
              <input id="education" placeholder="e.g. B.E, B.Sc, M.A" value={form.education} onChange={set("education")} />
            </Field>
            <Field id="occupation" label="Occupation">
              <input id="occupation" placeholder="e.g. Engineer, Student" value={form.occupation} onChange={set("occupation")} />
            </Field>
            <Field id="referredBy" label="Referred By" optional>
              <input id="referredBy" placeholder="Doctor/Clinic/Person" value={form.referredBy} onChange={set("referredBy")} />
            </Field>
          </div>

          {/* ---------- Security ---------- */}
          {REQUIRE_PASSWORD && (
            <>
              <div className="divider">Account security</div>
              <div className="grid g2">
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

                <Field id="confirmPassword" label="Confirm password" required error={errors.confirmPassword}>
                  <div className="input-wrap pw">
                    <span className="icon-left"><Icon name="lock" /></span>
                    <input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      value={form.confirmPassword}
                      onChange={set("confirmPassword")}
                    />
                    <button
                      type="button"
                      className="eye"
                      onClick={() => setShowConfirm((s) => !s)}
                      aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                    >
                      <Icon name={showConfirm ? "eyeOff" : "eye"} />
                    </button>
                  </div>
                </Field>
              </div>
            </>
          )}

          {/* ---------- Declaration ---------- */}
          <div className="grid" style={{ marginTop: 24 }}>
            <label className={"check" + (errors.declarations ? " err" : "")}>
              <input
                type="checkbox"
                checked={form.declarations}
                onChange={(e) => {
                  setForm((p) => ({ ...p, declarations: e.target.checked }));
                  setErrors((p) => ({ ...p, declarations: undefined }));
                }}
              />
              <span>
                I confirm that the information provided above is true and accurate to the best of my knowledge,
                and I consent to Athma Mind Care Hospital using it for my care.
              </span>
            </label>
            {errors.declarations && <div className="err-text" style={{ marginTop: -10 }}>{errors.declarations}</div>}
          </div>

          <div className="actions">
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Registering…" : <>Register <Icon name="arrow" size={18} /></>}
            </button>
            <p className="alt">
              Already have an account?<Link href="/login">Log in</Link>
            </p>
          </div>
        </form>
      </section>

      <p className="foot">
        <Icon name="shield" size={15} />
        Your details are shared only with your assigned doctor.
      </p>
    </main>
  );
}