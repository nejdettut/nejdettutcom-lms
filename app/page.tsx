import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { BookOpen, ChevronRight, GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Course = {
  id: string;
  slug: string;
  title: string;
  description: string;
  instructor_name: string;
  created_at: string;
};

async function fetchCourses(): Promise<Course[]> {
  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("courses")
      .select("id, slug, title, description, instructor_name, created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[courses] fetch failed:", error);
      return [];
    }
    return (data ?? []) as Course[];
  } catch (err) {
    console.error("[courses] supabase error:", err);
    return [];
  }
}

export default async function HomePage() {
  const courses = await fetchCourses();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
      <header className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-violet">
            Yapay Zekâ Projesi · MVP
          </p>
          <h1 className="mt-2 flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
            <span aria-hidden="true" className="text-3xl">
              📚
            </span>
            AI Destekli LMS
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
            Küçük ölçekli öğrenim yönetim sistemi: kurslar, modüller, dersler,
            yapay zekâ ile otomatik ders özeti ve öğrenci ödevlerine anında
            puan + geri bildirim.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/yonetici"
            className="rounded-full border border-brand-violet/40 bg-brand-violet/10 px-4 py-2 text-xs font-medium text-brand-violet transition hover:bg-brand-violet/20"
          >
            Eğitmen Panel
          </Link>
          <a
            href="https://www.nejdettut.com/projeler/ai-destekli-lms"
            className="rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-xs font-medium text-slate-700 shadow-sm backdrop-blur transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100"
          >
            ← nejdettut.com
          </a>
        </div>
      </header>

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
          <GraduationCap className="size-4 text-brand-violet" />
          Yayınlanan Kurslar
        </h2>

        {courses.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/50 px-6 py-14 text-center backdrop-blur dark:border-slate-700 dark:bg-slate-900/40">
            <BookOpen className="size-10 text-brand-violet" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Henüz yayınlanmış kurs yok
            </h3>
            <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
              Eğitmen Panel&apos;den kurs + modül + ders ekleyip yayınlayın.
              Bu MVP&apos;de kurslar herkese açık, ödevler anonim teslim
              edilebilir.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {courses.map((c) => (
              <Link
                key={c.id}
                href={`/kurs/${c.slug}`}
                className="group rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur transition hover:border-brand-violet/60 hover:shadow dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-brand-violet"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {c.title}
                  </h3>
                  <ChevronRight className="mt-1 size-4 shrink-0 text-slate-400 transition group-hover:text-brand-violet" />
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                  {c.description}
                </p>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  Eğitmen: {c.instructor_name}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="mt-20 border-t border-slate-200 pt-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        Bir{" "}
        <a
          href="https://www.nejdettut.com"
          className="font-medium underline-offset-2 hover:underline"
        >
          nejdettut.com
        </a>{" "}
        yapay zekâ projesi · Supabase + Groq · Next.js
      </footer>
    </main>
  );
}
