import { InstructorPanel } from "@/components/instructor-panel";

export const dynamic = "force-dynamic";

export default function InstructorPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-violet">
          Eğitmen Paneli
        </p>
        <h1 className="mt-2 flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
          📚 Yeni Kurs Oluştur
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Kurs + modül + ders + ödev yapısını bir seferde gönder. Ders metni
          eklendiğinde yapay zekâ otomatik özet üretir.
        </p>
      </header>

      <InstructorPanel />
    </main>
  );
}
