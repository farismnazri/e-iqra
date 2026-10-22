# Iqra (اقرأ)

A calm, free, self-guided Quranic Arabic reading workbook for adult beginners. **Prototype v0.1** is a local visual and interaction prototype, not a published or educationally verified course.

## Run locally

Use Node.js **22.12 or newer** and npm (verified with Node 26.3.0 / npm 11.16.0).

```sh
npm ci
npm run dev
```

Open the Local URL printed by Vite, normally `http://127.0.0.1:5173/`. Stop the server with Ctrl+C.

```sh
npm run typecheck   # TypeScript checks
npm run build       # Type checks and production build into dist/
npm run preview     # Serve the production build locally
```

The app uses Vite, React, TypeScript, React Router, plain CSS and Lucide icons. Noto Naskh Arabic and Nunito Sans are self-hosted through Fontsource; no external font or audio service is required. No backend, accounts, database or cloud synchronization is configured.

## Prototype views

| Route | Behavior |
| --- | --- |
| `/` | Paper cover, Iqra identity and Start Reading |
| `/chapters` | Chapter 1; resumes the last page opened during this session |
| `/learn?page=1` | Two deterministic draft pages; reversible confidence ticks, disabled Sound, page picker and visited-page-only review |
| `/learn/write?page=1` | Freehand canvas, reference form, Clear, Next Letter and Back to Reading |

A first exercise takes two taps: Start Reading → Start Chapter. Reading uses right item → left item → next row on wide screens; phones below 651px preserve that source order in one column. Each exercise has only Sound and Tick; Write is page-level.

All progress is **in-memory and temporary**: ticks and chapter resume survive navigation, but reload resets them. Drawings disappear when leaving Write or changing its reference form. Returning from Write restores the reader page, scroll and focus, preserving ticks. The page query parameter remains usable on direct visits or reloads.

## Content and implementation boundaries

- Only Alif and Ba with fathah appear in these original, unreviewed UI samples. Separated sequences are practice units, not Quran quotations. The proposed three-vowel curriculum expansion has not been assumed approved.
- Reference and tracing forms are explicitly draft/unreviewed. Qualified teacher review and owner approval remain required before educational publication.
- Sound stays disabled because there are no approved recordings. There is no TTS fallback. Page sounds remain off; no sound assets or toggle are supplied in this version.
- No account invitation, authentication, admin tools, persistent storage, PWA installation or later-chapter content is implemented.

`src/content.ts` holds deterministic content, `src/audio.ts` holds audio readiness, and `src/state.tsx` holds temporary learner state. `src/App.tsx` holds the four route views, `src/DrawingCanvas.tsx` handles pointer drawing and resize, `src/Artwork.tsx` supplies original SVG decoration, and `src/styles.css` defines reusable tokens and responsive layouts.

## Review and verification

There is no automated browser test suite yet. Use `npm run typecheck` and `npm run build` for the available local checks. The application is an unpublished prototype; validate Arabic rendering, accessibility and touch/pen behavior before any release.

Internal project planning, curriculum drafts, visual references, agent instructions and development review notes remain local and are excluded by `.gitignore`.

## Licensing

A project-wide license has not been selected. Original illustration source is included in this prototype. Bundled fonts use SIL OFL 1.1, and Lucide uses ISC; full notices are included in `public/licenses/` and copied to production output by Vite. Package dependencies retain their upstream licenses. Do not assume code, curriculum, recordings or owner reference artwork are cleared for publication or redistribution.
