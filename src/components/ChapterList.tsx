import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, BookOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useChapters, useCreateChapter, useDeleteChapter } from "@/hooks/useStudy";
import type { Chapter } from "@/types";

interface ChapterListProps {
  onSelect: (chapter: Chapter) => void;
  selectedId?: string;
}

export function ChapterList({ onSelect, selectedId }: ChapterListProps) {
  const { data: chapters = [], isLoading } = useChapters();
  const createChapter = useCreateChapter();
  const deleteChapter = useDeleteChapter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    createChapter.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      { onSuccess: () => { setOpen(false); setName(""); setDescription(""); } }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Chapters</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 rounded-full">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Chapter</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <Input placeholder="Chapter name (e.g. Kinematics)" value={name} onChange={(e) => setName(e.target.value)} />
              <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              <Button onClick={handleCreate} disabled={createChapter.isPending || !name.trim()} className="w-full rounded-full">
                {createChapter.isPending ? "Creating..." : "Create Chapter"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : chapters.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <BookOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No chapters yet. Add your first chapter to get started!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {chapters.map((ch, i) => (
            <motion.div
              key={ch.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div
                onClick={() => onSelect(ch)}
                role="button"
                tabIndex={0}
                className={`group flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all hover:shadow-md cursor-pointer ${
                  selectedId === ch.id
                    ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{ch.name}</p>
                  {ch.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{ch.description}</p>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteChapter.mutate(ch.id); }}
                  className="ml-2 rounded-lg p-1.5 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
