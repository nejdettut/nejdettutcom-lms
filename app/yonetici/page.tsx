import { redirect } from "next/navigation";
import { getInstructorUser } from "@/lib/admin";
import { InstructorPanel } from "@/components/instructor-panel";
import { SignOutButton } from "./sign-out-button";

export const dynamic = "force-dynamic";

export default async function InstructorPage() {
  const user = await getInstructorUser();
  if (!user) {
    // Giriş yok veya whitelist dışı
    const sessionExists = Boolean(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (user as any)?.id,
    );
    redirect(sessionExists ? "/giris?reason=not-instructor" : "/giris");
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
      <header className="mb-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-sky">
            Eğitmen Paneli
          </p>
          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
            <span className="hidden sm:inline">
              {user!.email}
            </span>
            <SignOutButton />
          </div>
        </div>
        <h1 className="mt-2 flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
          📚 Yeni Kurs Oluştur
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Kurs + modül + ders + ödev yapısını bir seferde gönder. Ders metni
          eklendiğinde yapay zekâ otomatik özet üretir.
        </p>
      </header>

      <InstructorPanel sessionAuthenticated={true} />
    </main>
  );
}
