"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Clock, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type Assignment = {
  id: string;
  title: string;
  prompt: string;
  rubric: string;
  due_date: string | null;
};

type GradeResult = {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
};

export function SubmitAssignment({ assignment }: { assignment: Assignment }) {
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grade, setGrade] = useState<GradeResult | null>(null);

  async function submit() {
    if (studentName.trim().length < 2) {
      setError("Ad soyad yaz.");
      return;
    }
    if (content.trim().length < 20) {
      setError("Cevabın en az 20 karakter olmalı.");
      return;
    }
    setLoading(true);
    setError(null);
    setGrade(null);
    try {
      const r = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: assignment.id,
          studentName,
          studentEmail: studentEmail || undefined,
          content,
        }),
      });
      const data = await r.json();
      if (!r.ok) setError(data.error ?? "Hata.");
      else setGrade(data as GradeResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ağ hatası.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-brand-violet/30 bg-brand-violet/5 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Send className="size-3.5 text-brand-violet" />
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-violet">
          Ödev
        </p>
        {assignment.due_date ? (
          <span className="ml-auto flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <Clock className="size-3" />
            Son teslim: {assignment.due_date}
          </span>
        ) : null}
      </div>
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {assignment.title}
      </p>
      <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
        {assignment.prompt}
      </p>

      {grade ? (
        <div className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-400/5 p-3">
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Teslim edildi · {grade.score}/100
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
            {grade.feedback}
          </p>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Güçlü yönler
              </p>
              <ul className="list-disc space-y-0.5 pl-4 text-[11px] text-slate-700 dark:text-slate-200">
                {grade.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Geliştirilecek
              </p>
              <ul className="list-disc space-y-0.5 pl-4 text-[11px] text-slate-700 dark:text-slate-200">
                {grade.improvements.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="grid gap-2 md:grid-cols-2">
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Ad soyad"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            <input
              type="email"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              placeholder="E-posta (opsiyonel)"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Cevabını buraya yaz (metin, en az 20 karakter)…"
            className="block h-24 w-full resize-y rounded-lg border border-slate-300 bg-white p-2 text-xs leading-relaxed dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          {error ? (
            <div className="flex items-start gap-2 rounded border border-red-400/40 bg-red-400/10 px-2 py-1.5 text-[11px] text-red-900 dark:text-red-200">
              <AlertCircle className="mt-0.5 size-3 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
          <button
            type="button"
            onClick={submit}
            disabled={loading || studentName.length < 2 || content.length < 20}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg bg-brand-violet px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-violet/90 disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {loading ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Puanlanıyor…
              </>
            ) : (
              <>
                <Send className="size-3" />
                Ödevimi gönder
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
