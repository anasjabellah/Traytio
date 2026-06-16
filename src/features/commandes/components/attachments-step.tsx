"use client"

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Trash2, FileText, FileImage, Eye, X, Maximize2, Download } from "lucide-react";

type PersistedAttachment = { id: string; name: string; url: string; type?: string | null };

function ext(name: string) {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(i + 1).toUpperCase() : "";
}

function isImg(a: File | PersistedAttachment) {
  if (a instanceof File) return a.type.startsWith("image/");
  if (a.type) return a.type.startsWith("image/");
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(a.name);
}

function isPdf(a: File | PersistedAttachment) {
  if (a instanceof File) return a.type === "application/pdf";
  if (a.type) return a.type === "application/pdf";
  return /\.pdf$/i.test(a.name);
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentsStep({ attachments, setAttachments }: { attachments: any[]; setAttachments: (a: any[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);

  const viewUrls = useMemo(() => {
    return attachments.map((a) => {
      if (a instanceof File) return URL.createObjectURL(a);
      return (a as PersistedAttachment).url || "";
    });
  }, [attachments]);

  useEffect(() => {
    return () => {
      for (const u of viewUrls) {
        if (u.startsWith("blob:")) URL.revokeObjectURL(u);
      }
    };
  }, [viewUrls]);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    setAttachments([...attachments, ...Array.from(files)]);
  }, [attachments, setAttachments]);

  const removeFile = useCallback((idx: number) => {
    const u = viewUrls[idx];
    if (u.startsWith("blob:")) URL.revokeObjectURL(u);
    setAttachments(attachments.filter((_, i) => i !== idx));
  }, [attachments, viewUrls, setAttachments]);

  const handleDownload = useCallback(async (idx: number) => {
    const a = attachments[idx];
    const name = a.name;
    if (a instanceof File) {
      const el = document.createElement("a");
      el.href = viewUrls[idx];
      el.download = name;
      el.click();
    } else {
      const pa = a as PersistedAttachment;
      try {
        const res = await fetch(pa.url);
        const blob = await res.blob();
        const obj = URL.createObjectURL(blob);
        const el = document.createElement("a");
        el.href = obj;
        el.download = name;
        el.click();
        URL.revokeObjectURL(obj);
      } catch {
        window.open(pa.url, "_blank");
      }
    }
  }, [attachments, viewUrls]);

  const handleView = useCallback((idx: number) => {
    const a = attachments[idx];
    const url = viewUrls[idx];
    if (!url) return;
    if (isImg(a)) {
      setPreviewIdx(idx);
    } else {
      window.open(url, "_blank");
    }
  }, [attachments, viewUrls]);

  const previewFile = previewIdx !== null ? attachments[previewIdx] : null;
  const previewUrl = previewIdx !== null ? viewUrls[previewIdx] : null;

  const getAttachmentKey = (a: File | PersistedAttachment, index: number): string => {
    if (a instanceof File) {
      return `file-${a.name}-${a.size}-${a.lastModified}`;
    }
    const pa = a as PersistedAttachment;
    if (pa.id) return `persisted-${pa.id}`;
    if (pa.url) return `persisted-${pa.url}`;
    return `persisted-${pa.name}-${index}`;
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
          drag ? "border-gold bg-gold-soft/30" : "border-border bg-surface-soft hover:border-foreground/30"
        }`}
      >
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
        <div className="mx-auto h-12 w-12 rounded-2xl bg-card border border-border flex items-center justify-center mb-3">
          <Upload className="h-5 w-5 text-gold-deep" />
        </div>
        <div className="text-sm font-medium">Glissez vos fichiers ici</div>
        <div className="text-xs text-muted-foreground mt-1">Images, PDF, documents — jusqu'à 20 MB</div>
      </div>
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((a, i) => {
            const img = isImg(a);
            const pdf = isPdf(a);
            const extLabel = ext(a.name);
            const canView = img || pdf || (!(a instanceof File) && !!viewUrls[i]);
            return (
              <motion.div
                key={getAttachmentKey(a, i)}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {img && viewUrls[i] ? (
                    <button onClick={() => setPreviewIdx(i)} className="shrink-0 h-10 w-10 rounded-lg overflow-hidden border border-border">
                      <img src={viewUrls[i]} alt={a.name} className="h-full w-full object-cover" />
                    </button>
                  ) : pdf ? (
                    <div className="h-9 w-9 rounded-lg bg-surface-soft border border-border flex items-center justify-center">
                      <FileText className="h-4 w-4 text-red-500" />
                    </div>
                  ) : (
                    <div className="h-9 w-9 rounded-lg bg-surface-soft border border-border flex items-center justify-center">
                      <FileImage className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate max-w-[200px]">{a.name}</div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                      {a instanceof File && <span>{fmtSize(a.size)}</span>}
                      {a instanceof File && extLabel && <span>•</span>}
                      {extLabel && <span className="uppercase font-semibold">{extLabel}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  {canView && (
                    <button
                      onClick={() => handleView(i)}
                      className="h-8 w-8 rounded-full hover:bg-accent/30 text-muted-foreground hover:text-foreground flex items-center justify-center"
                      title="Voir"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(i)}
                    className="h-8 w-8 rounded-full hover:bg-accent/30 text-muted-foreground hover:text-foreground flex items-center justify-center"
                    title="Télécharger"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => removeFile(i)}
                    className="h-8 w-8 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center"
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {previewFile && previewUrl && isImg(previewFile) && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={() => setPreviewIdx(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="relative max-w-3xl max-h-[90vh] rounded-2xl overflow-hidden bg-black"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewIdx(null)}
                className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
              >
                <X className="h-4 w-4" />
              </button>
              <img src={previewUrl} alt={previewFile.name} className="max-h-[90vh] w-auto object-contain" />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-8">
                <p className="text-sm text-white truncate">{previewFile.name}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}