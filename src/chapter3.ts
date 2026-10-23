// Owner-authorized Chapter 3 educational draft. Shapes, reading and tracing are
// unreviewed. Source occurrence checks below are not educational approval.
export const chapter3CurriculumVersion = 'ch03-joining-draft-v0.1-unreviewed'
const chapterId = 'draft-ch03'

type DraftItem = {
  id: string
  curriculumVersion: typeof chapter3CurriculumVersion
  teacherStatus: 'unreviewed'
}
export type FormSample = {
  label: string
  text: string
  positions?: string
  context?: string
}
export type PositionalExercise = DraftItem & {
  kind: 'positional_forms' | 'joining_recognition'
  letter?: string
  title: string
  note?: string
  forms: FormSample[]
}
export type JoiningExercise = DraftItem & {
  kind: 'constructed_joining' | 'quran_attested_word'
  text: string
  source?: {
    verseReference: string
    wordPosition: number
    url: string
    sourceOrthography: string
    displayOrthography: string
    occurrenceCheckedOn: string
    // No recitation/standalone audio has been selected or approved.
    readingTradition: 'pending_teacher_review'
    standaloneReading: 'pending_teacher_review'
    adaptation: false
  }
}
export type Chapter3Exercise = PositionalExercise | JoiningExercise
type Chapter3Page = {
  id: string
  title: string
  goal: string
  phase: 'introduce' | 'mix' | 'review'
  layout: 'positional' | 'joining'
  curriculumVersion: typeof chapter3CurriculumVersion
  teacherStatus: 'unreviewed'
  exercises: Chapter3Exercise[]
}

// Standard alphabet order, independent of Chapter 1–2's teaching order.
const alphabet = [
  ['ا', 'Alif'], ['ب', 'Ba'], ['ت', 'Ta'], ['ث', 'Tha'], ['ج', 'Jim'],
  ['ح', 'Ha (ح)'], ['خ', 'Kha'], ['د', 'Dal'], ['ذ', 'Dhal'], ['ر', 'Ra'],
  ['ز', 'Zay'], ['س', 'Sin'], ['ش', 'Shin'], ['ص', 'Sad'], ['ض', 'Dad'],
  ['ط', 'Ta (ط)'], ['ظ', 'Za (ظ)'], ['ع', 'Ayn'], ['غ', 'Ghayn'], ['ف', 'Fa'],
  ['ق', 'Qaf'], ['ك', 'Kaf'], ['ل', 'Lam'], ['م', 'Mim'], ['ن', 'Nun'],
  ['ه', 'Ha (ه)'], ['و', 'Waw'], ['ي', 'Ya'],
] as const
const nonJoining = new Set(['ا', 'د', 'ذ', 'ر', 'ز', 'و'])
const draft = { curriculumVersion: chapter3CurriculumVersion, teacherStatus: 'unreviewed' } as const
const pageId = (number: number) => `${chapterId}-p${String(number).padStart(2, '0')}`

function letterForms(letter: string, name: string): PositionalExercise {
  const cannotJoinNext = nonJoining.has(letter)
  return {
    ...draft, id: `${chapterId}-v1-forms-${letter.codePointAt(0)!.toString(16)}`,
    kind: 'positional_forms', letter, title: name,
    note: cannotJoinNext
      ? 'Does not join the next letter. Position and connection are different.'
      : undefined,
    // Natural Unicode letters + tatweel expose only valid joining sides.
    // Alif is an unvowelled shape reference, never a short-vowel reading unit.
    forms: cannotJoinNext ? [
      { label: 'Unjoined', positions: 'Start · middle · end', text: letter },
      { label: 'Joined before', positions: 'Middle · end', text: `ـ${letter}`,
        context: letter === 'ا' ? undefined : `بَ${letter}َبَ · بَ${letter}َ` },
    ] : [
      { label: 'Isolated', text: letter },
      { label: 'Initial', text: `${letter}ـ` },
      { label: 'Medial', text: `ـ${letter}ـ` },
      { label: 'Final', text: `ـ${letter}` },
    ],
  }
}

const recognition: PositionalExercise[] = [
  { ...draft, id: `${chapterId}-v1-recognise-ba`, kind: 'joining_recognition',
    title: 'Find Ba in each position', note: 'Compare the same letter in each shape.',
    forms: [
      { label: 'Isolated', text: 'ب' },
      { label: 'Initial', text: 'بـ', context: 'بَتَ' },
      { label: 'Medial', text: 'ـبـ', context: 'تَبَتَ' },
      { label: 'Final', text: 'ـب', context: 'تَبَ' },
    ] },
  { ...draft, id: `${chapterId}-v1-recognise-joining-break`, kind: 'joining_recognition',
    title: 'Compare the joining', note: 'Ba joins the next letter; Dal does not.',
    forms: [
      { label: 'Connected', text: 'بَتَ' },
      { label: 'Break after Dal', text: 'دَتَ' },
      { label: 'Joined to Dal', text: 'بَدَ' },
    ] },
]

function positionalPage(number: number): Chapter3Page {
  const items = alphabet.slice((number - 1) * 5, number * 5).map(([letter, name]) => letterForms(letter, name))
  return {
    ...draft, id: pageId(number), phase: 'introduce', layout: 'positional',
    title: 'Joining Arabic letters — positional forms',
    goal: 'Compare shapes from right to left. A letter’s position and whether it joins are different. Unvowelled letters here are shape references only.',
    exercises: number === 6 ? [...items, ...recognition] : items,
  }
}

// Exact single-word occurrences checked against Quran.com's text_uthmani word
// data on 2026-10-23. Keep full vowels as reading targets, not a waqf lesson.
// No prefixes, untaught signs, or source spelling changes have been removed.
const wordSources: [text: string, verse: string, word: number][] = [
  ['كَسَبَ', '2:81', 3], ['عَبَسَ', '80:1', 1], ['حَسَدَ', '113:5', 5],
  ['كُتِبَ', '2:183', 4], ['خَلَقَ', '55:3', 1], ['جَعَلَ', '16:72', 2],
  ['حَمَلَ', '20:111', 8], ['سَمِعَ', '58:1', 2], ['بَلَغَ', '18:90', 3],
  ['شَهِدَ', '3:18', 1],
  ['ضَرَبَ', '14:24', 4], ['نَظَرَ', '74:21', 2], ['قُتِلَ', '3:144', 13],
  ['بَخِلَ', '92:8', 3], ['وَرَدَ', '28:23', 2], ['تَرَكَ', '16:61', 7],
  ['دَخَلَ', '3:37', 11], ['نَزَلَ', '26:193', 1], ['صَدَقَ', '3:95', 2],
  ['ذَهَبَ', '2:17', 10],
]

function joiningPage(number: number, title: string, goal: string, texts: string[]): Chapter3Page {
  const id = pageId(number)
  return {
    ...draft, id, title, goal, phase: number === 12 ? 'review' : 'mix', layout: 'joining',
    exercises: texts.map((text, index): JoiningExercise => {
      const occurrence = wordSources.find(([word]) => word === text)
      return {
        ...draft, id: `${id}-v1-e${String(index + 1).padStart(2, '0')}`, text,
        kind: occurrence ? 'quran_attested_word' : 'constructed_joining',
        source: occurrence ? {
          verseReference: occurrence[1], wordPosition: occurrence[2],
          url: `https://quran.com/${occurrence[1].replace(':', '/')}`,
          sourceOrthography: text, displayOrthography: text,
          occurrenceCheckedOn: '2026-10-23', readingTradition: 'pending_teacher_review',
          standaloneReading: 'pending_teacher_review', adaptation: false,
        } : undefined,
      }
    }),
  }
}

// IDs identify these exact v1 samples. Revise IDs when altering any sample.
export const chapter3Pages: Chapter3Page[] = [
  ...Array.from({ length: 6 }, (_, i) => positionalPage(i + 1)),
  joiningPage(7, 'Letters that do not join the next letter',
    'Compare normal joining with breaks after ا د ذ ر ز و. A gap inside a sequence does not necessarily begin a new word. Alif examples use the familiar hamzah-on-alif short-vowel forms.', [
      'بَأَ', 'أَبَ', 'بَدَ', 'دَبَ', 'بَذَ', 'بَرَ', 'رَبَ', 'بَزَ', 'بَوَ', 'وَبَ',
    ]),
  joiningPage(8, 'Two-letter combinations — connected pairs',
    'Read connected pairs from right to left, with familiar short vowels.', [
      'بِتَ', 'تُثِ', 'جَحُ', 'حِخَ', 'سُشِ', 'صَضُ', 'طِظَ', 'عُغِ', 'فَقُ', 'كِلَ',
    ]),
  joiningPage(9, 'Two-letter combinations — mixed joining',
    'Compare connected pairs and pairs with a break after a non-joining letter.', [
      'لُمِ', 'نَهُ', 'يِبَ', 'ثُقِ', 'غَفُ', 'دِجَ', 'ذُخِ', 'رَسُ', 'زِصَ', 'وُطِ',
    ]),
  joiningPage(10, 'Three-letter words — connected forms',
    'Read short words with three connected letters and only familiar short vowels.',
    wordSources.slice(0, 10).map(([text]) => text)),
  joiningPage(11, 'Three-letter words — varied joining',
    'Read short words with connected forms and natural breaks inside the sequence.',
    wordSources.slice(10).map(([text]) => text)),
  joiningPage(12, 'Optional mixed reading review',
    'Optional, ungraded practice with familiar two- and three-letter combinations. No new reading rules.', [
      'هُيَ', 'ضِمَ', 'رُفَ', 'ذِكُ', 'وَغِ', 'نَشِطَ', 'فَهِمَ', 'زُرِعَ', 'طَلَبَ', 'وَجَدَ',
    ]),
]
