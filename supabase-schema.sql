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

-- Policy: Users can view their own exams and public exams
CREATE POLICY "Users can view own exams and public exams" ON public.exams
    FOR SELECT USING (
        auth.uid() = user_id OR is_public = true
    );

-- Policy: Users can insert their own exams
CREATE POLICY "Users can insert own exams" ON public.exams
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- Policy: Users can update their own exams
CREATE POLICY "Users can update own exams" ON public.exams
    FOR UPDATE USING (
        auth.uid() = user_id
    ) WITH CHECK (
        auth.uid() = user_id
    );

-- Policy: Users can delete their own exams
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