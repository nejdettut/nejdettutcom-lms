// LMS material upload — eğitmen dersin altına ek dosya yükler.
// multipart/form-data: lessonId (string) + file (File).
// 50 MB sınırı, service_role ile Storage'a koyar + lms.materials'a kayıt atar.
import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { assertInstructorDual } from "@/lib/admin";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "lms-materials";
const MAX_BYTES = 50 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
  "text/plain",
  "text/markdown",
  "application/zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
]);

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function safeFilename(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 120) || "dosya";
}

export async function POST(req: Request) {
  if (!(await assertInstructorDual(req))) {
    return json({ error: "Yetkisiz." }, 401);
  }
  const limited = await rateLimit({
    action: "lms-material-upload",
    windowMs: 60 * 60 * 1000,
    max: 50,
  });
  if (!limited.ok) {
    return json({ error: "Saatte en fazla 50 dosya yüklenebilir." }, 429);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ error: "Geçersiz form." }, 400);
  }

  const lessonId = String(form.get("lessonId") || "");
  const file = form.get("file");
  if (!lessonId || !(file instanceof File)) {
    return json({ error: "lessonId ve file zorunlu." }, 400);
  }
  if (file.size > MAX_BYTES) {
    return json({ error: "Dosya 50 MB'dan büyük olamaz." }, 413);
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return json(
      { error: `Desteklenmeyen tür: ${file.type || "bilinmeyen"}` },
      415,
    );
  }

  const supabase = supabaseAdmin();

  // Lesson var mı doğrula (yabancı key constraint patlamadan önce)
  const { data: lesson, error: lessonErr } = await supabase
    .from("lessons")
    .select("id")
    .eq("id", lessonId)
    .maybeSingle();
  if (lessonErr || !lesson) {
    return json({ error: "Ders bulunamadı." }, 404);
  }

  const cleanName = safeFilename(file.name);
  const path = `${lessonId}/${crypto.randomUUID()}_${cleanName}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });
  if (upErr) {
    console.error("[lms/materials] storage upload failed:", upErr);
    return json(
      { error: "Dosya yüklenemedi. Bucket var mı?", detail: upErr.message },
      502,
    );
  }

  const { data: inserted, error: insErr } = await supabase
    .from("materials")
    .insert({
      lesson_id: lessonId,
      name: file.name,
      path,
      mime: file.type,
      size_bytes: file.size,
    })
    .select()
    .single();
  if (insErr) {
    // Storage'daki dosyayı geri al (best-effort)
    await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
    console.error("[lms/materials] insert failed:", insErr);
    return json({ error: "Metadata kaydedilemedi.", detail: insErr.message }, 502);
  }

  return json({ material: inserted });
}

export async function DELETE(req: Request) {
  if (!(await assertInstructorDual(req))) {
    return json({ error: "Yetkisiz." }, 401);
  }
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return json({ error: "id gerekli." }, 400);

  const supabase = supabaseAdmin();
  const { data: row, error: selErr } = await supabase
    .from("materials")
    .select("path")
    .eq("id", id)
    .maybeSingle();
  if (selErr || !row) return json({ error: "Bulunamadı." }, 404);

  await supabase.storage.from(BUCKET).remove([row.path]).catch(() => {});
  const { error: delErr } = await supabase.from("materials").delete().eq("id", id);
  if (delErr) return json({ error: delErr.message }, 500);
  return json({ ok: true });
}
