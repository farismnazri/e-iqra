# Draft articulation viewer

The owner requested this integration on 23 October 2026. It adds a modal to
single-unit introductory reading cells in the current Chapter 1 and Chapter 2
drafts: 84 vowelled cells representing 28 consonants. Mixed/separated drills and
Write mode have no information action. No curriculum, exercise IDs, learner
state, audio readiness or approval status changes are part of this integration.

## Structure and source

- `src/articulation/letters.ts`: maps actual Arabic glyphs to source letter IDs.
- `letterPoses.ts`: only names, source poses and source articulation landmarks.
- `ArticulationDialog.tsx`: accessible native modal, lazy loading, scroll lock,
  Escape/close control, focus restoration and a WebGL fallback.
- `viewer.ts`: renderer/camera/lights, source spring transition, reduced motion,
  responsive sizing and resource ownership/disposal.
- `model/geometry.js`, `model/anatomy.js`, `model/textures.js`: module-safe
  adaptations of the supplied procedural source, with a typed anatomy boundary.
  Internal upstream anatomical identifiers are retained to avoid transcription
  errors. These English filenames replace geometri/anatomi/tekstur.

Source: [Makhraj 3D](https://makhraj3d.ebooksunnah.com/), creator/contact supplied
as **ms@ebooksunnah.com**. The owner-supplied ZIP contains five source files and
a README; it is not a complete website. Its app.js was inspected for model,
lighting and animation integration. The original interface, letter selector,
quizzes, cues, effects, audio, telemetry and service worker are not imported.
No missing instructional cue/effect sequence is recreated.

The source data credits *Makharijul Huruf dan Sifat-Sifatnya*, Qothrunnadaa
Learning Centre, revised edition. This integration retains that attribution in
`public/licenses/Makhraj-3D-NOTICE.txt`, which Vite copies into build output.
Three.js's MIT notice is separately included in `public/licenses/Three-LICENSE.txt`.

## Pronunciation boundaries — pending qualified teacher review

- The workbook's Alif-labelled **أَ / إِ / أُ** map to **Hamzah**, not the source
  long-vowel Alif. Bare long-vowel Alif is deliberately not eligible through the
  consonant glyph map. Existing curriculum labels/text are unchanged.
- Consonantal Waw and Ya use their supplied consonant poses. Short vowels,
  vowel transitions, contextual Ra/Lam thickness, releases, trills, airflow and
  vocal-fold action are not modelled. All three short-vowel cells for a consonant
  intentionally share a labelled draft consonant position.
- Distinct glyph mapping preserves ث → tsa, ط → tha, ذ → dzal, ظ → zha,
  ح → ha-h, ه → ha, ش → syin, ض → dhad and غ → ghain. English names follow the
  workbook vocabulary; emphatic/pharyngeal/glottal qualifiers disambiguate names.
- The anatomy supports tongue/lip/velum/epiglottis spring deformation. It has no
  pose-controlled glottis. Hamzah and glottal Ha therefore show the supplied
  throat landmark and base tongue pose, without invented vocal-fold animation.
  Cream-edged warm-gold targets mark the supplied landmark coordinates. Their
  halos breathe gently every 1.6 seconds; reduced motion keeps them static.
- Geometry is a stylised cutaway supplied by the source creator. Fidelity to its
  supplied values is not a claim of anatomical or pedagogical approval.

## Loading and lifecycle

Only the small mapping and dialog shell load with the reader. The viewer,
procedural modules and Three.js load by dynamic import on opening. Geometry and
canvas textures are created for each popup, not retained between opens. One
finite spring transition settles to the exact supplied target, then animation
frames stop updating the anatomy. Only the marker halo continues at up to
30 redraws per second. Reduced motion snaps directly to the target and stops
animation frames. Standard materials,
100-pixel-per-unit cutaway texture, no shadow passes and capped pixel ratio
reduce GPU work. A resize redraws the settled scene without cropping.

Closing or a WebGL context failure cancels animation, disconnects the observer,
removes listeners, disposes unique geometries/materials/textures and renderer,
releases the context and removes the canvas. Import/initialisation/shader failures
show a readable fallback. The modal has no audio code or progress writes.

## Release conditions still to confirm

The ZIP README says the owner reports permission, but includes no written terms.
Confirm exact code/data reuse and redistribution scope, modifications,
attribution wording/placement, source disclosure and public hosting/publication
conditions with the creator. Confirm any underlying ebook/illustration/data
rights as necessary. Do not apply Three.js's MIT license to the supplied code or
educational material. Public educational release also requires qualified teacher
review of the mappings, landmarks and anatomy.

## Verification record — 23 October 2026

- Targeted source/mapping check covers all 84 introductory cells / 28 consonants,
  matches every used pose and landmark against the supplied data-huruf.js,
  excludes separated drills, and distinguishes Hamzah from long Alif.
- Geometry smoke check runs every supported pose through the source springs and
  immediate positioning and checks all mesh vertex coordinates remain finite.
  Its no-op 2D surface checks deformation only, not texture pixels or WebGL.
- `npm run typecheck`, `npm run build` and `git diff --check` pass. Vite reports
  a chunk-size warning for the dynamically loaded viewer (605.18 kB minified /
  156.57 kB gzip); the initial reader does not load that chunk.
- Local browser: Ba lip pose and Chapter 2 Ghayn render; Escape restores the information button;
  a checked tick remains checked and all Sound controls remain disabled.
- Responsive browser frames: 390 × 844 mobile and 820 × 1180 iPad-sized views;
  mobile close preserves scrollY exactly (400 → 400), retains the tick and removes
  the rendering canvas. Reduced-motion Ta renders the raised tongue pose.
- Simulated WebGL context loss removes the canvas and shows the fallback while
  the learner can still close the popup. Physical mobile/iPad GPU performance,
  screen-reader/device testing and qualified teacher review remain outstanding.

Marker follow-up: a cream-edged warm-gold target replaces the small green ring.
Only the halo breathes (1.6-second cosine cycle, 20% scale range); its centre
retains the exact source landmark. Verified Ta (tongue), Ba (lips), and Hamzah
(throat) in mobile/iPad-sized browser frames, plus static reduced-motion display.
All marker meshes use the existing viewer cleanup. Typecheck/build and diff
checks pass; the existing lazy-viewer chunk-size warning remains.
