// Sertifika PDF — kod geçerli + iptal edilmemişse PDF döner, yoksa 404.
import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { renderCertificatePdf } from "@/lib/certificate-pdf";

export const runtime = "nodejs";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const normalized = code?.trim().toUpperCase();
  if (!normalized) return json({ error: "Kod eksik." }, 400);

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("certificates")
    .select(
      "verification_code, student_name, course_title, instructor_name, completed_at, revoked_at",
    )
    .eq("verification_code", normalized)
    .maybeSingle();
  if (error) {
    console.error("[cert/pdf] lookup failed:", error);
    return json({ error: "Sertifika sorgusu başarısız." }, 502);
  }
  if (!data || data.revoked_at) {
    return json({ error: "Sertifika bulunamadı." }, 404);
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `https://${process.env.VERCEL_URL ?? "lms.nejdettut.com"}`;

  const bytes = await renderCertificatePdf({
    verificationCode: data.verification_code,
    studentName: data.student_name,
    courseTitle: data.course_title,
    instructorName: data.instructor_name,
    completedAt: new Date(data.completed_at),
    verifyUrl: `${baseUrl}/dogrula/${data.verification_code}`,
  });

  const slug = data.student_name
    .toLocaleLowerCase("tr")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "sertifika";

  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="sertifika-${slug}-${data.verification_code}.pdf"`,
      "cache-control": "no-store",
    },
  });
}
