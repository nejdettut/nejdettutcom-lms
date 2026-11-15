import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * SSR cookie-based Supabase client (anon key). Server components ve
 * API route handler'larda kullanılır. Cookie okur + yazar, Google OAuth
 * oturumunu otomatik tanır.
 *
 * `supabaseAdmin()` (service_role) ile birlikte yaşar:
 * - supabaseAdmin → lms schema'ya yazıcı (service_role, RLS bypass)
 * - supabaseServer → kullanıcı kimliği okuyucu (anon key, session ile)
 */
export async function createSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Supabase env eksik: NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY gerekli.",
    );
  }
  const cookieStore = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server component context'inde set izin verilmeyebilir;
          // sessizce geç — middleware refreshi yapacak.
        }
      },
    },
  });
}

export async function getSessionUser() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
