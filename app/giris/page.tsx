import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase-server";
import { isInstructorEmail } from "@/lib/admin";
import { SignInForm } from "./sign-in-form";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ next?: string; reason?: string }>;
};

export default async function GirisPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const user = await getSessionUser();

  // Zaten login + eğitmen → paneline gönder
  if (user && isInstructorEmail(user.email)) {
    redirect(params.next || "/yonetici");
  }

  const reason = params.reason;
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-10">
      <header className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-sky">
          Eğitmen Girişi
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          🔐 Panele Giriş
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Google hesabınla giriş yap. Eğitmen listesinde olan e-postalar
          otomatik kabul edilir.
        </p>
      </header>

      {reason === "not-instructor" ? (
        <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
          Bu Google hesabı eğitmen listesinde değil. Eğer eğitmen olman
          gerekiyorsa site yöneticisine e-posta adresini ilet.
          {user ? (
            <span className="mt-2 block font-mono text-xs opacity-80">
              Mevcut oturum: {user.email}
            </span>
          ) : null}
        </div>
      ) : null}

      <SignInForm nextPath={params.next || "/yonetici"} />

      <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
        <a href="/" className="underline hover:text-slate-800 dark:hover:text-slate-200">
          ← Ana sayfa
        </a>
      </p>
    </main>
  );
}
