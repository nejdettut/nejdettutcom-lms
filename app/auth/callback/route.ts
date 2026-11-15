import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { isInstructorEmail } from "@/lib/admin";

export const dynamic = "force-dynamic";

/**
 * Google OAuth callback. Supabase ?code=<...> ile geri döner; exchange
 * eder, session cookie kurulur, sonra `next` hedefine yönlendirir.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/yonetici";
  const origin = url.origin;

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}/giris?reason=exchange-failed`,
      );
    }
    // Email whitelist dışıysa panele sokma; /giris'e geri gönder
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !isInstructorEmail(user.email)) {
      return NextResponse.redirect(`${origin}/giris?reason=not-instructor`);
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/giris?reason=no-code`);
}
