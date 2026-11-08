"use client";

import { useState } from "react";
import { AlertCircle, BookPlus, Loader2, Minus, Plus, Save } from "lucide-react";
import { cn } from "@/lib/utils";

type Assignment = {
  title: string;
  prompt: string;
  rubric?: string;
  dueDate?: string;
};

type Lesson = {
  title: string;
  content: string;
  assignments?: Assignment[];
};

type Module = {
  title: string;
  lessons: Lesson[];
};

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-navy/90 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-violet dark:text-white";

const BTN_OUTLINE =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm backdrop-blur transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-900";

const CARD =
  "rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60";

const MUTED_TEXT = "text-slate-500 dark:text-slate-400";

export function InstructorPanel() {
  const [instructorSecret, setInstructorSecret] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructorName, setInstructorName] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [modules, setModules] = useState<Module[]>([
    {
      title: "",
      lessons: [{ title: "", content: "", assignments: [] }],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ slug: string } | null>(null);

  function updateModule(i: number, patch: Partial<Module>) {
    const next = [...modules];
    next[i] = { ...next[i], ...patch };
    setModules(next);
  }
  function addModule() {
    setModules([...modules, { title: "", lessons: [{ title: "", content: "", assignments: [] }] }]);
  }
  function removeModule(i: number) {
    setModules(modules.filter((_, idx) => idx !== i));
  }

  function updateLesson(mi: number, li: number, patch: Partial<Lesson>) {
    const next = [...modules];
    const lessons = [...next[mi].lessons];
    lessons[li] = { ...lessons[li], ...patch };
    next[mi] = { ...next[mi], lessons };
    setModules(next);
  }
  function addLesson(mi: number) {
    const next = [...modules];
    next[mi] = {
      ...next[mi],
      lessons: [...next[mi].lessons, { title: "", content: "", assignments: [] }],
    };
    setModules(next);
  }
  function removeLesson(mi: number, li: number) {
    const next = [...modules];
    next[mi] = {
      ...next[mi],
      lessons: next[mi].lessons.filter((_, idx) => idx !== li),
    };
    setModules(next);
  }

  function addAssignment(mi: number, li: number) {
    const next = [...modules];
    const lessons = [...next[mi].lessons];
    const assignments = [...(lessons[li].assignments ?? []), { title: "", prompt: "" }];
    lessons[li] = { ...lessons[li], assignments };
    next[mi] = { ...next[mi], lessons };
    setModules(next);
  }
  function updateAssignment(
    mi: number,
    li: number,
    ai: number,
    patch: Partial<Assignment>,
  ) {
    const next = [...modules];
    const lessons = [...next[mi].lessons];
    const assignments = [...(lessons[li].assignments ?? [])];
    assignments[ai] = { ...assignments[ai], ...patch };
    lessons[li] = { ...lessons[li], assignments };
    next[mi] = { ...next[mi], lessons };
    setModules(next);
  }
  function removeAssignment(mi: number, li: number, ai: number) {
    const next = [...modules];
    const lessons = [...next[mi].lessons];
    const assignments = (lessons[li].assignments ?? []).filter((_, idx) => idx !== ai);
    lessons[li] = { ...lessons[li], assignments };
    next[mi] = { ...next[mi], lessons };
    setModules(next);
  }

  async function save() {
    if (title.trim().length < 2) {
      setError("Kurs adı boş.");
      return;
    }
    if (instructorName.trim().length < 2) {
      setError("Eğitmen adı boş.");
      return;
    }
    if (!instructorSecret) {
      setError("Eğitmen anahtarı gerekli.");
      return;
    }
    const cleanModules = modules.filter((m) => m.title.trim());
    if (cleanModules.length === 0) {
      setError("En az 1 modül ekle.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-instructor-secret": instructorSecret,
        },
        body: JSON.stringify({
          title,
          description,
          instructorName,
          isPublished,
          modules: cleanModules.map((m) => ({
            title: m.title,
            lessons: m.lessons
              .filter((l) => l.title.trim())
              .map((l) => ({
                title: l.title,
                content: l.content,
                assignments: (l.assignments ?? []).filter((a) => a.title.trim() && a.prompt.trim()),
              })),
          })),
        }),
      });
      const data = await r.json();
      if (!r.ok) setError(data.error ?? "Hata.");
      else setResult({ slug: data.slug });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ağ hatası.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className={cn(CARD, "p-5")}>
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
          Eğitmen Anahtarı
        </h2>
        <input
          type="password"
          value={instructorSecret}
          onChange={(e) => setInstructorSecret(e.target.value)}
          placeholder="LMS_INSTRUCTOR_SECRET"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <p className={cn("mt-1 text-[11px]", MUTED_TEXT)}>
          Vercel env&apos;deki LMS_INSTRUCTOR_SECRET değerini gir.
          Tarayıcıda saklanmaz, sadece bu formu gönderirken header&apos;a eklenir.
        </p>
      </div>

      <div className={cn(CARD, "p-5 space-y-3")}>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Kurs Bilgisi
        </h2>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Kurs adı"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <input
          type="text"
          value={instructorName}
          onChange={(e) => setInstructorName(e.target.value)}
          placeholder="Eğitmen adı"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Kurs açıklaması"
          className="block h-20 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          <span className="text-slate-700 dark:text-slate-200">
            Oluşturur oluşturmaz yayınla
          </span>
        </label>
      </div>

      {modules.map((m, mi) => (
        <div key={mi} className={cn(CARD, "p-5 space-y-3")}>
          <div className="flex items-center gap-2">
            <h3 className="flex-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Modül {mi + 1}
            </h3>
            <button
              type="button"
              onClick={() => removeModule(mi)}
              className={cn(BTN_OUTLINE, "text-rose-600")}
            >
              <Minus className="size-3" />
              Modülü sil
            </button>
          </div>
          <input
            type="text"
            value={m.title}
            onChange={(e) => updateModule(mi, { title: e.target.value })}
            placeholder="Modül adı"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />

          {m.lessons.map((l, li) => (
            <div
              key={li}
              className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-950/40"
            >
              <div className="flex items-center gap-2">
                <p className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Ders {mi + 1}.{li + 1}
                </p>
                <button
                  type="button"
                  onClick={() => removeLesson(mi, li)}
                  className={cn(BTN_OUTLINE, "text-rose-600")}
                >
                  <Minus className="size-3" />
                  Dersi sil
                </button>
              </div>
              <input
                type="text"
                value={l.title}
                onChange={(e) => updateLesson(mi, li, { title: e.target.value })}
                placeholder="Ders adı"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              <textarea
                value={l.content}
                onChange={(e) => updateLesson(mi, li, { content: e.target.value })}
                placeholder="Ders metni (yapay zekâ bundan özet üretir)"
                className="block h-24 w-full resize-y rounded-lg border border-slate-300 bg-white p-2 text-xs leading-relaxed dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />

              {(l.assignments ?? []).map((a, ai) => (
                <div
                  key={ai}
                  className="space-y-1.5 rounded border border-brand-violet/30 bg-brand-violet/5 p-2"
                >
                  <div className="flex items-center gap-2">
                    <p className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-brand-violet">
                      Ödev {ai + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeAssignment(mi, li, ai)}
                      className={cn(BTN_OUTLINE, "text-rose-600")}
                    >
                      <Minus className="size-3" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={a.title}
                    onChange={(e) => updateAssignment(mi, li, ai, { title: e.target.value })}
                    placeholder="Ödev başlığı"
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                  <textarea
                    value={a.prompt}
                    onChange={(e) => updateAssignment(mi, li, ai, { prompt: e.target.value })}
                    placeholder="Ödev isteği / soru"
                    className="block h-16 w-full resize-y rounded border border-slate-300 bg-white p-1.5 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      value={a.rubric ?? ""}
                      onChange={(e) => updateAssignment(mi, li, ai, { rubric: e.target.value })}
                      placeholder="Rubrik (opsiyonel)"
                      className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                    <input
                      type="date"
                      value={a.dueDate ?? ""}
                      onChange={(e) => updateAssignment(mi, li, ai, { dueDate: e.target.value })}
                      className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addAssignment(mi, li)}
                className={BTN_OUTLINE}
              >
                <Plus className="size-3" />
                Ödev ekle
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addLesson(mi)}
            className={BTN_OUTLINE}
          >
            <Plus className="size-3" />
            Ders ekle
          </button>
        </div>
      ))}

      <button type="button" onClick={addModule} className={BTN_OUTLINE}>
        <BookPlus className="size-3" />
        Yeni modül
      </button>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-900 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-200"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {result ? (
        <div className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200">
          Kurs oluşturuldu ✓{" "}
          <a href={`/kurs/${result.slug}`} className="font-semibold underline">
            /kurs/{result.slug}
          </a>
        </div>
      ) : null}

      <button type="button" onClick={save} disabled={loading} className={BTN_PRIMARY}>
        {loading ? (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            Kaydediliyor…
          </>
        ) : (
          <>
            <Save className="size-3.5" />
            Kursu oluştur
          </>
        )}
      </button>
    </div>
  );
}
