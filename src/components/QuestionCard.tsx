import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { CheckCircle2, XCircle, Send, ChevronDown, ChevronUp, Award, AlertTriangle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useGradeAnswer } from "@/hooks/useStudy";
import type { GeneratedQuestion, GradeResult } from "@/types";

interface QuestionCardProps {
  question: GeneratedQuestion;
  index: number;
}

export function QuestionCard({ question, index }: QuestionCardProps) {
  const [answer, setAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [showIdeal, setShowIdeal] = useState(false);
  const gradeAnswer = useGradeAnswer();

  const handleSubmit = () => {
    const userAnswer = question.question_type === "mcq" ? (selectedOption || "") : answer;
    if (!userAnswer.trim()) return;

    gradeAnswer.mutate(
      {
        questionText: question.question_text,
        questionType: question.question_type,
        idealAnswer: question.ideal_answer,
        userAnswer,
        marks: question.marks,
        options: question.options,
      },
      { onSuccess: (data) => setResult(data) }
    );
  };

  const typeLabel = {
    mcq: "MCQ",
    numerical: "Numerical",
    theoretical: "Theory",
  }[question.question_type] || question.question_type;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {index + 1}
          </span>
          <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            {typeLabel}
          </span>
        </div>
        <span className="text-xs font-mono text-muted-foreground">{question.marks} mark{question.marks > 1 ? "s" : ""}</span>
      </div>

      {/* Question */}
      <div className="p-4 space-y-4">
        <div className="prose prose-sm max-w-none text-foreground">
          <ReactMarkdown>{question.question_text}</ReactMarkdown>
        </div>

        {/* MCQ Options */}
        {question.question_type === "mcq" && question.options && (
          <div className="space-y-2">
            {(question.options as string[]).map((opt, i) => (
              <button
                key={i}
                onClick={() => !result && setSelectedOption(opt)}
                disabled={!!result}
                className={`w-full rounded-lg border p-3 text-left text-sm transition-all ${
                  selectedOption === opt
                    ? result
                      ? result.is_correct
                        ? "border-success bg-success/5"
                        : "border-destructive bg-destructive/5"
                      : "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                } ${result ? "cursor-default" : "cursor-pointer"}`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Text Answer */}
        {question.question_type !== "mcq" && !result && (
          <Textarea
            placeholder="Write your answer here..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={4}
            className="resize-none"
          />
        )}

        {question.question_type !== "mcq" && result && (
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground mb-1">Your Answer:</p>
            <p className="text-sm">{answer}</p>
          </div>
        )}

        {/* Submit */}
        {!result && (
          <Button
            onClick={handleSubmit}
            disabled={gradeAnswer.isPending || (question.question_type === "mcq" ? !selectedOption : !answer.trim())}
            className="gap-2"
          >
            {gradeAnswer.isPending ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Grading...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" /> Submit Answer
              </>
            )}
          </Button>
        )}

        {/* Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Score */}
            <div className={`flex items-center gap-3 rounded-lg p-3 ${
              result.is_correct
                ? "bg-success/10 border border-success/20"
                : "bg-destructive/10 border border-destructive/20"
            }`}>
              {result.is_correct ? (
                <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive shrink-0" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">
                    {result.is_correct ? "Correct!" : "Needs Improvement"}
                  </span>
                  <span className="font-mono font-bold text-sm">
                    {result.score}/{result.max_score}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{result.feedback}</p>
              </div>
            </div>

            {/* Improvements */}
            {result.improvements && result.improvements.length > 0 && (
              <div className="rounded-lg border border-warning/20 bg-warning/5 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Lightbulb className="h-4 w-4 text-warning" />
                  <span className="text-xs font-semibold">Things to Improve</span>
                </div>
                <ul className="space-y-1">
                  {result.improvements.map((imp, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                      <span className="text-warning">•</span> {imp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Step Analysis */}
            {result.step_analysis && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs font-semibold mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Step Analysis
                </p>
                <div className="prose prose-xs max-w-none text-muted-foreground">
                  <ReactMarkdown>{result.step_analysis}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Ideal Answer Toggle */}
            <button
              onClick={() => setShowIdeal(!showIdeal)}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <Award className="h-3.5 w-3.5" />
              {showIdeal ? "Hide" : "Show"} Model Answer
              {showIdeal ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showIdeal && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="rounded-lg border border-chapter/20 bg-chapter/5 p-3"
              >
                <div className="prose prose-sm max-w-none text-foreground">
                  <ReactMarkdown>{question.ideal_answer}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
