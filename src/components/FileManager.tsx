import { useCallback, useState } from "react";
import { Upload, X, FileText, Image, Eye, Scan } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChapterFiles, useUploadFile, useDeleteFile } from "@/hooks/useStudy";
import { Button } from "@/components/ui/button";
import type { Chapter } from "@/types";

interface FileManagerProps {
  chapter: Chapter;
}

export function FileManager({ chapter }: FileManagerProps) {
  const { data: files = [], isLoading } = useChapterFiles(chapter.id);
  const uploadFile = useUploadFile();
  const deleteFile = useDeleteFile();
  const [dragOver, setDragOver] = useState(false);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  const handleFiles = useCallback(
    (fileList: FileList) => {
      Array.from(fileList).forEach((file) => {
        uploadFile.mutate({ file, chapterId: chapter.id });
      });
    },
    [chapter.id, uploadFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const isImageFile = (contentType: string | null) =>
    contentType?.startsWith("image/") ?? false;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Files</h3>
          <p className="text-xs text-muted-foreground">{chapter.name}</p>
        </div>
        <label>
          <input
            type="file"
            multiple
            className="hidden"
            accept=".txt,.pdf,.md,.doc,.docx,.csv,.png,.jpg,.jpeg,.webp,.heic"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <Button size="sm" variant="outline" className="gap-1.5 cursor-pointer" asChild>
            <span>
              <Upload className="h-3.5 w-3.5" /> Upload
            </span>
          </Button>
        </label>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`rounded-xl border-2 border-dashed p-6 text-center transition-all ${
          dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/30"
        }`}
      >
        <div className="flex justify-center gap-2 mb-2">
          <Upload className="h-5 w-5 text-muted-foreground" />
          <Image className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground">
          Drag & drop files here or click Upload
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          Images, PDFs & text files · Handwriting auto-recognized
        </p>
      </div>

      {uploadFile.isPending && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 p-3 text-xs text-primary"
        >
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <div>
            <p className="font-medium">Processing file...</p>
            <p className="text-[10px] text-primary/70">Uploading & extracting text via OCR</p>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {files.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-border bg-card overflow-hidden"
          >
            <div className="flex items-center gap-2.5 p-3">
              {isImageFile(f.content_type) ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Image className="h-4 w-4 text-primary" />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chapter/10">
                  <FileText className="h-4 w-4 text-chapter" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{f.file_name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-muted-foreground">{formatSize(f.file_size)}</p>
                  {f.extracted_text && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-success/10 px-1.5 py-0.5 text-[9px] font-medium text-success">
                      <Scan className="h-2.5 w-2.5" /> OCR
                    </span>
                  )}
                </div>
              </div>
              {f.extracted_text && (
                <button
                  onClick={() => setExpandedFile(expandedFile === f.id ? null : f.id)}
                  className="rounded-lg p-1.5 hover:bg-muted transition-colors"
                  title="Preview extracted text"
                >
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
              <button
                onClick={() => deleteFile.mutate(f)}
                className="rounded-lg p-1.5 hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <AnimatePresence>
              {expandedFile === f.id && f.extracted_text && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border"
                >
                  <div className="p-3 max-h-40 overflow-y-auto">
                    <p className="text-[10px] font-medium text-muted-foreground mb-1">Extracted Text:</p>
                    <p className="text-xs text-foreground/80 whitespace-pre-wrap">{f.extracted_text}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
