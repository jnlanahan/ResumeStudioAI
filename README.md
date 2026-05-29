# Resume Studio

Tailor your resume to any job posting. Wording tweaks only — never meaning, never new facts. Fixed format, every time.

## Getting started

```bash
npm install
npm run dev
```

Then open <http://localhost:3022>.

1. Visit **Settings** and paste your Anthropic API key. Get one at <https://console.anthropic.com/>.
2. Fill out **Master Profile** — your one source of truth (contact info, experience with bullets, skills, education).
3. Go to **Tailor**, paste a job description, click **Tailor resume**.
4. Review the diff to see exactly which words changed. Save to library, print to PDF, or copy as text.

## How it works

- Your master profile and the job description are sent directly to the Anthropic API. No backend, no analytics.
- The model is constrained to wording-only tweaks: meaning is preserved, no new metrics, no fabricated experience.
- The output uses a single fixed CSS template (8.5×11, prints to PDF cleanly via the browser).
- All data lives in `localStorage`. Clearing browser data wipes everything.

## Tech

Vite · React · TypeScript · Tailwind · Framer Motion · Zustand · `@anthropic-ai/sdk`.
