// Sertifika doğrulama — public JSON endpoint; sadece whitelist'li alanları
// döner (öğrenci e-postasını dışarı vermez).
import "server-only";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const normalized = code?.trim().toUpperCase();
  if (!normalized) return json({ valid: false, error: "Kod eksik." }, 400);

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("certificates")
    .select(
      "verification_code, student_name, course_title, instructor_name, completed_at, issued_at, revoked_at",
    )
    .eq("verification_code", normalized)
    .maybeSingle();
  if (error) {
    console.error("[cert/verify] lookup failed:", error);
    return json({ valid: false, error: "Sertifika sorgusu başarısız." }, 502);
  }
  if (!data) {
    return json({ valid: false, error: "Sertifika bulunamadı." }, 404);
  }
  if (data.revoked_at) {
    return json({
      valid: false,
      verificationCode: data.verification_code,
      error: "Sertifika iptal edilmiş.",
      revokedAt: data.revoked_at,
    });
  }
  return json({
    valid: true,
    verificationCode: data.verification_code,
    studentName: data.student_name,
    courseTitle: data.course_title,
    instructorName: data.instructor_name,
    completedAt: data.completed_at,
    issuedAt: data.issued_at,
  });
}
