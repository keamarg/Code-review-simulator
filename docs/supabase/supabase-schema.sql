-- Supabase Schema for Code Review Simulator
-- Import this file into your Supabase project's SQL Editor

-- Create the exams table
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'Standard',
    duration INTEGER NOT NULL DEFAULT 8,
    learning_goals TEXT NOT NULL DEFAULT 'intermediate',
    is_public BOOLEAN NOT NULL DEFAULT false,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- Create policies for the exams table
-- Drop existing policies if they exist (safe - won't affect data, only permissions)

-- Policy: Users can view their own exams and public exams
DROP POLICY IF EXISTS "Users can view own exams and public exams" ON public.exams;
CREATE POLICY "Users can view own exams and public exams" ON public.exams
    FOR SELECT USING (
        auth.uid() = user_id OR is_public = true
    );

-- Policy: Users can insert their own exams
DROP POLICY IF EXISTS "Users can insert own exams" ON public.exams;
CREATE POLICY "Users can insert own exams" ON public.exams
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- Policy: Users can update their own exams
DROP POLICY IF EXISTS "Users can update own exams" ON public.exams;
CREATE POLICY "Users can update own exams" ON public.exams
    FOR UPDATE USING (
        auth.uid() = user_id
    ) WITH CHECK (
        auth.uid() = user_id
    );

-- Policy: Users can delete their own exams
DROP POLICY IF EXISTS "Users can delete own exams" ON public.exams;
CREATE POLICY "Users can delete own exams" ON public.exams
    FOR DELETE USING (
        auth.uid() = user_id
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exams_user_id ON public.exams(user_id);
CREATE INDEX IF NOT EXISTS idx_exams_is_public ON public.exams(is_public);
CREATE INDEX IF NOT EXISTS idx_exams_created_at ON public.exams(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE public.exams IS 'Code review exercises/exams created by users';
COMMENT ON COLUMN public.exams.id IS 'Unique identifier for the exam';
COMMENT ON COLUMN public.exams.title IS 'Title of the code review exam';
COMMENT ON COLUMN public.exams.description IS 'Description of what the code review should focus on';
COMMENT ON COLUMN public.exams.type IS 'Type of review: Standard or Github Repo';
COMMENT ON COLUMN public.exams.duration IS 'Duration of the exam in minutes';
COMMENT ON COLUMN public.exams.learning_goals IS 'Developer level: beginner, intermediate, advanced';
COMMENT ON COLUMN public.exams.is_public IS 'Whether the exam is visible to other users';
COMMENT ON COLUMN public.exams.user_id IS 'ID of the user who created this exam';

-- Create the transcripts table to store conversation transcripts
CREATE TABLE IF NOT EXISTS public.transcripts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT,
    transcript TEXT NOT NULL,
    full_conversation JSONB,
    session_duration_seconds INTEGER,
    summary TEXT,
    metadata JSONB,
    is_quick_start BOOLEAN NOT NULL DEFAULT false
);

-- Add user_email column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transcripts' 
        AND column_name = 'user_email'
    ) THEN
        ALTER TABLE public.transcripts ADD COLUMN user_email TEXT;
    END IF;
END $$;

-- Migrate to combined transcript column (for existing tables)
DO $$ 
BEGIN
    -- Step 1: Make old columns nullable if they exist and are NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transcripts' 
        AND column_name = 'ai_transcript'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.transcripts ALTER COLUMN ai_transcript DROP NOT NULL;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transcripts' 
        AND column_name = 'user_transcript'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.transcripts ALTER COLUMN user_transcript DROP NOT NULL;
    END IF;
    
    -- Step 2: Add transcript column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transcripts' 
        AND column_name = 'transcript'
    ) THEN
        -- Add column as nullable first
        ALTER TABLE public.transcripts ADD COLUMN transcript TEXT;
        
        -- Migrate existing data: combine ai_transcript and user_transcript
        UPDATE public.transcripts 
        SET transcript = COALESCE(
            CASE 
                WHEN user_transcript IS NOT NULL AND user_transcript != '' 
                    AND ai_transcript IS NOT NULL AND ai_transcript != ''
                THEN 'User: ' || user_transcript || E'\n\nAI: ' || ai_transcript
                WHEN user_transcript IS NOT NULL AND user_transcript != ''
                THEN 'User: ' || user_transcript
                WHEN ai_transcript IS NOT NULL AND ai_transcript != ''
                THEN 'AI: ' || ai_transcript
                ELSE 'No conversation recorded'
            END,
            'No conversation recorded'
        )
        WHERE transcript IS NULL;
        
        -- Make transcript NOT NULL after migration (only if all rows have values)
        ALTER TABLE public.transcripts ALTER COLUMN transcript SET NOT NULL;
    END IF;
    
    -- Step 3: Drop old columns if they exist (optional - comment out if you want to keep them for backup)
    -- Uncomment these lines after verifying the migration worked:
    -- ALTER TABLE public.transcripts DROP COLUMN IF EXISTS ai_transcript;
    -- ALTER TABLE public.transcripts DROP COLUMN IF EXISTS user_transcript;
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;

-- Create policies for the transcripts table
-- Drop existing policies if they exist (safe - won't affect data, only permissions)

-- Policy: Users can view their own transcripts
DROP POLICY IF EXISTS "Users can view own transcripts" ON public.transcripts;
CREATE POLICY "Users can view own transcripts" ON public.transcripts
    FOR SELECT USING (
        auth.uid() = user_id
    );

-- Policy: Users can insert their own transcripts
DROP POLICY IF EXISTS "Users can insert own transcripts" ON public.transcripts;
CREATE POLICY "Users can insert own transcripts" ON public.transcripts
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- Policy: Users can update their own transcripts
DROP POLICY IF EXISTS "Users can update own transcripts" ON public.transcripts;
CREATE POLICY "Users can update own transcripts" ON public.transcripts
    FOR UPDATE USING (
        auth.uid() = user_id
    ) WITH CHECK (
        auth.uid() = user_id
    );

-- Policy: Users can delete their own transcripts
DROP POLICY IF EXISTS "Users can delete own transcripts" ON public.transcripts;
CREATE POLICY "Users can delete own transcripts" ON public.transcripts
    FOR DELETE USING (
        auth.uid() = user_id
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transcripts_user_id ON public.transcripts(user_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_exam_id ON public.transcripts(exam_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_created_at ON public.transcripts(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE public.transcripts IS 'Conversation transcripts from code review sessions';
COMMENT ON COLUMN public.transcripts.id IS 'Unique identifier for the transcript';
COMMENT ON COLUMN public.transcripts.exam_id IS 'ID of the exam/review this transcript belongs to (nullable for quick start)';
COMMENT ON COLUMN public.transcripts.user_id IS 'ID of the user who conducted the review';
COMMENT ON COLUMN public.transcripts.user_email IS 'Email/login name of the user who conducted the review';
COMMENT ON COLUMN public.transcripts.transcript IS 'Combined conversation transcript showing User and AI messages in chronological order (format: "User: ...\n\nAI: ...\n\n")';
COMMENT ON COLUMN public.transcripts.full_conversation IS 'JSON array of conversation entries with timestamps';
COMMENT ON COLUMN public.transcripts.session_duration_seconds IS 'Duration of the session in seconds';
COMMENT ON COLUMN public.transcripts.summary IS 'Generated summary of the review session';
COMMENT ON COLUMN public.transcripts.metadata IS 'Additional metadata (interaction count, etc.)';
COMMENT ON COLUMN public.transcripts.is_quick_start IS 'Whether this was a quick start session (no exam_id)'; 