import "server-only";
import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";
import { assertInstructor, supabaseAdmin } from "@/lib/supabase";
import { slugify } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const CourseSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(0).max(1500),
  instructorName: z.string().min(2).max(120),
  isPublished: z.boolean().default(true),
  modules: z
    .array(
      z.object({
        title: z.string().min(2).max(160),
        lessons: z
          .array(
            z.object({
              title: z.string().min(2).max(160),
              content: z.string().max(10000),
              assignments: z
                .array(
                  z.object({
                    title: z.string().min(2).max(160),
                    prompt: z.string().min(2).max(2000),
                    rubric: z.string().max(800).optional(),
                    dueDate: z.string().optional(),
                  }),
                )
                .max(5)
                .optional(),
            }),
          )
          .max(20),
      }),
    )
    .max(15),
});

async function aiSummary(content: string): Promise<string> {
  if (!content || content.trim().length < 80) return "";
  try {
    const { text } = await generateText({
      model: groq("openai/gpt-oss-120b"),
      system:
        "Sen deneyimli bir eğitim tasarımcısısın. Verilen ders metnini 3-5 cümlede özetle. Türkçe, sade, öğrencinin hızlı tekrar yapabileceği netlikte. Hedef: öğrenme kazanımlarını vurgulamak.",
      prompt: content,
      temperature: 0.3,
    });
    return text.trim();
  } catch (err) {
    console.error("[ai-summary] failed:", err);
    return "";
  }
}

export async function POST(req: Request) {
  if (!assertInstructor(req)) {
    return json({ error: "Yetkisiz: x-instructor-secret header eksik veya hatalı." }, 401);
  }

  const limited = await rateLimit({
    action: "lms-course-create",
    windowMs: 60 * 60 * 1000,
    max: 20,
  });
  if (!limited.ok) {
    return json({ error: "Saatte en fazla 20 kurs oluşturabilirsin." }, 429);
  }

  let body;
  try {
    body = CourseSchema.parse(await req.json());
  } catch {
    return json({ error: "Geçersiz istek gövdesi." }, 400);
  }

  const sb = supabaseAdmin();
  const baseSlug = slugify(body.title) || "kurs";
  let slug = baseSlug;
  for (let i = 2; i < 20; i++) {
    const { data: dup } = await sb
      .from("courses")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!dup) break;
    slug = `${baseSlug}-${i}`;
  }

  const { data: course, error: courseErr } = await sb
    .from("courses")
    .insert({
      slug,
      title: body.title,
      description: body.description,
      instructor_name: body.instructorName,
      is_published: body.isPublished,
    })
    .select("id, slug")
    .single();

  if (courseErr || !course) {
    console.error("[course] insert failed:", courseErr);
    return json({ error: "Kurs oluşturulamadı." }, 500);
  }

  for (let mi = 0; mi < body.modules.length; mi++) {
    const m = body.modules[mi];
    const { data: mod, error: modErr } = await sb
      .from("modules")
      .insert({ course_id: course.id, title: m.title, position: mi })
      .select("id")
      .single();
    if (modErr || !mod) continue;

    for (let li = 0; li < m.lessons.length; li++) {
      const l = m.lessons[li];
      const summary = await aiSummary(l.content);
      const { data: lesson } = await sb
        .from("lessons")
        .insert({
          module_id: mod.id,
          title: l.title,
          content: l.content,
          ai_summary: summary,
          position: li,
        })
        .select("id")
        .single();
      if (!lesson) continue;

      for (const a of l.assignments ?? []) {
        await sb.from("assignments").insert({
          lesson_id: lesson.id,
          title: a.title,
          prompt: a.prompt,
          rubric: a.rubric ?? "İçerik doğruluğu, netlik, kapsam, özgünlük",
          due_date: a.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(a.dueDate) ? a.dueDate : null,
        });
      }
    }
  }

  return json({ ok: true, slug: course.slug, id: course.id });
}

export async function GET() {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("courses")
    .select("id, slug, title, instructor_name, is_published, created_at")
    .order("created_at", { ascending: false });
  return json({ courses: data ?? [] });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
