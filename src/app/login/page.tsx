"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, AlertCircle, LoaderCircle, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { safeLoginDestination, type AuthUser } from "@/lib/auth-types";
import { useAuth } from "@/components/layout/AuthProvider";
import "./login.css";

type Field = "email" | "password";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [ready, setReady] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [loginError, setLoginError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { user, setAuthenticatedUser } = useAuth();
  const router = useRouter();
  const busyRef = useRef(false);
  useEffect(() => { if (user) router.replace(safeLoginDestination(new URLSearchParams(window.location.search).get("next"), user)); }, [user, router]);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setReady(true); }, []);

  const validate = (field: Field, value: string): string => {
    if (field === "password") return value ? "" : "Masukkan kata sandi akun Anda.";
    if (!value.trim()) return "Masukkan email akun Anda.";
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? "" : "Format email belum benar. Periksa kembali alamat email Anda.";
  };
  const validateField = (field: Field, value: string) => setErrors(previous => ({ ...previous, [field]: validate(field, value) }));
  const changeField = (field: Field, value: string) => {
    if (field === "email") setEmail(value); else setPassword(value);
    setLoginError(null);
    if (errors[field]) validateField(field, value);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busyRef.current) return;
    const nextErrors = { email: validate("email", email), password: validate("password", password) };
    setErrors(nextErrors);
    if (nextErrors.email) { emailRef.current?.focus(); return; }
    if (nextErrors.password) { passwordRef.current?.focus(); return; }
    busyRef.current = true;
    setSubmitting(true); setLoginError(null);
    try {
      const response = await apiFetch<{ user: AuthUser; homePath: string }>("/auth/login", { method: "POST", body: JSON.stringify({ email: email.trim(), password }) });
      if (!response.success || !response.data) throw new Error(response.error?.detail || "Belum berhasil masuk. Silakan coba lagi.");
      setPassword("");
      setAuthenticatedUser(response.data.user);
      router.replace(safeLoginDestination(new URLSearchParams(window.location.search).get("next"), response.data.user));
      router.refresh();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Server belum dapat dihubungi. Silakan coba lagi.");
      requestAnimationFrame(() => noticeRef.current?.focus());
    } finally { busyRef.current = false; setSubmitting(false); }

  };

  return <main className="login-page">
    <div className="login-layout">
      <aside className="login-brand-panel" aria-label="SIJAGO">
        <Link href="/" className="login-logo" aria-label="SIJAGO, beranda"><Image src="/images/logo_header.svg" alt="SIJAGO, Sistem Jalan Bogor" width={380} height={132} priority /></Link>
        <div className="login-brand-content">
          <Image src="/images/sijago_pose_menyapa.svg" alt="" width={462} height={445} className="login-mascot" />
          <p>Ruang kerja admin dan instansi untuk meninjau laporan dan memantau tindak lanjut perbaikan jalan.</p>
        </div>
        <Link href="/" className="login-back"><ArrowLeft size={17} aria-hidden="true" />Kembali ke peta publik</Link>
      </aside>

      <section className="login-form-panel" aria-labelledby="login-heading">
        <div className="login-form-content">
          <div className="login-heading"><LockKeyhole size={24} aria-hidden="true" /><h1 id="login-heading">Masuk ke SIJAGO</h1><p>Gunakan akun admin atau instansi Anda.</p></div>
          {loginError && <div ref={noticeRef} className="login-notice login-error" tabIndex={-1} role="alert"><AlertCircle size={18} aria-hidden="true" /><p>{loginError}</p></div>}
          <form onSubmit={submit} noValidate method="post">
            <fieldset disabled={!ready || submitting}>
              <legend className="login-sr-only">Informasi akun</legend>
              <div className="login-field">
                <label htmlFor="login-email">Email akun <span>Wajib</span></label>
                <input ref={emailRef} id="login-email" name="email" type="email" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required value={email} onChange={event => changeField("email", event.target.value)} onBlur={() => validateField("email", email)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "login-email-error" : undefined} />
                {errors.email && <p id="login-email-error" className="login-field-error">{errors.email}</p>}
              </div>
              <div className="login-field">
                <label htmlFor="login-password">Kata sandi <span>Wajib</span></label>
                <div className="login-password-field">
                  <input ref={passwordRef} id="login-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={event => changeField("password", event.target.value)} onBlur={() => validateField("password", password)} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? "login-password-error" : undefined} />
                  <button type="button" className="login-password-toggle" onClick={() => setShowPassword(previous => !previous)} aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} aria-pressed={showPassword} aria-controls="login-password">{showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}</button>
                </div>
                {errors.password && <p id="login-password-error" className="login-field-error">{errors.password}</p>}
              </div>
              <button className="login-submit" type="submit" aria-busy={submitting}>{submitting && <LoaderCircle size={18} className="login-spinner" aria-hidden="true" />}{submitting ? "Memeriksa akun…" : "Masuk"}</button>
            </fieldset>
          </form>
          <noscript><p className="login-account-help">Aktifkan JavaScript untuk menggunakan formulir masuk.</p></noscript>
          <p className="login-account-help">Akun dikelola oleh pengelola SIJAGO. Warga dapat melapor dan melacak laporan tanpa login.</p>
          <Link href="/lapor" className="login-public-link">Lapor jalan rusak tanpa akun</Link>
        </div>
        <footer className="login-footer">© 2026 SIJAGO. Sistem Jalan Bogor.</footer>
      </section>
    </div>
  </main>;
}
