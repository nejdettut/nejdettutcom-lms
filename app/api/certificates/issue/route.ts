// Sertifika üret — eğitmen panelinden tetiklenir.
// Giriş: assignment_id + student_name (+ opsiyonel student_email).
// Dönüş: { verificationCode, pdfUrl, verifyUrl }
import "server-only";
import { supabaseAdmin, assertInstructor } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function randomCode(): string {
  // 10-char base32-ish code, URL-safe.
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
    if (i === 4) out += "-";
  }
  return out;
}

type Body = {
  course_id?: string;
  student_name?: string;
  student_email?: string;
  completed_at?: string;
};

export async function POST(req: Request) {
  if (!assertInstructor(req)) {
    return json({ error: "Eğitmen kimliği doğrulanamadı." }, 401);
  }
  const limited = await rateLimit({
    action: "certificate-issue",
    windowMs: 60 * 60 * 1000,
    max: 60,
  });
  if (!limited.ok) {
    return json({ error: "Saatte en fazla 60 sertifika üretilebilir." }, 429);
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const courseId = body.course_id?.trim();
  const studentName = body.student_name?.trim();
  if (!courseId || !studentName) {
    return json(
      { error: "course_id ve student_name zorunlu." },
      400,
    );
  }
  if (studentName.length > 120) {
    return json({ error: "student_name 120 karakteri geçemez." }, 400);
  }
  const studentEmail = body.student_email?.trim() || null;
  const completedAt = body.completed_at
    ? new Date(body.completed_at)
    : new Date();
  if (Number.isNaN(completedAt.getTime())) {
    return json({ error: "completed_at geçerli bir tarih olmalı." }, 400);
  }

  const sb = supabaseAdmin();

  // Course lookup for snapshot fields
  const { data: course, error: courseErr } = await sb
    .from("courses")
    .select("id, title, instructor_name")
    .eq("id", courseId)
    .maybeSingle();
  if (courseErr) {
    console.error("[cert/issue] course lookup failed:", courseErr);
    return json({ error: "Kurs sorgusu başarısız." }, 502);
  }
  if (!course) return json({ error: "Kurs bulunamadı." }, 404);

  // Insert with unique code retry (collisions ~0 but handle gracefully)
  let verificationCode = randomCode();
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await sb.from("certificates").insert({
      verification_code: verificationCode,
      student_name: studentName,
      student_email: studentEmail,
      course_id: course.id,
      course_title: course.title,
      instructor_name: course.instructor_name,
      completed_at: completedAt.toISOString(),
    });
    if (!error) break;
    if (error.code === "23505") {
      verificationCode = randomCode();
      continue;
    }
    console.error("[cert/issue] insert failed:", error);
    return json({ error: "Sertifika kaydı yazılamadı." }, 502);
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `https://${process.env.VERCEL_URL ?? "lms.nejdettut.com"}`;
  return json({
    verificationCode,
    pdfUrl: `/api/certificates/pdf/${verificationCode}`,
    verifyUrl: `${baseUrl}/dogrula/${verificationCode}`,
  });
}
