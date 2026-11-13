import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, CheckCircle2, FileDown, GraduationCap } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Row = {
  verification_code: string;
  student_name: string;
  course_title: string;
  instructor_name: string;
  completed_at: string;
  issued_at: string;
  revoked_at: string | null;
};

async function lookup(code: string): Promise<Row | null> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("certificates")
    .select(
      "verification_code, student_name, course_title, instructor_name, completed_at, issued_at, revoked_at",
    )
    .eq("verification_code", code)
    .maybeSingle();
  if (error) {
    console.error("[dogrula] lookup failed:", error);
    return null;
  }
  return (data as Row | null) ?? null;
}

type PageProps = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { code } = await params;
  const normalized = code.trim().toUpperCase();
  return {
    title: `Sertifika doğrulama · ${normalized}`,
    description:
      "nejdettut.com LMS sertifika doğrulama sayfası. Sertifika sahibi, kurs ve geçerlilik durumunu gösterir.",
    robots: { index: false, follow: false },
  };
}

export default async function VerifyPage({ params }: PageProps) {
  const { code } = await params;
  const normalized = code.trim().toUpperCase();
  const row = await lookup(normalized);
  if (!row) notFound();

  const completedAt = new Date(row.completed_at);
  const issuedAt = new Date(row.issued_at);
  const dateFmt = (d: Date) =>
    d.toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const revoked = Boolean(row.revoked_at);

  return (
    <main className="mx-auto max-w-2xl px-6 py-14">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        ← LMS&apos;e dön
      </Link>
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
        <div className="mb-6 flex items-center gap-3">
          {revoked ? (
            <AlertCircle className="size-8 text-rose-600" />
          ) : (
            <CheckCircle2 className="size-8 text-emerald-600" />
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-violet">
              Sertifika Doğrulama
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {revoked ? "Bu sertifika iptal edilmiş" : "Geçerli sertifika"}
            </h1>
          </div>
        </div>

        <dl className="space-y-3 text-sm">
          <Field label="Öğrenci" value={row.student_name} />
          <Field label="Kurs" value={row.course_title} />
          <Field label="Eğitmen" value={row.instructor_name} />
          <Field label="Tamamlanma" value={dateFmt(completedAt)} />
          <Field label="Düzenlenme" value={dateFmt(issuedAt)} />
          <Field label="Doğrulama kodu" value={row.verification_code} mono />
          {revoked ? (
            <Field
              label="İptal tarihi"
              value={dateFmt(new Date(row.revoked_at as string))}
              tone="rose"
            />
          ) : null}
        </dl>

        {!revoked ? (
          <a
            href={`/api/certificates/pdf/${row.verification_code}`}
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-navy/90"
          >
            <FileDown className="size-4" />
            Sertifika PDF&apos;i indir
          </a>
        ) : null}

        <p className="mt-6 inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <GraduationCap className="size-3.5" />
          nejdettut.com LMS · Bu sayfa herkese açıktır.
        </p>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  mono,
  tone = "slate",
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: "slate" | "rose";
}) {
  const toneCls =
    tone === "rose"
      ? "text-rose-700 dark:text-rose-300"
      : "text-slate-900 dark:text-slate-100";
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <dt className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd
        className={`${toneCls} ${mono ? "font-mono text-sm" : "text-sm"} sm:text-right`}
      >
        {value}
      </dd>
    </div>
  );
}
