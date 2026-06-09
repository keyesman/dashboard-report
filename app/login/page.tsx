// =============================================================================
// app/login/page.tsx
// Halaman Login — entry point sebelum masuk dashboard
//
// Features:
// - Form email + password
// - Validasi client-side
// - Error message dari server (wrong email/password)
// - Loading state saat submit
// - Redirect ke dashboard setelah login sukses
// - BudgetZen design system
// - Dark mode support
// =============================================================================

"use client"; // Client component karena pakai form state & signIn

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  // ===========================================================================
  // FORM STATE
  // ===========================================================================
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [showPass,    setShowPass]    = useState(false); // Toggle show/hide password
  const [isLoading,   setIsLoading]   = useState(false);
  const [errorMsg,    setErrorMsg]    = useState("");

  // ===========================================================================
  // HANDLE SUBMIT — Kirim credentials ke NextAuth
  // ===========================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validasi sederhana sebelum kirim ke server
    if (!email || !password) {
      setErrorMsg("Email dan password wajib diisi.");
      return;
    }

    setIsLoading(true);

    try {
      // Kirim ke NextAuth credentials provider
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false, // Handle redirect manual supaya bisa catch error
      });

      if (result?.error) {
        // Login gagal — tampilkan pesan error
        setErrorMsg("Email atau password salah.");
        showToast.error("Login gagal", "Periksa kembali email dan password kamu.");
      } else {
        // Login sukses — redirect ke dashboard
        showToast.success("Login berhasil!", "Selamat datang kembali.");
        router.push("/dashboard");
        router.refresh(); // Refresh untuk update session
      }
    } catch {
      setErrorMsg("Terjadi kesalahan. Coba lagi.");
      showToast.error("Login gagal", "Terjadi kesalahan server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)] px-4">
      {/* =====================================================================
          LOGIN CARD — Centered card container
          ===================================================================== */}
      <div className="w-full max-w-md">
        {/* ==================================================================
            HEADER — Logo + Title
            ================================================================== */}
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4 shadow-medium">
            <span className="text-white font-headline font-bold text-2xl">C</span>
          </div>

          {/* Title */}
          <h1 className="font-headline text-2xl font-bold text-[var(--text-primary)]">
            Chatwoot Dashboard
          </h1>
          <p className="font-body text-sm text-[var(--text-secondary)] mt-1">
            Masuk untuk melanjutkan
          </p>
        </div>

        {/* ==================================================================
            FORM CARD
            ================================================================== */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-8 shadow-medium">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Email Input */}
            <Input
              label="Email"
              type="email"
              placeholder="admin@dashboard.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              autoComplete="email"
              autoFocus
            />

            {/* Password Input — dengan toggle show/hide */}
            <Input
              label="Password"
              type={showPass ? "text" : "password"}
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors pointer-events-auto"
                  tabIndex={-1}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            {/* Error Message — tampil kalau ada error */}
            {errorMsg && (
              <div className="bg-error/10 border border-error/20 rounded-md px-4 py-3">
                <p className="font-body text-sm text-error font-medium">
                  {errorMsg}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading}
              className="w-full mt-1"
            >
              {isLoading ? (
                // Loading spinner
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Masuk...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Masuk
                </>
              )}
            </Button>
          </form>
        </div>

        {/* ==================================================================
            FOOTER — Default credentials info (development only)
            ================================================================== */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 bg-info/10 border border-info/20 rounded-md px-4 py-3 text-center">
            <p className="font-body text-xs text-info">
              💡 Default: <span className="font-mono font-semibold">admin@dashboard.com</span> / <span className="font-mono font-semibold">Admin123!</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
