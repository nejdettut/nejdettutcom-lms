import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getInstructorUser } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase";
import { MaterialManager } from "./material-manager";

export const dynamic = "force-dynamic";

type LessonRow = {
  id: string;
  title: string;
  module_title: string;
  position: number;
  module_position: number;
};

type MaterialRow = {
  id: string;
  lesson_id: string;
  name: string;
  mime: string;
  size_bytes: number;
  created_at: string;
};

async function fetchCourseData(slug: string) {
  const sb = supabaseAdmin();
  const { data: course } = await sb
    .from("courses")
    .select("id, slug, title")
    .eq("slug", slug)
    .maybeSingle();
  if (!course) return null;

  const { data: modules } = await sb
    .from("modules")
    .select("id, title, position")
    .eq("course_id", course.id)
    .order("position", { ascending: true });

  const lessons: LessonRow[] = [];
  for (const m of modules ?? []) {
    const { data: lessonRows } = await sb
      .from("lessons")
      .select("id, title, position")
      .eq("module_id", m.id)
      .order("position", { ascending: true });
    for (const l of lessonRows ?? []) {
      lessons.push({
        id: l.id,
        title: l.title,
        module_title: m.title,
        position: l.position,
        module_position: m.position,
      });
    }
  }

  const lessonIds = lessons.map((l) => l.id);
  let materials: MaterialRow[] = [];
  if (lessonIds.length > 0) {
    const { data: matRows } = await sb
      .from("materials")
      .select("id, lesson_id, name, mime, size_bytes, created_at")
      .in("lesson_id", lessonIds)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    materials = (matRows as MaterialRow[]) ?? [];
  }

  return { course, lessons, materials };
}

export default async function MaterialAdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getInstructorUser();
  if (!user) redirect("/giris?next=/yonetici");
  const { slug } = await params;
  const data = await fetchCourseData(slug);
  if (!data) notFound();

  const { course, lessons, materials } = data;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
      <Link
        href="/yonetici"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
      >
        <ArrowLeft className="size-4" />
        Yönetici paneli
      </Link>
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-sky">
          Materyal Yönetimi
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
          📎 {course.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Her dersin altına PDF, görsel, video veya başka dosya ekleyebilirsin.
          Yüklenen dosyalar kurs sayfasında öğrencilere kısa ömürlü imzalı URL
          ile sunulur.
        </p>
      </header>

      <MaterialManager lessons={lessons} initialMaterials={materials} />
    </main>
  );
}
