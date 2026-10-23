import { units } from '../content'
import type { Exercise } from '../content'
import { letterPoses } from './letterPoses'
import type { LetterId } from './letterPoses'

// Match actual Unicode letters, never the beginner-facing unit label or a source ID.
// In particular ث/ط and ه/ح have different source IDs; أ/إ represent Hamzah, not madd Alif.
const letterByGlyph: Readonly<Record<string, LetterId>> = {
  'أ': 'hamzah', 'إ': 'hamzah', 'ء': 'hamzah',
  'ب': 'ba', 'ت': 'ta', 'ث': 'tsa', 'ج': 'jim', 'ح': 'ha-h', 'خ': 'kha',
  'د': 'dal', 'ذ': 'dzal', 'ر': 'ra', 'ز': 'zay', 'س': 'sin', 'ش': 'syin',
  'ص': 'shad', 'ض': 'dhad', 'ط': 'tha', 'ظ': 'zha', 'ع': 'ain', 'غ': 'ghain',
  'ف': 'fa', 'ق': 'qaf', 'ك': 'kaf', 'ل': 'lam', 'م': 'mim', 'ن': 'nun',
  'ه': 'ha', 'و': 'wawu', 'ي': 'ya',
}

export function introductoryLetter(exercise: Exercise) {
  if (exercise.kind !== 'isolated_unit' || exercise.units.length !== 1) return null
  const glyph = units[exercise.units[0]].text.normalize('NFC').replace(/[\u064b-\u0652]/g, '')
  const id = letterByGlyph[glyph]
  return id ? { id, name: letterPoses[id].name } : null
}
