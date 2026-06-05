"use client"

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, Paperclip, Trash2 } from "lucide-react";

export function AttachmentsStep({ attachments, setAttachments }: { attachments: any[]; setAttachments: (a: any[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files).map((f) => ({ name: f.name, size: `${Math.round(f.size / 1024)} KB` }));
    setAttachments([...attachments, ...next]);
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
          {attachments.map((a, i) => (
            <motion.div
              key={a.name + i}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-surface-soft border border-border flex items-center justify-center">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm font-medium">{a.name}</div>
                  <div className="text-[11px] text-muted-foreground">{a.size}</div>
                </div>
              </div>
              <button
                onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                className="h-8 w-8 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
