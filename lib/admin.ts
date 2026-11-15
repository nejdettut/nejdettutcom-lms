import "server-only";
import type { User } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/supabase-server";

// Varsayılan whitelist; env LMS_INSTRUCTOR_EMAILS ile genişletilebilir.
const DEFAULT_INSTRUCTORS = ["nejdettut@gmail.com"] as const;

export function instructorEmails(): string[] {
  const fromEnv = process.env.LMS_INSTRUCTOR_EMAILS;
  const base = DEFAULT_INSTRUCTORS.map((e) => e.toLowerCase());
  if (!fromEnv) return base;
  const extra = fromEnv
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set([...base, ...extra]));
}

export function isInstructorEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return instructorEmails().includes(email.toLowerCase());
}

/** Server component'lerde eğitmen girişi şart; aksi hâlde null. */
export async function getInstructorUser(): Promise<User | null> {
  const user = await getSessionUser();
  if (!user || !isInstructorEmail(user.email)) return null;
  return user;
}

/**
 * API route'larda kullanılan dual-auth:
 * - Supabase session cookie (Google OAuth sonrası) → email whitelist'de mi?
 * - Veya `x-instructor-secret` header → `LMS_INSTRUCTOR_SECRET` env ile eşleşti mi?
 *
 * Herhangi biri geçerliyse true. Backwards compat: var olan panel/CLI
 * kullanımları secret ile çalışmaya devam eder.
 */
export async function assertInstructorDual(req: Request): Promise<boolean> {
  // 1) Header-based secret (geri uyum)
  const secret = process.env.LMS_INSTRUCTOR_SECRET;
  if (secret) {
    const header = req.headers.get("x-instructor-secret");
    if (header && header === secret) return true;
  }
  // 2) Supabase session cookie
  const user = await getSessionUser().catch(() => null);
  if (user && isInstructorEmail(user.email)) return true;
  return false;
}
