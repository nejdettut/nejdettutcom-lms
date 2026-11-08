import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { SubmitAssignment } from "@/components/submit-assignment";
import { ArrowLeft, BookOpen, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Lesson = {
  id: string;
  title: string;
  content: string;
  ai_summary: string;
  position: number;
  assignments: Assignment[];
};

type Assignment = {
  id: string;
  title: string;
  prompt: string;
  rubric: string;
  due_date: string | null;
};

type Module = {
  id: string;
  title: string;
  position: number;
  lessons: Lesson[];
};

type CourseDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  instructor_name: string;
  modules: Module[];
};

async function fetchCourse(slug: string): Promise<CourseDetail | null> {
  try {
    const sb = supabaseAdmin();
    const { data: course, error: courseErr } = await sb
      .from("courses")
      .select("id, slug, title, description, instructor_name, is_published")
      .eq("slug", slug)
      .single();
    if (courseErr || !course || !course.is_published) return null;

    const { data: modules } = await sb
      .from("modules")
      .select("id, title, position")
      .eq("course_id", course.id)
      .order("position", { ascending: true });

    const result: CourseDetail = {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      instructor_name: course.instructor_name,
      modules: [],
    };

    for (const m of modules ?? []) {
      const { data: lessons } = await sb
        .from("lessons")
        .select("id, title, content, ai_summary, position")
        .eq("module_id", m.id)
        .order("position", { ascending: true });
      const lessonsWithAssignments: Lesson[] = [];
      for (const l of lessons ?? []) {
        const { data: assignments } = await sb
          .from("assignments")
          .select("id, title, prompt, rubric, due_date")
          .eq("lesson_id", l.id);
        lessonsWithAssignments.push({
          id: l.id,
          title: l.title,
          content: l.content,
          ai_summary: l.ai_summary,
          position: l.position,
          assignments: (assignments ?? []) as Assignment[],
        });
      }
      result.modules.push({
        id: m.id,
        title: m.title,
        position: m.position,
        lessons: lessonsWithAssignments,
      });
    }

    return result;
  } catch (err) {
    console.error("[course]", err);
    return null;
  }
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await fetchCourse(slug);
  if (!course) notFound();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs font-medium text-brand-violet hover:underline"
      >
        <ArrowLeft className="size-3.5" />
        Tüm kurslar
      </Link>
      <header className="mt-6 mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-violet">
          Kurs
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
          {course.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {course.description}
        </p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Eğitmen: {course.instructor_name}
        </p>
      </header>

      {course.modules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 px-6 py-14 text-center text-sm text-slate-500 backdrop-blur dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
          Bu kursa henüz modül eklenmedi.
        </div>
      ) : (
        <div className="space-y-6">
          {course.modules.map((m, mi) => (
            <section
              key={m.id}
              className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full bg-brand-violet/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-violet">
                  Modül {mi + 1}
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {m.title}
                </h2>
              </div>

              {m.lessons.length === 0 ? (
                <p className="text-xs italic text-slate-500 dark:text-slate-400">
                  Bu modülde henüz ders yok.
                </p>
              ) : (
                <div className="space-y-5">
                  {m.lessons.map((l, li) => (
                    <article
                      key={l.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <BookOpen className="size-3.5 text-brand-violet" />
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {mi + 1}.{li + 1} {l.title}
                        </h3>
                      </div>

                      {l.ai_summary ? (
                        <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            AI Özet
                          </p>
                          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                            {l.ai_summary}
                          </p>
                        </div>
                      ) : null}

                      {l.content ? (
                        <details className="mb-3">
                          <summary className="cursor-pointer text-xs font-medium text-brand-violet hover:underline">
                            Tam ders metni
                          </summary>
                          <div className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                            {l.content}
                          </div>
                        </details>
                      ) : null}

                      {l.assignments.length > 0 ? (
                        <div className="space-y-3">
                          {l.assignments.map((a) => (
                            <SubmitAssignment key={a.id} assignment={a} />
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      <footer className="mt-20 border-t border-slate-200 pt-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        Bir{" "}
        <a
          href="https://www.nejdettut.com"
          className="font-medium underline-offset-2 hover:underline"
        >
          nejdettut.com
        </a>{" "}
        yapay zekâ projesi
      </footer>
    </main>
  );
}
