// Original, deterministic UI samples. These are not an approved lesson bank.
export const curriculumVersion = 'prototype-v0.1-unreviewed'
export const chapterId = 'draft-ch01'

export const units = {
  'draft-alif-fathah': { text: 'أَ', label: 'Alif sample with fathah' },
  'draft-ba-fathah': { text: 'بَ', label: 'Ba sample with fathah' },
} as const

export type UnitId = keyof typeof units
export type Exercise = {
  id: string
  units: UnitId[]
  teacherStatus: 'unreviewed'
  kind: 'isolated_unit' | 'separated_units'
}

const a: UnitId = 'draft-alif-fathah'
const b: UnitId = 'draft-ba-fathah'
const exercise = (id: string, items: UnitId[]): Exercise => ({
  id, units: items, teacherStatus: 'unreviewed',
  kind: items.length === 1 ? 'isolated_unit' : 'separated_units',
})

export const pages = [
  {
    id: 'draft-ch01-p01', title: 'Alif & Ba',
    goal: 'Explore two isolated forms, then read the separated units.',
    eligibleForms: [a, b],
    exercises: [
      exercise('draft-ch01-p01-e01', [a]), exercise('draft-ch01-p01-e02', [b]),
      exercise('draft-ch01-p01-e03', [a, b]), exercise('draft-ch01-p01-e04', [b, a]),
      exercise('draft-ch01-p01-e05', [a, a]), exercise('draft-ch01-p01-e06', [b, b]),
    ],
  },
  {
    id: 'draft-ch01-p02', title: 'A little more practice',
    goal: 'Revisit the same two forms in short, separated sequences.',
    eligibleForms: [a, b],
    exercises: [
      exercise('draft-ch01-p02-e01', [a, b, a]), exercise('draft-ch01-p02-e02', [b, a, b]),
      exercise('draft-ch01-p02-e03', [b, b, a]), exercise('draft-ch01-p02-e04', [a, a, b]),
      exercise('draft-ch01-p02-e05', [b, a, a]), exercise('draft-ch01-p02-e06', [a, b, b]),
    ],
  },
]

export function pageIndex(value: string | null) {
  const n = Number(value)
  return Number.isInteger(n) && n >= 1 && n <= pages.length ? n - 1 : 0
}
