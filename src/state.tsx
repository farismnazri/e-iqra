import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { Stroke } from './DrawingCanvas'
import type { ChapterId } from './chapters'

export type WorkbookMode = 'reading' | 'writing'
export type ExerciseProgress = { readingChecked: boolean; writingChecked: boolean }
type ChapterSession = { mode: WorkbookMode; lastPage: number; visited: number[] }

function usePrototypeState() {
  const [progress, setProgress] = useState<Record<string, ExerciseProgress>>({})
  const [drawings, setDrawings] = useState<Record<string, Stroke[]>>({})
  const [sessions, setSessions] = useState<Record<ChapterId, ChapterSession>>({
    'draft-ch01': { mode: 'reading', lastPage: 0, visited: [] },
    'draft-ch02': { mode: 'reading', lastPage: 0, visited: [] },
    'draft-ch03': { mode: 'reading', lastPage: 0, visited: [] },
  })
  const visit = useCallback((chapter: ChapterId, index: number) => {
    setSessions(previous => {
      const current = previous[chapter]
      return { ...previous, [chapter]: {
        ...current, lastPage: index,
        visited: current.visited.includes(index) ? current.visited : [...current.visited, index],
      } }
    })
  }, [])
  const setMode = useCallback((chapter: ChapterId, mode: WorkbookMode) => {
    setSessions(previous => ({ ...previous, [chapter]: { ...previous[chapter], mode } }))
  }, [])
  const toggle = useCallback((id: string, activeMode: WorkbookMode) => {
    const field = activeMode === 'reading' ? 'readingChecked' : 'writingChecked'
    setProgress(previous => {
      const current = previous[id] ?? { readingChecked: false, writingChecked: false }
      // Keep deliberate false values; neither mode can overwrite the other's choice.
      return { ...previous, [id]: { ...current, [field]: !current[field] } }
    })
  }, [])
  const saveDrawing = useCallback((id: string, strokes: Stroke[]) => {
    setDrawings(previous => ({ ...previous, [id]: strokes }))
  }, [])
  // Exercise IDs include their chapter, keeping ticks and drawings isolated as well.
  return { progress, toggle, drawings, saveDrawing, sessions, setMode, visit }
}

const PrototypeContext = createContext<ReturnType<typeof usePrototypeState> | null>(null)
export function PrototypeProvider({ children }: { children: ReactNode }) {
  const value = usePrototypeState()
  return <PrototypeContext.Provider value={value}>{children}</PrototypeContext.Provider>
}
export function usePrototype() {
  const state = useContext(PrototypeContext)
  if (!state) throw new Error('PrototypeProvider is required')
  return state
}
