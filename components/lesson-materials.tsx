"use client";

import { useState } from "react";
import { Download, Paperclip, Loader2 } from "lucide-react";

type Material = {
  id: string;
  name: string;
  mime: string;
  size_bytes: number;
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

export function LessonMaterials({ materials }: { materials: Material[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleDownload(id: string) {
    setLoadingId(id);
    try {
      const r = await fetch(`/api/materials/${id}/url`);
      const data = await r.json();
      if (r.ok && data.url) {
        window.open(data.url, "_blank", "noopener");
      }
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="mb-3 rounded-lg border border-brand-sky/30 bg-brand-sky/5 p-3">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-sky">
        <Paperclip className="size-3.5" />
        Ders Dosyaları ({materials.length})
      </p>
      <ul className="divide-y divide-brand-sky/10">
        {materials.map((m) => (
          <li key={m.id} className="flex items-center gap-2 py-1.5 text-xs">
            <span aria-hidden="true">{mimeIcon(m.mime)}</span>
            <span className="min-w-0 flex-1 truncate font-medium text-slate-900 dark:text-slate-100">
              {m.name}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {formatBytes(m.size_bytes)}
            </span>
            <button
              type="button"
              onClick={() => handleDownload(m.id)}
              disabled={loadingId === m.id}
              className="inline-flex items-center gap-1 rounded-md bg-brand-sky px-2 py-1 text-[11px] font-semibold text-white hover:bg-brand-sky/90 disabled:opacity-60"
            >
              {loadingId === m.id ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Download className="size-3" />
              )}
              İndir
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
