import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { LetterId } from './letterPoses'

export function ArticulationDialog({ letter, trigger, onClose }: {
  letter: { id: LetterId; name: string }
  trigger: HTMLButtonElement
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading')

  useLayoutEffect(() => {
    const element = dialog.current!
    const x = window.scrollX, y = window.scrollY
    const previousStyle = document.body.getAttribute('style')
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    Object.assign(document.body.style, {
      position: 'fixed', top: `${-y}px`, left: `${-x}px`, width: '100%',
      paddingRight: `${scrollbar}px`,
    })
    element.showModal()
    return () => {
      element.close()
      if (previousStyle === null) document.body.removeAttribute('style')
      else document.body.setAttribute('style', previousStyle)
      trigger.focus({ preventScroll: true })
      window.scrollTo(x, y)
    }
  }, [trigger])

  useEffect(() => {
    let cancelled = false
    let dispose: (() => void) | undefined
    setStatus('loading')
    import('./viewer').then(({ createArticulationViewer }) => {
      if (cancelled || !viewport.current) return
      let failed = false
      dispose = createArticulationViewer(viewport.current, letter.id, () => {
        failed = true
        if (!cancelled) setStatus('unavailable')
      })
      if (!failed) setStatus('ready')
    }).catch(() => { if (!cancelled) setStatus('unavailable') })
    return () => { cancelled = true; dispose?.() }
  }, [letter.id])

  return <dialog ref={dialog} className="articulation-dialog" aria-labelledby="articulation-title" aria-describedby="articulation-note" onCancel={event => { event.preventDefault(); onClose() }}>
    <button type="button" className="articulation-close" aria-label="Close pronunciation information" autoFocus onClick={onClose}><X size={21} /></button>
    <h2 id="articulation-title">{letter.name}</h2>
    <div ref={viewport} className="articulation-viewport" role="img" aria-label={`Draft anatomical articulation model for ${letter.name}`} aria-busy={status === 'loading'} hidden={status === 'unavailable'} />
    {status !== 'ready' && <p className="articulation-status" role="status">{status === 'loading' ? 'Loading articulation model…' : 'The 3D model is unavailable on this device. Close to continue reading.'}</p>}
    <p id="articulation-note" className="articulation-note">Draft consonant position · Pending teacher review. Short vowels and contextual changes are not shown.</p>
    <p className="articulation-credit">Model adapted from <a href="https://makhraj3d.ebooksunnah.com/" target="_blank" rel="noreferrer">Makhraj 3D</a> by ms@ebooksunnah.com.</p>
  </dialog>
}
