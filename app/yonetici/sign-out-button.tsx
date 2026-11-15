"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && anon) {
      try {
        const supabase = createBrowserClient(url, anon);
        await supabase.auth.signOut();
      } catch {
        /* sessizce yut, yine de redirect edeceğiz */
      }
    }
    window.location.href = "/giris";
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      title="Oturumu kapat"
    >
      <LogOut className="size-3.5" />
      {loading ? "Çıkılıyor…" : "Çıkış"}
    </button>
  );
}
