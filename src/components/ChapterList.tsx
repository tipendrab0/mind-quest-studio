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
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    createChapter.mutate(
      { name: name.trim(), subject: subject.trim() || undefined, description: description.trim() || undefined },
      { onSuccess: () => { setOpen(false); setName(""); setSubject(""); setDescription(""); } }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Chapters</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Chapter</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <Input placeholder="Chapter name (e.g. Kinematics)" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Subject (e.g. Physics)" value={subject} onChange={(e) => setSubject(e.target.value)} />
              <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              <Button onClick={handleCreate} disabled={createChapter.isPending || !name.trim()} className="w-full">
                {createChapter.isPending ? "Creating..." : "Create Chapter"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : chapters.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
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
              <button
                onClick={() => onSelect(ch)}
                className={`group flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all hover:shadow-card ${
                  selectedId === ch.id
                    ? "border-primary bg-primary/5 shadow-card"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{ch.name}</p>
                  {ch.subject && (
                    <p className="text-xs text-muted-foreground">{ch.subject}</p>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteChapter.mutate(ch.id); }}
                  className="ml-2 rounded p-1 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
