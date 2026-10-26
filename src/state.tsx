import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Stroke } from './DrawingCanvas'
import type { ChapterId } from './chapters'
import { loadProgress, storeProgress } from './progressStorage'
import type { WorkbookMode } from './progressStorage'

export type { WorkbookMode, ExerciseProgress } from './progressStorage'

function usePrototypeState() {
  // Lazy hydration happens before children render or any persistence effect runs.
  const [{ progress, sessions }, setLearnerProgress] = useState(loadProgress)
  const [drawings, setDrawings] = useState<Record<string, Stroke[]>>({})
  useEffect(() => { storeProgress({ progress, sessions }) }, [progress, sessions])
  const visit = useCallback((chapter: ChapterId, index: number) => {
    setLearnerProgress(previous => {
      const current = previous.sessions[chapter]
      if (current.lastPage === index && current.visited.includes(index)) return previous
      return { ...previous, sessions: { ...previous.sessions, [chapter]: {
        ...current, lastPage: index,
        visited: current.visited.includes(index) ? current.visited : [...current.visited, index],
      } } }
    })
  }, [])
  const setMode = useCallback((chapter: ChapterId, mode: WorkbookMode) => {
    setLearnerProgress(previous => ({ ...previous, sessions: {
      ...previous.sessions, [chapter]: { ...previous.sessions[chapter], mode },
    } }))
  }, [])
  const toggle = useCallback((id: string, activeMode: WorkbookMode) => {
    const field = activeMode === 'reading' ? 'readingChecked' : 'writingChecked'
    setLearnerProgress(previous => {
      const current = previous.progress[id] ?? { readingChecked: false, writingChecked: false }
      // Keep deliberate false values; neither mode can overwrite the other's choice.
      return { ...previous, progress: { ...previous.progress, [id]: { ...current, [field]: !current[field] } } }
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
