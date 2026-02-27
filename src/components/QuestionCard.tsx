import { useState, useRef } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { CheckCircle2, XCircle, Send, ChevronDown, ChevronUp, Award, AlertTriangle, Lightbulb, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useGradeAnswer, useOcrExtract } from "@/hooks/useStudy";
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
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const gradeAnswer = useGradeAnswer();
  const ocrExtract = useOcrExtract();
  const fileRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const url = URL.createObjectURL(file);
    setUploadedImage(url);

    // OCR extract
    const text = await ocrExtract.mutateAsync({ file });
    if (text) {
      setAnswer((prev) => (prev ? prev + "\n\n" + text : text));
    }
  };

  const typeLabel = {
    mcq: "MCQ",
    numerical: "Numerical",
    theoretical: "Theory",
  }[question.question_type] || question.question_type;

  const typeColor = {
    mcq: "bg-primary/10 text-primary",
    numerical: "bg-chapter/10 text-chapter",
    theoretical: "bg-success/10 text-success",
  }[question.question_type] || "bg-secondary text-secondary-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-muted/50 to-transparent px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-sm">
            {index + 1}
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${typeColor}`}>
            {typeLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5">
          <Award className="h-3 w-3 text-primary" />
          <span className="text-xs font-mono font-semibold">{question.marks} mark{question.marks > 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Question */}
      <div className="p-5 space-y-4">
        <div className="prose prose-sm max-w-none text-foreground leading-relaxed">
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
                className={`w-full rounded-xl border p-3.5 text-left text-sm transition-all ${
                  selectedOption === opt
                    ? result
                      ? result.is_correct
                        ? "border-success bg-success/5 ring-1 ring-success/30"
                        : "border-destructive bg-destructive/5 ring-1 ring-destructive/30"
                      : "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/30 hover:bg-muted/30"
                } ${result ? "cursor-default" : "cursor-pointer"}`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Text Answer with Image Upload */}
        {question.question_type !== "mcq" && !result && (
          <div className="space-y-2">
            <Textarea
              placeholder="Write your answer here, or upload a photo of your handwritten answer..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={5}
              className="resize-none rounded-xl"
            />
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleImageUpload}
              />
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 rounded-full text-xs"
                onClick={() => fileRef.current?.click()}
                disabled={ocrExtract.isPending}
              >
                {ocrExtract.isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Recognizing handwriting...
                  </>
                ) : (
                  <>
                    <Camera className="h-3 w-3" /> Upload handwritten answer
                  </>
                )}
              </Button>
            </div>
            {uploadedImage && (
              <div className="rounded-xl border border-border overflow-hidden">
                <img src={uploadedImage} alt="Uploaded answer" className="max-h-48 w-full object-contain bg-muted/30" />
              </div>
            )}
          </div>
        )}

        {question.question_type !== "mcq" && result && (
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Your Answer:</p>
            <p className="text-sm whitespace-pre-wrap">{answer}</p>
            {uploadedImage && (
              <img src={uploadedImage} alt="Uploaded answer" className="mt-2 max-h-32 rounded-lg object-contain" />
            )}
          </div>
        )}

        {/* Submit */}
        {!result && (
          <Button
            onClick={handleSubmit}
            disabled={gradeAnswer.isPending || ocrExtract.isPending || (question.question_type === "mcq" ? !selectedOption : !answer.trim())}
            className="gap-2 rounded-full px-6"
            size="lg"
          >
            {gradeAnswer.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Grading...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> Submit Answer
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
            <div className={`flex items-center gap-3 rounded-xl p-4 ${
              result.is_correct
                ? "bg-success/10 border border-success/20"
                : "bg-destructive/10 border border-destructive/20"
            }`}>
              {result.is_correct ? (
                <CheckCircle2 className="h-6 w-6 text-success shrink-0" />
              ) : (
                <XCircle className="h-6 w-6 text-destructive shrink-0" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {result.is_correct ? "Correct! 🎉" : "Needs Improvement"}
                  </span>
                  <span className="font-mono font-bold text-lg">
                    {result.score}/{result.max_score}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{result.feedback}</p>
              </div>
            </div>

            {result.improvements && result.improvements.length > 0 && (
              <div className="rounded-xl border border-warning/20 bg-warning/5 p-4 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Lightbulb className="h-4 w-4 text-warning" />
                  <span className="text-sm font-semibold">Things to Improve</span>
                </div>
                <ul className="space-y-1.5">
                  {result.improvements.map((imp, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-warning mt-0.5">•</span> {imp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.step_analysis && (
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-primary" /> Step Analysis
                </p>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <ReactMarkdown>{result.step_analysis}</ReactMarkdown>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowIdeal(!showIdeal)}
              className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
            >
              <Award className="h-4 w-4" />
              {showIdeal ? "Hide" : "Show"} Model Answer
              {showIdeal ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showIdeal && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="rounded-xl border border-chapter/20 bg-chapter/5 p-4"
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
