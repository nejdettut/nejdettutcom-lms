// Sertifika PDF — Storage persist desteği (Aşama 3).
// Akış: cert lookup → pdf_path varsa signed URL'e 302 redirect;
// yoksa lazy backfill: üret + Storage'a yükle + pdf_path kaydet +
// inline PDF dön (aynı request'te kullanıcı beklemesin).
import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import {
  generateAndStoreCertificate,
  signedCertificateUrl,
} from "@/lib/certificate-storage";

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
      "verification_code, student_name, course_title, instructor_name, completed_at, revoked_at, pdf_path",
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

  const slug = data.student_name
    .toLocaleLowerCase("tr")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "sertifika";
  const fileName = `sertifika-${slug}-${data.verification_code}.pdf`;

  // Fast path: Storage'da var → signed URL redirect (~50 ms)
  if (data.pdf_path) {
    const url = await signedCertificateUrl(sb, data.pdf_path, fileName);
    if (url) {
      return new Response(null, {
        status: 302,
        headers: { location: url },
      });
    }
    // İmzalama başarısızsa fall-through: regenerate et
  }

  // Lazy backfill — eski sertifika veya Storage boş: üret + yükle + inline
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `https://${process.env.VERCEL_URL ?? "lms.nejdettut.com"}`;

  const { bytes } = await generateAndStoreCertificate(sb, {
    verificationCode: data.verification_code,
    studentName: data.student_name,
    courseTitle: data.course_title,
    instructorName: data.instructor_name,
    completedAt: new Date(data.completed_at),
    verifyUrl: `${baseUrl}/dogrula/${data.verification_code}`,
  });

  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${fileName}"`,
      "cache-control": "no-store",
    },
  });
}
