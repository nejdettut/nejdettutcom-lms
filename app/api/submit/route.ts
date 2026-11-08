import "server-only";
import { generateObject } from "ai";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const SubmitSchema = z.object({
  assignmentId: z.string().uuid(),
  studentName: z.string().min(2).max(120),
  studentEmail: z.string().email().optional(),
  content: z.string().min(20).max(10000),
});

const GradeSchema = z.object({
  score: z.number().int().min(0).max(100),
  feedback: z.string(),
  strengths: z.array(z.string()).min(1).max(5),
  improvements: z.array(z.string()).min(1).max(5),
});

export async function POST(req: Request) {
  const limited = await rateLimit({
    action: "lms-submit",
    windowMs: 60 * 60 * 1000,
    max: 30,
  });
  if (!limited.ok) {
    return json({ error: "Saatte en fazla 30 teslim yapabilirsin." }, 429);
  }

  let body;
  try {
    body = SubmitSchema.parse(await req.json());
  } catch {
    return json({ error: "Geçersiz istek gövdesi." }, 400);
  }

  const sb = supabaseAdmin();
  const { data: assignment, error: aErr } = await sb
    .from("assignments")
    .select("id, title, prompt, rubric")
    .eq("id", body.assignmentId)
    .single();
  if (aErr || !assignment) {
    return json({ error: "Ödev bulunamadı." }, 404);
  }

  // Grade with Groq
  try {
    const { object: grade } = await generateObject({
      model: groq("openai/gpt-oss-120b"),
      schema: GradeSchema,
      system: [
        "Sen deneyimli bir öğretmen değerlendirme asistanısın.",
        "Verilen ödev isteği + rubrik + öğrenci cevabını okuyup 0-100 arası bir puan ver.",
        "Feedback 2-4 cümlelik yapıcı bir değerlendirme olsun; Türkçe, öğrenci diline uygun.",
        "Güçlü yönleri 1-5 madde, geliştirilecek alanları 1-5 madde yaz.",
        "Puan dağılımı: 0-39 yetersiz, 40-59 geliştirilmeli, 60-74 iyi, 75-89 çok iyi, 90-100 mükemmel.",
        "Ödev konusu dışında kalıyorsa düşük puan ver ve feedback'te belirt.",
      ].join(" "),
      prompt: `Ödev: ${assignment.title}\n\nİstek: ${assignment.prompt}\n\nRubrik: ${assignment.rubric}\n\nÖğrenci cevabı:\n\n${body.content}`,
      temperature: 0.3,
    });

    const { data: submission, error: subErr } = await sb
      .from("submissions")
      .insert({
        assignment_id: body.assignmentId,
        student_name: body.studentName,
        student_email: body.studentEmail,
        content: body.content,
        ai_score: grade.score,
        ai_feedback: grade.feedback,
        ai_strengths: grade.strengths.join("\n"),
        ai_improvements: grade.improvements.join("\n"),
      })
      .select("id")
      .single();

    if (subErr) {
      console.error("[submit] insert failed:", subErr);
      return json({ error: "Teslim kaydedilemedi." }, 500);
    }

    return json({
      id: submission.id,
      score: grade.score,
      feedback: grade.feedback,
      strengths: grade.strengths,
      improvements: grade.improvements,
    });
  } catch (err) {
    console.error("[submit] grade failed:", err);
    return json({ error: "Puanlama başarısız." }, 502);
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
