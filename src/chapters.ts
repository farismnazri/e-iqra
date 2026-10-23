import { chapterId, pages } from './content'
import { chapter2Pages } from './chapter2'
import { chapter3Pages } from './chapter3'

export const chapters = {
  'draft-ch01': { id: chapterId, number: 1, pages },
  'draft-ch02': { id: 'draft-ch02', number: 2, pages: chapter2Pages },
  'draft-ch03': { id: 'draft-ch03', number: 3, pages: chapter3Pages },
} as const

export type ChapterId = keyof typeof chapters
export type Chapter = typeof chapters[ChapterId]

// Existing links without a chapter parameter continue to open Chapter 1.
export function chapterFromParam(value: string | null): Chapter {
  if (value === '3') return chapters['draft-ch03']
  return value === '2' ? chapters['draft-ch02'] : chapters['draft-ch01']
}

export function chapterParams(id: ChapterId, index: number) {
  const params = new URLSearchParams()
  if (id !== chapterId) params.set('chapter', String(chapters[id].number))
  params.set('page', String(index + 1))
  return params
}
