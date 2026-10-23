import { chapter2CurriculumVersion, units } from './content'
import type { Exercise, UnitId } from './content'

// Owner-supplied Chapter 2 sequence, authorized only as an educational draft.
// All Arabic, including the optional Write references, needs qualified teacher review.
const chapterId = 'draft-ch02'
const formsByText = new Map<string, UnitId>(Object.entries(units).map(([id, form]) => [form.text, id as UnitId]))

function draftPage(number: number, blockId: string, phase: 'introduce' | 'mix' | 'review', title: string, goal: string, sequences: string[], exerciseRevision = '') {
  const id = `${chapterId}-p${String(number).padStart(2, '0')}`
  const exercises: Exercise[] = sequences.map((sequence, index) => {
    const forms = sequence.split(' ').map(text => {
      const form = formsByText.get(text)
      if (!form) throw new Error(`Unknown Chapter 2 draft form: ${text}`)
      return form
    })
    return {
      id: `${id}-${exerciseRevision}e${String(index + 1).padStart(2, '0')}`,
      units: forms, curriculumVersion: chapter2CurriculumVersion, teacherStatus: 'unreviewed',
      kind: forms.length === 1 ? 'isolated_unit' : 'separated_units',
    }
  })
  return {
    id, blockId, phase, title, goal,
    curriculumVersion: chapter2CurriculumVersion, teacherStatus: 'unreviewed' as const,
    eligibleForms: [...new Set(exercises.flatMap(exercise => exercise.units))], exercises,
  }
}

const introduceGoal = 'Recognise six new isolated forms in fathah, kasrah, dammah order, then read four separated two-unit sequences using previously learned letters.'
const mixGoal = 'Read ten separated three-unit sequences combining the new pair with previously learned letters.'

// IDs belong to these fixed draft sequences; retain them only while content is unchanged.
// Exercise numbering in the shared reader remains 01–10 on every page.
export const chapter2Pages = [
  draftPage(1, 'H01', 'introduce', 'Kha & Ghayn', introduceGoal, [
    'خَ', 'خِ', 'خُ', 'غَ', 'غِ', 'غُ',
    'جَ حِ', 'عُ هَ', 'فِ كُ', 'بَ نُ',
  ]),
  draftPage(2, 'H01', 'mix', 'Kha & Ghayn — mixed vowels', mixGoal, [
    'خَ بُ نِ',
    'غِ تَ مُ',
    'حُ خِ دَ',
    'عَ غُ لِ',
    'خُ سِ فَ',
    'غَ يِ بُ',
    'مَ خَ هِ',
    'غُ نَ كِ',
    'جُ غِ حَ',
    'خِ عُ شَ',
  ]),
  draftPage(3, 'H02', 'introduce', 'Sad & Dad', introduceGoal, [
    'صَ', 'صِ', 'صُ', 'ضَ', 'ضِ', 'ضُ',
    'سَ دِ', 'خُ غَ', 'تِ ثُ', 'مَ لُ',
  ]),
  draftPage(4, 'H02', 'mix', 'Sad & Dad — mixed vowels', mixGoal, [
    'صَ بُ سِ',
    'ضِ دَ مُ',
    'صُ فَ لِ',
    'ضَ خِ نُ',
    'سُ صِ تَ',
    'دِ ضُ كَ',
    'صَ غُ يِ',
    'ضِ حَ بُ',
    'صُ عِ ضَ',
    'ضُ صِ مَ',
  ]),
  draftPage(5, 'H03', 'introduce', 'Ta & Za', introduceGoal, [
    'طَ', 'طِ', 'طُ', 'ظَ', 'ظِ', 'ظُ',
    'تَ ذِ', 'صُ ضَ', 'بُ خِ', 'غُ فَ',
  ]),
  draftPage(6, 'H03', 'mix', 'Ta & Za — mixed vowels', mixGoal, [
    'طَ بُ تِ',
    'ظِ ذَ مَ',
    'طُ لِ فَ',
    'ظَ نُ خِ',
    'تَ طِ سُ',
    'ذِ ظُ ضَ',
    'طَ صِ كُ',
    'ظِ غَ هُ',
    'طُ عَ بُ',
    'ظُ صَ طِ',
  ]),
  draftPage(7, 'H04', 'introduce', 'Qaf & Ra', introduceGoal, [
    'قَ', 'قِ', 'قُ', 'رَ', 'رِ', 'رُ',
    'كَ لِ', 'صُ ضَ', 'طِ ظُ', 'غَ خِ',
  ]),
  draftPage(8, 'H04', 'mix', 'Qaf & Ra — mixed vowels', mixGoal, [
    'قَ بُ كِ',
    'رِ تَ مِ',
    'قُ خِ سَ',
    'رَ نُ فِ',
    'كَ قِ طُ',
    'رُ ضَ بَ',
    'قَ صِ رِ',
    'رَ غُ قِ',
    'رُ ظَ لِ',
    'قُ يَ رِ',
  ]),
  // Rewritten content gets fresh IDs; retired review ticks/ink must not transfer.
  draftPage(9, 'R01', 'review', 'Cumulative mixed reading', 'Read separated three-unit sequences covering each of the 24 new letter-vowel forms exactly once.', [
    'خَ بُ غِ',
    'صُ ضَ تِ',
    'نَ طِ ظُ',
    'قَ مِ رِ',
    'غُ خِ سَ',
    'فُ ضِ صَ',
    'ظَ قِ طُ',
    'رُ غَ خُ',
    'طَ ضُ صِ',
    'قُ ظِ رَ',
  ], 'v2-'),
]
