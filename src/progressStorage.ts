import { chapters } from './chapters'
import type { ChapterId } from './chapters'

export type WorkbookMode = 'reading' | 'writing'
export type ExerciseProgress = { readingChecked: boolean; writingChecked: boolean }
export type ChapterSession = { mode: WorkbookMode; lastPage: number; visited: number[] }
export type LearnerProgress = {
  progress: Record<string, ExerciseProgress>
  sessions: Record<ChapterId, ChapterSession>
}

export const progressStorageKey = 'e-iqra.progress'
const storageVersion = 1
const chapterIds = Object.keys(chapters) as ChapterId[]
const exerciseIds = Object.values(chapters).flatMap(chapter =>
  chapter.pages.flatMap(page => page.exercises.map(exercise => exercise.id)))

function emptyProgress(): LearnerProgress {
  return {
    progress: {},
    sessions: Object.fromEntries(chapterIds.map(id =>
      [id, { mode: 'reading', lastPage: 0, visited: [] } as ChapterSession])) as LearnerProgress['sessions'],
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Validate against current exercise identities and chapter bounds. Never transfer
// a retired exercise's checks to its replacement by page or exercise position.
export function loadProgress(): LearnerProgress {
  const restored = emptyProgress()
  try {
    const raw = window.localStorage.getItem(progressStorageKey)
    if (raw === null) return restored
    const saved: unknown = JSON.parse(raw)
    if (!isRecord(saved) || saved.version !== storageVersion) return restored

    if (isRecord(saved.progress)) {
      for (const id of exerciseIds) {
        const entry = saved.progress[id]
        if (!isRecord(entry)) continue
        // Check types, not truthiness: an explicit false is a saved choice.
        if (typeof entry.readingChecked !== 'boolean' && typeof entry.writingChecked !== 'boolean') continue
        restored.progress[id] = {
          readingChecked: entry.readingChecked === true,
          writingChecked: entry.writingChecked === true,
        }
      }
    }
    if (isRecord(saved.sessions)) {
      for (const id of chapterIds) {
        const entry = saved.sessions[id]
        if (!isRecord(entry)) continue
        const validPage = (value: unknown): value is number =>
          typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < chapters[id].pages.length
        restored.sessions[id] = {
          mode: entry.mode === 'writing' ? 'writing' : 'reading',
          lastPage: validPage(entry.lastPage) ? entry.lastPage : 0,
          visited: Array.isArray(entry.visited) ? [...new Set(entry.visited.filter(validPage))] : [],
        }
      }
    }
  } catch {
    // Invalid JSON, denied storage access and non-browser contexts use defaults.
  }
  return restored
}

export function storeProgress({ progress, sessions }: LearnerProgress): void {
  try {
    // Deliberately serialize only durable learner state, never drawing strokes.
    window.localStorage.setItem(progressStorageKey, JSON.stringify({ version: storageVersion, progress, sessions }))
  } catch {
    // Quota and privacy restrictions must not block in-memory learning.
  }
}
