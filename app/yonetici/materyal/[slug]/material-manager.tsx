"use client";

import { useState } from "react";
import { FileUp, Loader2, Trash2, Download, Paperclip } from "lucide-react";

type Lesson = {
  id: string;
  title: string;
  module_title: string;
  position: number;
  module_position: number;
};

type Material = {
  id: string;
  lesson_id: string;
  name: string;
  mime: string;
  size_bytes: number;
  created_at: string;
};

type Props = {
  lessons: Lesson[];
  initialMaterials: Material[];
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function mimeIcon(mime: string): string {
  if (mime.startsWith("image/")) return "🖼️";
  if (mime.startsWith("video/")) return "🎬";
  if (mime.startsWith("audio/")) return "🎵";
  if (mime === "application/pdf") return "📄";
  if (mime.includes("word")) return "📝";
  if (mime.includes("presentation")) return "📊";
  if (mime.includes("sheet") || mime.includes("excel")) return "📈";
  if (mime === "application/zip") return "🗜️";
  return "📎";
}

export function MaterialManager({ lessons, initialMaterials }: Props) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(lessonId: string, file: File) {
    setError(null);
    setUploadingLessonId(lessonId);
    try {
      const fd = new FormData();
      fd.append("lessonId", lessonId);
      fd.append("file", file);
      const r = await fetch("/api/materials", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error ?? "Yükleme hatası");
        return;
      }
      setMaterials((prev) => [...prev, data.material as Material]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ağ hatası");
    } finally {
      setUploadingLessonId(null);
    }
  }

  async function handleDelete(materialId: string) {
    if (!confirm("Bu dosyayı silmek istiyor musun?")) return;
    setError(null);
    try {
      const r = await fetch(`/api/materials?id=${encodeURIComponent(materialId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        setError(data.error ?? "Silme hatası");
        return;
      }
      setMaterials((prev) => prev.filter((m) => m.id !== materialId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ağ hatası");
    }
  }

  async function handleDownload(materialId: string) {
    const r = await fetch(`/api/materials/${materialId}/url`);
    const data = await r.json();
    if (!r.ok || !data.url) {
      setError(data.error ?? "URL alınamadı");
      return;
    }
    window.open(data.url, "_blank", "noopener");
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-900 dark:text-red-200"
        >
          {error}
        </div>
      ) : null}

      {lessons.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
          Bu kursta henüz ders yok. Önce <code>/yonetici</code>&apos;den kurs oluştur.
        </div>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson) => {
            const lessonMats = materials.filter((m) => m.lesson_id === lesson.id);
            const uploading = uploadingLessonId === lesson.id;
            return (
              <div
                key={lesson.id}
                className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {lesson.module_title}
                    </p>
                    <h3 className="mt-0.5 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                      <Paperclip className="size-4 text-brand-sky" />
                      {lesson.title}
                    </h3>
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand-navy px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-navy/90 dark:bg-brand-sky">
                    {uploading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Yükleniyor…
                      </>
                    ) : (
                      <>
                        <FileUp className="size-4" />
                        Dosya Ekle
                      </>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUpload(lesson.id, f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>

                {lessonMats.length === 0 ? (
                  <p className="text-[13px] text-slate-500 dark:text-slate-400">
                    Henüz ek dosya yok.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                    {lessonMats.map((m) => (
                      <li
                        key={m.id}
                        className="flex items-center gap-3 px-3 py-2 text-sm"
                      >
                        <span aria-hidden="true">{mimeIcon(m.mime)}</span>
                        <span className="min-w-0 flex-1 truncate font-medium text-slate-900 dark:text-slate-100">
                          {m.name}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatBytes(m.size_bytes)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDownload(m.id)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-navy dark:hover:bg-slate-800 dark:hover:text-brand-sky"
                          title="İndir"
                          aria-label="İndir"
                        >
                          <Download className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(m.id)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400"
                          title="Sil"
                          aria-label="Sil"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
