import "server-only";
import { createClient } from "@supabase/supabase-js";

export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase env eksik: NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false },
    db: { schema: "lms" },
  });
}

export function assertInstructor(req: Request): boolean {
  const secret = process.env.LMS_INSTRUCTOR_SECRET;
  if (!secret) return false;
  const header = req.headers.get("x-instructor-secret");
  return header === secret;
}
