// Sertifika PDF'i üret + Storage'a yükle + path'i döndür.
// cert/issue ve cert/pdf (lazy backfill) kullanır.
import "server-only";
import { renderCertificatePdf } from "@/lib/certificate-pdf";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any;

const BUCKET = "lms-certificates";

export type CertRenderInput = {
  verificationCode: string;
  studentName: string;
  courseTitle: string;
  instructorName: string;
  completedAt: Date;
  verifyUrl: string;
};

function pathFor(verificationCode: string): string {
  // Code: "AAAAA-BBBBB". Klasörlere ilk 3 harf göre dağıt (binlerce dosya için).
  const prefix = verificationCode.replace(/-/g, "").slice(0, 3);
  return `${prefix}/${verificationCode}.pdf`;
}

/**
 * PDF'i üret + Storage'a yükle (upsert=true). Sonra `certificates.pdf_path`
 * kolonunu günceller. Başarısız olursa path null döner — caller yine PDF'i
 * inline servis edebilir.
 */
export async function generateAndStoreCertificate(
  sb: AnySupabaseClient,
  input: CertRenderInput,
): Promise<{ path: string | null; bytes: Uint8Array }> {
  const bytes = await renderCertificatePdf(input);
  const path = pathFor(input.verificationCode);
  try {
    const { error } = await sb.storage.from(BUCKET).upload(path, bytes, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (error) {
      console.error("[cert-storage] upload failed:", error);
      return { path: null, bytes };
    }
    await sb
      .from("certificates")
      .update({ pdf_path: path })
      .eq("verification_code", input.verificationCode);
    return { path, bytes };
  } catch (err) {
    console.error("[cert-storage] exception:", err);
    return { path: null, bytes };
  }
}

/** Mevcut path için signed URL (300s). */
export async function signedCertificateUrl(
  sb: AnySupabaseClient,
  path: string,
  fileName: string,
): Promise<string | null> {
  const { data, error } = await sb.storage
    .from(BUCKET)
    .createSignedUrl(path, 300, { download: fileName });
  if (error || !data?.signedUrl) {
    console.error("[cert-storage] sign failed:", error);
    return null;
  }
  return data.signedUrl;
}
