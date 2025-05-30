# UI Text Content

This document catalogs all user-facing text content from the Code Review Simulator application. Each text entry includes a reference to its source file and approximate line number.

## Navigation & Layout

_Source: src/exam-simulator/layout/Layout.tsx_

### Header

- "CodeReview" (L33) - Brand name in header
- "Opret" (L48) - Create navigation item
- "Oversigt" (L55) - Overview navigation item
- "Log ud" (L62) - Log out button
- "Log ind" (L73) - Log in navigation item
- "Opret konto" (L80) - Create account navigation item

### Footer

- "Prototype i beta. Kontakt Martin Gundtoft for spørgsmål (marg@kea.dk)" (L97-100)

## Landing Page

_Source: src/exam-simulator/pages/LandingPage.tsx_

### Hero Section

- "Code review træning der virker" (L24-26) - Main headline
- "Træn dit code review med en AI du kan snakke med" (L27-29) - Subheading

### Example Code Review Card

- "Algoritmer og Datastrukturer" (L46-48) - Example code review title
- "10 min" (L49) - Duration
- "Algoritmer og datastrukturer" (L74-76) - Learning goal
- "Big O" (L94) - Learning goal
- "Sorteringsalgoritmer" (L112-114) - Learning goal

### Benefits Section

- "Træn som til et rigtigt code review" (L136-138) - Section heading
- "Forbered dig optimalt med realistiske code review scenarier" (L139-141) - Section subheading

#### Benefit Cards

1. First card

   - "Snak som i et rigtigt code review" (L160-162) - Title
   - "Del din skærm og gå til code review ved en AI reviewer der både forstår og udfordrer dig" (L163-166) - Description

2. Second card

   - "Tilpasset din kodebase" (L186-188) - Title
   - "Din leder har oprettet et code review, der minder så meget om et rigtigt code review som muligt" (L189-192) - Description

3. Third card
   - "Detaljeret feedback og evaluering" (L212-214) - Title
   - "Få personlig feedback og en evaluering og lær af dine fejl for at forbedre din præstation." (L215-218) - Description

### Testimonial Section

- "Man kan jo bare snakke med AI'en! Det føles virkelig som at deltage i et rigtigt code review, men i trygge rammer, hvor ingen dømmer mig" (L235-239) - Quote
- "Hansi Hansson" (L241) - Person name
- "Softwareudvikler, Københavns Universitet" (L242-244) - Person title

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
- "Firma (Fx Google eller Spotify)" (L128) - Input label
- "Jobtitel (Fx Softwareudvikler)" (L146-147) - Input label
- "Erfaringsniveau" (L164) - Input label
- "Er du udvikler?" (L183-185) - Checkbox label
- "Opret konto" (L194) - Submit button text
- "Har du allerede en konto?" (L201) - Prompt text
- "Log ind" (L204) - Login link

## Dashboard

_Source: src/exam-simulator/pages/Dashboard.tsx_

- "Start code review" (L206-208) - Button text on code review cards
- "Ingen code reviews fundet." (L235-237) - Empty state heading
- "Opret dit første code review for at komme i gang med at teste dine udviklere." (L239-242) - Empty state description
- "Opret dit første code review" (L249-251) - Empty state button
- "Dine code reviews" (L304-306) - Dashboard heading
- "Søg i code reviews..." (L333) - Search input placeholder
- "Ingen simulatorer matcher din søgning. Prøv et andet søgeord eller ryd din søgning." (L355-358) - No search results message
- "Ryd Søgning" (L360-362) - Clear search button
- "Kopier Link" (L99) - Copy link option in card menu

## Code Review Editor

_Source: src/exam-simulator/pages/ExamEditor.tsx_

- "Rediger code review" / "Opret code review" (L178-179) - Page heading (conditional)
- "Tilbage til dashboard" (L170) - Back button aria label
- "Er du sikker på, at du vil slette dette code review?" (L143) - Delete confirmation message
- "Code review opdateret!" (L113) - Success toast message
- "Code review oprettet!" (L136) - Success toast message
- "Code review slettet!" (L159) - Delete success message

## AI Reviewer Components

_Source: src/exam-simulator/components/ai-examiner/AIExaminer.tsx_

The AIReviewer component doesn't contain much static UI text, as it primarily:

- Displays the developer task (dynamically loaded content)
- Shows a loading skeleton when content is loading
- Manages the audio response from the AI reviewer

## Loading Animation

_Source: src/exam-simulator/components/ui/LoadingAnimation.tsx_

- "Forbereder dit code review indhold" (L49) - Loading text displayed when preparing code review content
