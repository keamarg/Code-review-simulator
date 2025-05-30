# UI Text Content

This document catalogs all user-facing text content from the Code Review Simulator application. Each text entry includes a reference to its source file and approximate line number.

## Navigation & Layout

_Source: src/exam-simulator/layout/Layout.tsx_

### Header

- "MinEksamen" (L33) - Brand name in header
- "Opret" (L48) - Create navigation item
- "Oversigt" (L55) - Overview navigation item
- "Log ud" (L62) - Log out button
- "Log ind" (L73) - Log in navigation item
- "Opret konto" (L80) - Create account navigation item

### Footer

- "Uddannelsesværktøj i beta. Kontakt Benjamin Hughes for spørgsmål." (L97-100)
- "Giv feedback her: https://forms.office.com/e/NpfLHm1gb6" (L101)

## Landing Page

_Source: src/exam-simulator/pages/LandingPage.tsx_

### Hero Section

- "Eksamenstræning der virker" (L24-26) - Main headline
- "Træn din mundtlige eksamen med en AI du kan snakke med" (L27-29) - Subheading

### Example Exam Card

- "Algoritmer og Datastrukturer" (L46-48) - Example exam title
- "10 min" (L49) - Duration
- "Algoritmer og datastrukturer" (L74-76) - Learning goal
- "Big O" (L94) - Learning goal
- "Sorteringsalgoritmer" (L112-114) - Learning goal

### Benefits Section

- "Træn som til den rigtige eksamen" (L136-138) - Section heading
- "Forbered dig optimalt med realistiske eksamensforhold" (L139-141) - Section subheading

#### Benefit Cards

1. First card

   - "Snak som i den rigtige eksamen" (L160-162) - Title
   - "Del din skærm og gå til eksamen ved en AI censor der både forstår og udfordrer dig" (L163-166) - Description

2. Second card

   - "Tilpasset dit pensum" (L186-188) - Title
   - "Din underviser har oprettet en eksamen der minder så meget om den rigtige eksamen som muligt" (L189-192) - Description

3. Third card
   - "Detaljeret feedback og karakter" (L212-214) - Title
   - "Få personlig feedback og en karakter og dermed lær af dine fejl for at forbedre din præstation." (L215-218) - Description

### Testimonial Section

- "Man kan jo bare snakke med AI'en! Det føles virkelig som at tage den rigtige eksamen, men i trygge rammer, hvor ingen dømmer mig" (L235-239) - Quote
- "Mette Andersen" (L241) - Person name
- "Datalogistuderende, Københavns Universitet" (L242-244) - Person title

## Login Page

_Source: src/exam-simulator/pages/Login.tsx_

- "Log ind på din konto" (L40-42) - Page heading
- "Email adresse" (L53) - Input label
- "Adgangskode" (L71) - Input label
- "Log ind" (L87) - Submit button text
- "Har du ikke en konto?" (L94) - Prompt text
- "Opret en konto" (L97-99) - Account creation link

## Signup Page

_Source: src/exam-simulator/pages/Signup.tsx_

- "Opret en konto" (L58-60) - Page heading
- "Fulde navn" (L73) - Input label
- "Email adresse" (L92) - Input label
- "Adgangskode" (L110) - Input label
- "Skole (Fx KEA eller DTU)" (L128) - Input label
- "Uddannelsesnavn (Fx Datamatiker)" (L146-147) - Input label
- "Semester" (L164) - Input label
- "Er du studerende?" (L183-185) - Checkbox label
- "Opret konto" (L194) - Submit button text
- "Har du allerede en konto?" (L201) - Prompt text
- "Log ind" (L204) - Login link

## Dashboard

_Source: src/exam-simulator/pages/Dashboard.tsx_

- "Start Simulator" (L206-208) - Button text on exam cards
- "Ingen eksamener fundet." (L235-237) - Empty state heading
- "Opret din første eksamenssimulator for at komme i gang med at teste dine studerende." (L239-242) - Empty state description
- "Opret Din Første Simulator" (L249-251) - Empty state button
- "Dine Eksamener" (L304-306) - Dashboard heading
- "Søg i eksamener..." (L333) - Search input placeholder
- "Ingen simulatorer matcher din søgning. Prøv et andet søgeord eller ryd din søgning." (L355-358) - No search results message
- "Ryd Søgning" (L360-362) - Clear search button
- "Kopier Link" (L99) - Copy link option in card menu

## Exam Editor

_Source: src/exam-simulator/pages/ExamEditor.tsx_

- "Rediger Eksamen" / "Opret Eksamen" (L178-179) - Page heading (conditional)
- "Tilbage til dashboard" (L170) - Back button aria label
- "Er du sikker på, at du vil slette denne eksamen?" (L143) - Delete confirmation message
- "Eksamen opdateret!" (L113) - Success toast message
- "Eksamen oprettet!" (L136) - Success toast message
- "Eksamen slettet!" (L159) - Delete success message

## AI Examiner Components

_Source: src/exam-simulator/components/ai-examiner/AIExaminer.tsx_

The AIExaminer component doesn't contain much static UI text, as it primarily:

- Displays the student task (dynamically loaded content)
- Shows a loading skeleton when content is loading
- Manages the audio response from the AI examiner

## Loading Animation

_Source: src/exam-simulator/components/ui/LoadingAnimation.tsx_

- "Preparing your exam content" (L49) - Loading text displayed when preparing exam content
