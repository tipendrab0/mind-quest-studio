import { useCallback, useState } from "react";
import { Upload, X, FileText } from "lucide-react";
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Files · {chapter.name}
        </h3>
        <label>
          <input
            type="file"
            multiple
            className="hidden"
            accept=".txt,.pdf,.md,.doc,.docx,.csv"
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
        className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border"
        }`}
      >
        <Upload className="mx-auto mb-1.5 h-5 w-5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Drag & drop files here or click Upload
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          .txt, .pdf, .md, .doc, .csv supported
        </p>
      </div>

      {uploadFile.isPending && (
        <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-2 text-xs text-primary">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Uploading...
        </div>
      )}

      <AnimatePresence>
        {files.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 rounded-lg border border-border bg-card p-2"
          >
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{f.file_name}</p>
              <p className="text-[10px] text-muted-foreground">{formatSize(f.file_size)}</p>
            </div>
            <button
              onClick={() => deleteFile.mutate(f)}
              className="rounded p-1 hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
