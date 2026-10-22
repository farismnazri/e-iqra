import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'

type Confidence = 'checked' | 'explicitly_unchecked'
type ReadingContext = { scrollY: number; focusId: string; page: number }
function usePrototypeState() {
  const [ticks, setTicks] = useState<Record<string, Confidence>>({})
  const [lastPage, setLastPage] = useState(0)
  const [visited, setVisited] = useState<number[]>([])
  const readingReturn = useRef<ReadingContext | null>(null)
  const visit = useCallback((index: number) => {
    setLastPage(index)
    setVisited(previous => previous.includes(index) ? previous : [...previous, index])
  }, [])
  function toggle(id: string) {
    setTicks(previous => ({ ...previous, [id]: previous[id] === 'checked' ? 'explicitly_unchecked' : 'checked' }))
  }
  return { ticks, toggle, lastPage, visited, visit, readingReturn }
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
