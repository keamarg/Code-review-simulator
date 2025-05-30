# Code Review Simulator Transformation Plan

This document outlines the necessary changes to transform the Exam Simulator into a Code Review Simulator with a modern, sleek dark theme interface focused on research purposes.

## 1. Prompt Changes

### Main System Prompts (`src/exam-simulator/utils/prompt.js`)

**Current:** Prompts focused on exam settings, student evaluation, and grading.  
**Change to:** Prompts for code review feedback, focusing on best practices, code quality, and improvement suggestions.

```javascript
// From:
const prompt = `You are a friendly examiner running a ${examDurationActiveExam} minute ${examSimulator?.title || "exam"} exam.`

// To:
const prompt = `You are an experienced code reviewer analyzing a ${examSimulator?.title || "codebase"}.`
```

Key prompt sections to update:
- Change examination process to code review process
- Replace competencies with code quality metrics
- Replace grading criteria with feedback structure
- Update task descriptions to focus on code review

### Examiner Questions (`src/exam-simulator/utils/getExaminerQuestions.tsx`)

**Current:** System prompt is "You are a skilled and seasoned censor with many years of experience"  
**Change to:** "You are a senior developer with extensive experience in code review and technical assessment"

### GitHub Repository Questions (`src/exam-simulator/utils/getGithubRepoFiles.js`)

**Current:** Uses prompt based on "You are an exam examiner"  
**Change to:** "You are a code review expert analyzing repositories"

### Core Behavior Instructions

Replace all instances of:
- "exam" → "code review"
- "examiner" → "reviewer"
- "student" → "developer"
- "grade" → "assessment" or "feedback"
- "learning goals" → "code quality metrics"

## 2. UI/UX Changes

### Dark Theme Implementation

1. Modify `src/App.scss`:
   - Already has dark colors defined
   - Update body background to `var(--Neutral-10)` or `var(--Neutral-5)`
   - Set text colors to use `var(--Neutral-90)` for better contrast
   - Ensure all UI components inherit dark theme styling

2. Update Layout Components:
   - `src/exam-simulator/layout/Layout.tsx` - replace "MinEksamen" with "Code Review"
   - Replace Danish menu items with English equivalents
   - Update footer to reflect research purpose

3. Component Styling:
   - Update AIExaminer.tsx components to use dark theme colors
   - Replace loading animation icons with code-related icons
   - Ensure proper contrast for all text elements

## 3. Text & Label Changes

### Page and Component Labels

1. Replace all exam-related terminology:
   - "Exam" → "Code Review"
   - "Student Task" → "Code Review Task"
   - "Preparing your exam content" → "Preparing your code review"
   - "MinEksamen" → "Code Review Simulator"

2. Update document titles:
   - In `public/index.html`, change `<title>MinEksamen</title>` to `<title>Code Review Simulator</title>`

3. Navigation:
   - "Opret" → "Create Review"
   - "Oversigt" → "Dashboard"
   - "Log ind" → "Sign In"
   - "Opret konto" → "Create Account"

4. Landing Page Text:
   - Update all testimonials and marketing text to focus on code review benefits
   - Replace educational institution references with developer-focused language

## 4. Commercial Elements Removal

1. Footer (`src/exam-simulator/layout/Layout.tsx`):
   - Replace commercial contact information with research disclaimer
   - Remove feedback form links and marketing text

2. User Authentication:
   - Maintain authentication functionality, but remove references to premium features
   - Update public/private options to focus on research sharing

3. Landing Page:
   - Remove testimonials section or replace with research-focused content
   - Change CTA sections to focus on contribution rather than signup

## 5. Folder Structure

For proper naming convention:
- Eventually rename `src/exam-simulator` to `src/code-review-simulator`
- Update all imports accordingly
- Create a proper logo for the project to replace the existing one

## Implementation Priority

1. Prompt system changes (highest impact)
   - Update all AI prompts and behavior instructions
   - Test new prompts with sample code reviews

2. Dark theme implementation
   - Update color scheme in App.scss
   - Modify background and text colors in components
   - Ensure consistent styling across the application

3. Text and label updates
   - Replace all exam terminology with code review terminology
   - Update navigation and UI elements
   - Change page titles and headers

4. Commercial elements removal
   - Update footer with research disclaimer
   - Remove marketing language and commercial calls-to-action

5. Folder structure (if time allows)
   - Rename directories and update imports
   - Ensure all paths are correctly updated

This approach allows for a phased transformation while maintaining application functionality at each step.
