import { useCallback, useLayoutEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

type Point = { x: number; y: number; pressure: number }
export type Stroke = Point[]
const emptyStrokes: Stroke[] = []

type DrawingCanvasProps = {
  strokes?: Stroke[]
  onChange: (strokes: Stroke[]) => void
  exerciseNumber: number
}

export function DrawingCanvas({ strokes = emptyStrokes, onChange, exerciseNumber }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokesRef = useRef(strokes)
  const active = useRef<number | null>(null)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const { width, height } = canvas.getBoundingClientRect()
    ctx.clearRect(0, 0, width, height)
    ctx.strokeStyle = '#302b27'
    ctx.fillStyle = '#302b27'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const stroke of strokesRef.current) {
      if (!stroke.length) continue
      const first = stroke[0]
      ctx.beginPath()
      ctx.arc(first.x * width, first.y * height, (2 + first.pressure * 3) / 2, 0, Math.PI * 2)
      ctx.fill()
      for (let i = 1; i < stroke.length; i++) {
        const p = stroke[i - 1], next = stroke[i]
        ctx.lineWidth = 2 + next.pressure * 3
        ctx.beginPath()
        ctx.moveTo(p.x * width, p.y * height)
        ctx.lineTo(next.x * width, next.y * height)
        ctx.stroke()
      }
    }
  }, [])

  useLayoutEffect(() => {
    strokesRef.current = strokes
    // Clear can be pressed by a second input while a pen still has capture.
    if (!strokes.length && active.current !== null) {
      const pointerId = active.current
      active.current = null
      const canvas = canvasRef.current
      if (canvas?.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId)
    }
    redraw()
  }, [strokes, redraw])

  useLayoutEffect(() => {
    const canvas = canvasRef.current!
    const resize = () => {
      const box = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(box.width * dpr)
      canvas.height = Math.round(box.height * dpr)
      canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0)
      redraw()
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    window.addEventListener('resize', resize)
    return () => { observer.disconnect(); window.removeEventListener('resize', resize) }
  }, [redraw])

  function point(event: PointerEvent, canvas: HTMLCanvasElement): Point {
    const box = canvas.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(1, (event.clientX - box.left) / box.width)),
      y: Math.max(0, Math.min(1, (event.clientY - box.top) / box.height)),
      pressure: event.pointerType === 'pen' ? event.pressure || 0.5 : 0.5,
    }
  }
  function update(next: Stroke[]) {
    strokesRef.current = next
    onChange(next)
    redraw()
  }
  function start(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!event.isPrimary || active.current !== null || event.button !== 0) return
    event.preventDefault()
    active.current = event.pointerId
    event.currentTarget.setPointerCapture(event.pointerId)
    update([...strokesRef.current, [point(event.nativeEvent, event.currentTarget)]])
  }
  function move(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (active.current !== event.pointerId) return
    event.preventDefault()
    const samples = event.nativeEvent.getCoalescedEvents?.() ?? []
    const points = (samples.length ? samples : [event.nativeEvent]).map(sample => point(sample, event.currentTarget))
    const previous = strokesRef.current
    update([...previous.slice(0, -1), [...previous[previous.length - 1], ...points]])
  }
  function stop(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (active.current !== event.pointerId) return
    active.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  return <canvas className="exercise-canvas" ref={canvasRef}
    aria-label={`Writing area for exercise ${exerciseNumber}. Draw with a mouse, touch or pen; use this exercise's Clear button to erase.`}
    onPointerDown={start} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}
    onClick={event => event.preventDefault()}>
    Freehand drawing requires a browser with canvas support. The reference and self-check controls remain available.
  </canvas>
}
