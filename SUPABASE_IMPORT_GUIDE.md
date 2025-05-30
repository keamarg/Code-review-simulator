# Supabase CSV Import Guide

## 1. Schema Setup (Required First)

Before importing CSV data, you must create the table structure first. Run the SQL in `supabase-schema.sql` in your Supabase SQL Editor.

## 2. CSV Data Import

### Using the CSV Template (`exams-template.csv`)

The CSV file includes these columns:

- `id` - Leave empty (auto-generated UUID)
- `created_at` - Leave empty (auto-generated timestamp)
- `title` - Required text field
- `description` - Optional text field
- `type` - Either "Standard" or "Github Repo"
- `duration` - Number in minutes
- `learning_goals` - "beginner", "intermediate", or "senior"
- `is_public` - true/false
- `user_id` - Leave empty initially (will be filled with actual user IDs)

### Steps to Import in Supabase Dashboard:

1. **Go to Table Editor** in your Supabase dashboard
2. **Select the `exams` table**
3. **Click "Insert" → "Import from CSV"**
4. **Upload your CSV file**
5. **Map the columns** correctly
6. **Skip auto-generated fields** (id, created_at)
7. **Click Import**

### Important Notes:

- **user_id**: You'll need to replace empty user_id values with actual UUID values from your `auth.users` table after import
- **Auto-generated fields**: Leave `id` and `created_at` empty - Supabase will fill these automatically
- **Boolean values**: Use `true`/`false` (lowercase) for the `is_public` field
- **Validation**: Ensure `type` values are exactly "Standard" or "Github Repo"

### Sample CSV Content:

```csv
id,created_at,title,description,type,duration,learning_goals,is_public,user_id
,,Sample Code Review 1,Review this React component for best practices,Standard,15,intermediate,true,
,,GitHub Repository Review,Analyze the entire codebase structure,Github Repo,30,senior,false,
,,Junior Developer Review,Focus on basic syntax and structure,Standard,10,beginner,true,
```

### After Import:

You'll need to update the `user_id` field with actual user IDs:

```sql
-- First, get user IDs from auth.users
SELECT id, email FROM auth.users;

-- Then update the exams with appropriate user_id
UPDATE public.exams
SET user_id = 'actual-user-uuid-here'
WHERE user_id IS NULL OR user_id = '';
```

## 3. Alternative: Direct SQL Insert

If you prefer SQL over CSV import:

```sql
INSERT INTO public.exams (title, description, type, duration, learning_goals, is_public, user_id)
VALUES
('Sample Code Review 1', 'Review this React component for best practices', 'Standard', 15, 'intermediate', true, 'user-uuid-here'),
('GitHub Repository Review', 'Analyze the entire codebase structure', 'Github Repo', 30, 'senior', false, 'user-uuid-here'),
('Junior Developer Review', 'Focus on basic syntax and structure', 'Standard', 10, 'beginner', true, 'user-uuid-here');
```
