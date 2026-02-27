import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Chapter, ChapterFile, QuestionType, Difficulty, GeneratedQuestion, GradeResult } from "@/types";

export function useChapters() {
  return useQuery({
    queryKey: ["chapters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapters")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as Chapter[];
    },
  });
}

export function useChapterFiles(chapterId: string | undefined) {
  return useQuery({
    queryKey: ["chapter-files", chapterId],
    queryFn: async () => {
      if (!chapterId) return [];
      const { data, error } = await supabase
        .from("chapter_files")
        .select("*")
        .eq("chapter_id", chapterId)
        .order("created_at");
      if (error) throw error;
      return data as ChapterFile[];
    },
    enabled: !!chapterId,
  });
}

export function useCreateChapter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (chapter: { name: string; description?: string }) => {
      const { data, error } = await supabase.from("chapters").insert(chapter).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chapters"] });
      toast.success("Chapter created!");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteChapter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chapters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chapters"] });
      toast.success("Chapter deleted");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUploadFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, chapterId }: { file: File; chapterId: string }) => {
      const filePath = `${chapterId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("study-materials")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      // Check if it's an image or PDF that needs OCR
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      let extractedText: string | null = null;

      if (isImage || isPdf) {
        try {
          const base64 = await fileToBase64(file);
          const { data, error } = await supabase.functions.invoke("ocr-extract", {
            body: { imageBase64: base64, mimeType: file.type, purpose: "study" },
          });
          if (!error && data?.text) {
            extractedText = data.text;
          }
        } catch (ocrErr) {
          console.error("OCR failed, uploading without extraction:", ocrErr);
        }
      }

      const { error: dbError } = await supabase.from("chapter_files").insert({
        chapter_id: chapterId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        content_type: file.type,
        extracted_text: extractedText,
      });
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chapter-files"] });
      toast.success("File uploaded & processed!");
    },
    onError: (e) => toast.error(e.message),
  });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useDeleteFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: ChapterFile) => {
      await supabase.storage.from("study-materials").remove([file.file_path]);
      const { error } = await supabase.from("chapter_files").delete().eq("id", file.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chapter-files"] });
      toast.success("File removed");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useGenerateQuestions() {
  return useMutation({
    mutationFn: async ({
      content,
      difficulty,
      questionType,
      numQuestions,
      chapterName,
    }: {
      content: string;
      difficulty: Difficulty;
      questionType: QuestionType;
      numQuestions: number;
      chapterName: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("generate-questions", {
        body: { content, difficulty, questionType, numQuestions, chapterName },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.questions as GeneratedQuestion[];
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useGradeAnswer() {
  return useMutation({
    mutationFn: async ({
      questionText,
      questionType,
      idealAnswer,
      userAnswer,
      marks,
      options,
    }: {
      questionText: string;
      questionType: string;
      idealAnswer: string;
      userAnswer: string;
      marks: number;
      options?: string[] | null;
    }) => {
      const { data, error } = await supabase.functions.invoke("grade-answer", {
        body: { questionText, questionType, idealAnswer, userAnswer, marks, options },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data as GradeResult;
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useOcrExtract() {
  return useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      const base64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke("ocr-extract", {
        body: { imageBase64: base64, mimeType: file.type, purpose: "answer" },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.text as string;
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useFileContent() {
  return useCallback(async (filePath: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from("study-materials")
      .download(filePath);
    if (error) throw error;
    return await data.text();
  }, []);
}
