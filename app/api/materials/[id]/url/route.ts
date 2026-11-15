// Material indir — kısa ömürlü signed URL (public kurs sayfası için).
import "server-only";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const BUCKET = "lms-materials";
const EXPIRE_SEC = 300; // 5 dakika

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) return json({ error: "id gerekli." }, 400);

  const supabase = supabaseAdmin();
  const { data: row } = await supabase
    .from("materials")
    .select("path, name, mime")
    .eq("id", id)
    .maybeSingle();
  if (!row) return json({ error: "Bulunamadı." }, 404);

  const { data: signed, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(row.path, EXPIRE_SEC, { download: row.name });
  if (error || !signed?.signedUrl) {
    console.error("[lms/materials] sign failed:", error);
    return json({ error: "URL imzalanamadı." }, 502);
  }
  return json({ url: signed.signedUrl, name: row.name, mime: row.mime });
}
