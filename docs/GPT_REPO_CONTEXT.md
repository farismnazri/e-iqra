# Iqra — repository context for ChatGPT Web

Last refreshed: 2026-10-23

This is compact repository knowledge for ChatGPT Web retrieval when preparing Codex tasks without full filesystem access. It is not a Codex instruction file, a replacement for repository instructions, a README, or prompt-writing policy. Generated Codex prompts should not normally ask Codex to read it.

## Product and authority

Iqra (اقرأ) is an unpublished, free Quranic-Arabic reading-workbook prototype for adult beginners and reverts. The live application is a Vite/React/TypeScript single-page app; it has no backend, account system, database, sync, deployment configuration, or PWA setup.

- `AGENTS.md` is the operational instruction source. `IQRA_PROJECT_GUIDE.md` is local draft product/curriculum authority; both the guide and visual references are intentionally ignored. `README.md` explains setup, while `MAKHRAJ_3D.md` records the imported-model attribution, limits, and release conditions.
- The owner approved the Chapter 1 three-short-vowel implementation on 2026-10-22. All Arabic teaching material, tracing references, pronunciation mappings, and audio remain unreviewed for educational publication.
- Source currently exposes three draft chapters. The local guide still describes Chapters 2–3 as planning-only, while committed source/README describe Chapter 2 as an owner-authorized draft and `src/chapter3.ts` calls Chapter 3 owner-authorized. Treat that approval-status conflict as a decision to resolve; do not claim teacher approval or publish any chapter.
- Reading is primary. Self-checks and Write are optional and independent. Do not introduce compulsory tests, AI grading, streaks/gamification, TTS, or unapproved audio. A future Teacher Studio must use owner-only server authorization.

## Application structure and learner experience

| Path | Actual role |
| --- | --- |
| `src/main.tsx` | Router, prototype-state provider, local font and CSS imports. |
| `src/App.tsx` | `/` landing, `/chapters` library, shared `/learn` reader, and legacy `/learn/write` redirect into inline Write mode. |
| `src/chapters.ts` | Chapter registry and query helpers. Legacy links without `chapter` select Chapter 1; `chapter=2` and `chapter=3` select the other draft chapters. |
| `src/content.ts`, `src/chapter2.ts`, `src/chapter3.ts` | Chapter content and stable draft exercise IDs. Chapter 3 has positional-form and joining/word exercise types. |
| `src/state.tsx` | Session-only learner state, keyed by stable exercise ID and chapter. |
| `src/DrawingCanvas.tsx`, `src/PositionalForms.tsx` | Pointer/pen drawing and Chapter 3 shape-reference rendering. |
| `src/audio.ts` | Approved-only audio policy; all audio is currently unavailable. |
| `src/articulation/` | Lazy-loaded, draft Makhraj 3D modal and adapted procedural model. |

The library exposes Chapters 1–3 and shows Chapters 4–6 as coming soon. The reader preserves source order: on wide layouts, right item then left item then next row; on narrow layouts, the same logical order is one column. The page-level Write/Done toggle retains page, scroll position, exercise checks, and strokes during navigation within the current session. Reading and writing checks are separate reversible booleans; Clear deletes only that exercise's ink. “Go to next practice” considers the active mode's unchecked exercises on visited pages in the active chapter. Reload clears all state.

## Draft content state

- Chapter 1 (`draft-ch01`): 22 pages / 220 exercises. Ten A/B cycles introduce the Alif-labelled group and 19 light consonants with fathah, kasrah, and dammah, followed by two separated-unit reviews. It is `ch01-three-vowels-draft-v0.5-unreviewed`; drills are not Quran quotations.
- Chapter 2 (`draft-ch02`): 9 pages / 90 exercises. Four heavy-letter/Ra A/B cycles for خ/غ, ص/ض, ط/ظ, and ق/ر, then a review; it is `ch02-three-vowels-draft-v0.1-unreviewed`. Retired Chapter 2 page 10 redirects to page 9. All content is unreviewed.
- Chapter 3 (`draft-ch03`): 12 pages of joining/positional-shape references, constructed combinations, and source-linked three-letter words. The source marks it `ch03-joining-draft-v0.1-unreviewed`; word occurrence metadata is not recitation, orthography, or educational approval. It needs owner and qualified-teacher review before any public use.
- Stable IDs—not page positions—own progress and drawings. Preserve deliberate unchecks. Do not quietly migrate checks when revising educational content.

## Visuals, dependencies, and articulation viewer

`src/Artwork.tsx` renders the supplied landing layers from `public/images/landing/`; `src/styles.css` contains the paper UI, responsive layouts, Write state, positional references, modal styles, focus treatment, and reduced-motion rules. Local Noto Naskh Arabic and Nunito Sans come from Fontsource; Lucide provides icons.

The draft information button appears only on isolated single-unit reading cells in Chapters 1–2. It dynamically imports Three.js and `src/articulation/viewer.ts`, opens an accessible native dialog, restores focus/scroll on close, supports reduced motion, and shows a textual fallback for WebGL/import failures. It does not change audio, learner progress, curriculum IDs, or approval status. `MAKHRAJ_3D.md` and `public/licenses/Makhraj-3D-NOTICE.txt` retain source/rights caveats; written reuse and redistribution terms plus qualified teacher review remain release blockers. `public/licenses/Three-LICENSE.txt` covers Three.js only.

## Commands and verification

Use Node >=22.12 with the committed npm lockfile. `npm run dev` runs Vite on `0.0.0.0`; `npm run preview` uses loopback. `npm run typecheck` runs `tsc --noEmit`; `npm run build` runs typecheck then production Vite build; no automated test or lint script exists. `git diff --check` is the whitespace check. The 2026-10-23 production build passed, with a Vite warning for the lazy 3D-viewer chunk (about 605 kB minified / 157 kB gzip); it is separate from the initial bundle.

## Current gaps and handoff cautions

1. Verify the Chapter 2–3 authorization conflict against current owner direction; all instructional content, tracing, pronunciation mappings, and word use remain draft/unreviewed regardless of what source exposes.
2. No persistence, accounts, migration, approved recordings, or Teacher Studio exists. Preserve the no-TTS and server-authorization requirements when those are eventually designed.
3. Before release, validate Arabic rendering, keyboard/screen-reader and touch/Pencil behavior on target devices; confirm Makhraj 3D reuse/redistribution rights and review its educational mappings. `README.md` currently understates source availability by saying only Chapters 1–2 are available; resolve that documentation inconsistency in a separately authorized edit.

## Context maintenance

Refresh this file from executable configuration and current source after meaningful changes. Keep prompt-construction policy in `docs/CODEX_PROMPT_RULES.md`; do not create duplicate context or prompt-rule files.
