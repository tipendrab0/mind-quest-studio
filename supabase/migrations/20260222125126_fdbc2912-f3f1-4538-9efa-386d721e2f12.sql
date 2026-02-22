
-- Chapters table
CREATE TABLE public.chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chapter files table
CREATE TABLE public.chapter_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  content_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Quiz sessions table
CREATE TABLE public.quiz_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  question_type TEXT NOT NULL DEFAULT 'mixed',
  num_questions INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  options JSONB,
  marks INTEGER NOT NULL DEFAULT 1,
  ideal_answer TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Answers table
CREATE TABLE public.answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL,
  score NUMERIC,
  max_score NUMERIC,
  feedback TEXT,
  improvements JSONB,
  is_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Storage bucket for study materials
INSERT INTO storage.buckets (id, name, public) VALUES ('study-materials', 'study-materials', true);

-- RLS: Allow all access (no auth for v1, public app)
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access on chapters" ON public.chapters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access on chapter_files" ON public.chapter_files FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access on quiz_sessions" ON public.quiz_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access on questions" ON public.questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access on answers" ON public.answers FOR ALL USING (true) WITH CHECK (true);

-- Storage policies
CREATE POLICY "Allow all uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'study-materials');
CREATE POLICY "Allow all reads" ON storage.objects FOR SELECT USING (bucket_id = 'study-materials');
CREATE POLICY "Allow all deletes" ON storage.objects FOR DELETE USING (bucket_id = 'study-materials');
