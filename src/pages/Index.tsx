import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, GraduationCap, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChapterList } from "@/components/ChapterList";
import { FileManager } from "@/components/FileManager";
import { QuizSettings } from "@/components/QuizSettings";
import { QuestionCard } from "@/components/QuestionCard";
import { useChapterFiles, useGenerateQuestions, useFileContent } from "@/hooks/useStudy";
import type { Chapter, Difficulty, QuestionType, GeneratedQuestion } from "@/types";
import { toast } from "sonner";

const Index = () => {
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [view, setView] = useState<"dashboard" | "quiz">("dashboard");

  const { data: files = [] } = useChapterFiles(selectedChapter?.id);
  const generateQuestions = useGenerateQuestions();
  const getFileContent = useFileContent();

  const handleGenerate = useCallback(
    async (settings: { difficulty: Difficulty; questionType: QuestionType; numQuestions: number }) => {
      if (!selectedChapter || files.length === 0) {
        toast.error("Please upload files to this chapter first!");
        return;
      }

      try {
        // Fetch content from all files
        const contents = await Promise.all(
          files.map((f) => getFileContent(f.file_path).catch(() => `[Could not read ${f.file_name}]`))
        );
        const combinedContent = contents.join("\n\n---\n\n");

        const result = await generateQuestions.mutateAsync({
          content: combinedContent,
          difficulty: settings.difficulty,
          questionType: settings.questionType,
          numQuestions: settings.numQuestions,
          chapterName: selectedChapter.name,
        });

        if (result && result.length > 0) {
          setQuestions(result);
          setView("quiz");
        } else {
          toast.error("No questions generated. Try different settings or add more content.");
        }
      } catch (err) {
        console.error(err);
      }
    },
    [selectedChapter, files, generateQuestions, getFileContent]
  );

  if (view === "quiz") {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
            <Button variant="ghost" size="sm" onClick={() => setView("dashboard")} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <div className="flex-1">
              <h1 className="text-sm font-semibold">{selectedChapter?.name}</h1>
              <p className="text-xs text-muted-foreground">{questions.length} questions</p>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-4xl space-y-4 px-4 py-6">
          {questions.map((q, i) => (
            <QuestionCard key={i} question={q} index={i} />
          ))}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">StudyForge</h1>
            <p className="text-xs text-muted-foreground">AI-Powered Exam Preparation</p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-chapter/5">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl"
          >
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" /> AI Question Generator & Examiner
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Upload. Practice. Master.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Organize your study materials by chapter, generate exam-quality questions with AI, 
              and get detailed feedback from a virtual board examiner.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Sidebar: Chapters */}
          <div className="lg:col-span-3">
            <ChapterList onSelect={setSelectedChapter} selectedId={selectedChapter?.id} />
          </div>

          {/* Middle: Files */}
          <div className="lg:col-span-5">
            <AnimatePresence mode="wait">
              {selectedChapter ? (
                <motion.div
                  key={selectedChapter.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                >
                  <FileManager chapter={selectedChapter} />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center"
                >
                  <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    Select a chapter to manage files
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Quiz Settings */}
          <div className="lg:col-span-4">
            <QuizSettings
              onStart={handleGenerate}
              isLoading={generateQuestions.isPending}
              disabled={!selectedChapter || files.length === 0}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
