# Iqra (اقرأ)

A calm, free, self-guided Quranic Arabic reading workbook for adult beginners. **Prototype v0.1** is a local visual and interaction prototype, not a published or educationally verified course.

## Run locally

Use Node.js **22.12 or newer** and npm (verified with Node 26.3.0 / npm 11.16.0).

```sh
npm ci
npm run dev
```

Open the Local URL printed by Vite, normally `http://localhost:5173/`. Development binds to `0.0.0.0`, so devices on the same local network can use the Network URL printed at startup. Vite detects the network address and available port automatically. Stop the server with Ctrl+C. Preview and production build behaviour are unchanged.

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
| `/chapters` | Six-book library; Chapters 1–2 independently resume this session, Chapters 3–6 show coming-soon dialogs |
| `/learn?page=1` | 22 deterministic draft pages; inline Write/Done mode, separate reversible Reading/Writing ticks, page picker and mode-aware visited-page review |
| `/learn?chapter=2&page=1` | Chapter 2: 9 draft pages / 90 exercises using the same reader and optional Write interaction; retired page 10 links redirect to page 9 |
| `/learn/write?page=1` | Legacy link redirects to page 1 of the reader in inline writing mode |

A first exercise takes two taps: Start Reading → Iqra 1. Reading uses right item → left item → next row on wide screens; phones below 651px preserve that source order in one column. The page-level Write/Done toggle keeps the reader open. Each exercise has Sound / Tick in reading mode and Tick / Clear in writing mode, with a faint Arabic reference for tracing.

All progress is **in-memory and temporary**: separate `readingChecked` and `writingChecked` booleans and drawings are stored by stable, chapter-specific exercise ID. Each chapter retains its own last page, visited pages and mode. Both self-checks and handwriting survive mode changes and page/chapter navigation during the session; reload resets them. Clear erases only that exercise's ink and leaves both ticks unchanged; drawing never ticks automatically. Next practice uses the active mode's unchecked exercises on visited pages within the current chapter. Switching modes keeps the page, scroll and toggle focus. The chapter and page query parameters remain usable on direct visits or reloads; links without a chapter parameter retain Chapter 1 behavior.

## Content and implementation boundaries

- The owner explicitly adopted the three-vowel Chapter 1 plan on 22 October 2026, superseding the earlier fathah-only scope. The draft has 22 pages / 220 exercises: ten fixed two-page learning cycles plus two cumulative reading reviews, covering the Alif-labelled group and 19 light consonants with fathah, kasrah and dammah (60 forms). Each form is introduced alone before separated/unjoined sequences. These drills are not Quran quotations. Joining and advanced marks remain deferred.
- On 23 October 2026 the owner authorized the supplied Chapter 2 sequence as an unreviewed educational draft: خ/غ, ص/ض, ط/ظ and ق/ر with all three short vowels (24 new forms). Its revised 9 pages / 90 exercises use four A/B cycles and a final three-unit reading review covering all 24 forms exactly once, alongside six distinct familiar forms. Page A has six isolated new forms then four familiar two-unit exercises; Page B has ten three-unit exercises. Introductory single-letter reading cells have a draft articulation popup; no chapter-wide pronunciation theory is implemented.
- Retained exercises keep their original IDs (including historical page prefixes and `v3-eNN` suffixes) when moved between display pages; page positions do not define exercise identity. Confidence state must never be reassigned by exercise position. Curriculum version and unreviewed status are recorded in `src/content.ts`.
- Reference and tracing forms are explicitly draft/unreviewed. Qualified teacher review and owner approval remain required before educational publication.
- Sound stays disabled because there are no approved recordings. There is no TTS fallback. Page sounds remain off; no sound assets or toggle are supplied in this version.
- No account invitation, authentication, admin tools, persistent storage, PWA installation or Chapter 3–6 content is implemented.

Each Chapter 1 two-page cycle keeps both new letters together: Page A starts with six isolated forms (fathah, kasrah, dammah for each letter), followed by four separated three-unit drills. Page B contains ten separated three-unit drills using introduced forms, including the new pair. The existing introduction order is unchanged. Pages 21–22 provide cumulative reading review. Every page has ten exercises; retained drills keep their IDs and new sequences use `v5-eNN` suffixes. Chapter 2 IDs use the separate `draft-ch02-pNN-eNN` namespace; rewritten final-page exercises use `draft-ch02-p09-v2-eNN` so retired review checks and drawings cannot transfer. All curriculum and tracing remain draft/unreviewed.

`src/content.ts` holds Chapter 1 content and the shared unit registry; `src/chapter2.ts` holds the supplied Chapter 2 sequence; `src/chapters.ts` selects chapters and preserves legacy query URLs. `src/audio.ts` holds audio readiness, and `src/state.tsx` holds temporary learner state. `src/App.tsx` holds the three views and legacy Write redirect, `src/DrawingCanvas.tsx` handles pointer drawing and resize, `src/Artwork.tsx` supplies original SVG decoration, and `src/styles.css` defines reusable tokens and responsive layouts.

## Review and verification

There is no automated browser test suite yet. Use `npm run typecheck` and `npm run build` for the available local checks. The application is an unpublished prototype; validate Arabic rendering, accessibility and touch/pen behavior before any release.

Internal project planning, curriculum drafts, visual references, agent instructions and development review notes remain local and are excluded by `.gitignore`.

## Licensing

A project-wide license has not been selected. Original illustration source is included in this prototype. Bundled fonts use SIL OFL 1.1, and Lucide uses ISC; full notices are included in `public/licenses/` and copied to production output by Vite. Package dependencies retain their upstream licenses. Do not assume code, curriculum, recordings or owner reference artwork are cleared for publication or redistribution.

The introductory reading-cell pronunciation popup uses a lazy-loaded procedural Makhraj 3D model. See [the integration and release notes](MAKHRAJ_3D.md) for source attribution, draft mapping boundaries, verification and licensing terms still to confirm before publication.
