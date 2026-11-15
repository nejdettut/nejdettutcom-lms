"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Props = { nextPath: string };

export function SignInForm({ nextPath }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      setError("Supabase ortam değişkenleri eksik.");
      setLoading(false);
      return;
    }
    const supabase = createBrowserClient(url, anon);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
    }
    // başarılı akış → Google yönlendirmesi (bu component unmount olur)
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
      >
        {/* Google G */}
        <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
          <path
            fill="#FFC107"
            d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.3 6 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
          />
          <path
            fill="#FF3D00"
            d="M6.3 14.7l6.6 4.8C14.7 15.6 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.3 6 29.4 4 24 4 16 4 9.1 8.5 6.3 14.7z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.3 0 10.1-2 13.7-5.3l-6.3-5.2c-2 1.4-4.6 2.5-7.4 2.5-5.2 0-9.6-3.3-11.3-8l-6.5 5C8.6 39.6 15.7 44 24 44z"
          />
          <path
            fill="#1976D2"
            d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.1 4.1-3.9 5.5l6.3 5.2C41.8 36 44 30.5 44 24c0-1.2-.1-2.3-.4-3.5z"
          />
        </svg>
        {loading ? "Google'a yönlendiriliyor…" : "Google ile Giriş Yap"}
      </button>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-900 dark:text-red-200"
        >
          {error}
        </div>
      ) : null}

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        Oturum, tarayıcıda şifresiz tutulur (Supabase cookie). Çıkış için panelin
        sağ üstünde &ldquo;Çıkış&rdquo; butonunu kullan.
      </p>
    </div>
  );
}
