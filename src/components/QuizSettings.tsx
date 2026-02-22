import { useState } from "react";
import { Zap, Brain, Calculator, FileQuestion, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { Difficulty, QuestionType } from "@/types";

interface QuizSettingsProps {
  onStart: (settings: {
    difficulty: Difficulty;
    questionType: QuestionType;
    numQuestions: number;
  }) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const difficultyConfig = {
  easy: { label: "Easy", icon: "🟢", desc: "Basic recall & concepts" },
  medium: { label: "Medium", icon: "🟡", desc: "Application & understanding" },
  hard: { label: "Hard", icon: "🔴", desc: "CBSE board exam level" },
  olympiad: { label: "Olympiad", icon: "🏆", desc: "Competition level" },
};

const typeConfig = {
  mcq: { label: "MCQ", icon: FileQuestion, desc: "Multiple choice" },
  numerical: { label: "Numerical", icon: Calculator, desc: "Calculation based" },
  theoretical: { label: "Theory", icon: Brain, desc: "Descriptive answers" },
  mixed: { label: "Mixed", icon: Shuffle, desc: "All types" },
};

export function QuizSettings({ onStart, isLoading, disabled }: QuizSettingsProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [questionType, setQuestionType] = useState<QuestionType>("mixed");
  const [numQuestions, setNumQuestions] = useState(5);

  return (
    <div className="space-y-5 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Quiz Settings</h3>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Difficulty</Label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(difficultyConfig) as [Difficulty, typeof difficultyConfig.easy][]).map(
            ([key, cfg]) => (
              <button
                key={key}
                onClick={() => setDifficulty(key)}
                className={`rounded-lg border p-2.5 text-left transition-all ${
                  difficulty === key
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{cfg.icon}</span>
                  <span className="text-sm font-medium">{cfg.label}</span>
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{cfg.desc}</p>
              </button>
            )
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Question Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(typeConfig) as [QuestionType, typeof typeConfig.mcq][]).map(
            ([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <button
                  key={key}
                  onClick={() => setQuestionType(key)}
                  className={`rounded-lg border p-2.5 text-left transition-all ${
                    questionType === key
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-sm font-medium">{cfg.label}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{cfg.desc}</p>
                </button>
              );
            }
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Number of Questions</Label>
          <span className="text-sm font-mono font-semibold text-primary">{numQuestions}</span>
        </div>
        <Slider
          value={[numQuestions]}
          onValueChange={([v]) => setNumQuestions(v)}
          min={1}
          max={20}
          step={1}
        />
      </div>

      <Button
        onClick={() => onStart({ difficulty, questionType, numQuestions })}
        disabled={isLoading || disabled}
        className="w-full gap-2"
        size="lg"
      >
        {isLoading ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            Generating Questions...
          </>
        ) : (
          <>
            <Zap className="h-4 w-4" />
            Generate Questions
          </>
        )}
      </Button>
    </div>
  );
}
