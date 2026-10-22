import { useLayoutEffect, useRef } from 'react'
import type { PointerEvent } from 'react'

type Point = { x: number; y: number; pressure: number }
type Stroke = Point[]

export function DrawingCanvas({ letter, resetKey }: { letter: string; resetKey: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokes = useRef<Stroke[]>([])
  const active = useRef<number | null>(null)

  function redraw() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const { width, height } = canvas.getBoundingClientRect()
    ctx.clearRect(0, 0, width, height)
    ctx.strokeStyle = '#302b27'
    ctx.fillStyle = '#302b27'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const stroke of strokes.current) {
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
  }

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
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    window.addEventListener('resize', resize)
    return () => { observer.disconnect(); window.removeEventListener('resize', resize) }
  }, [])

  useLayoutEffect(() => {
    strokes.current = []
    active.current = null
    redraw()
  }, [resetKey, letter])

  function point(event: PointerEvent<HTMLCanvasElement>): Point {
    const box = event.currentTarget.getBoundingClientRect()
    return {
      x: (event.clientX - box.left) / box.width,
      y: (event.clientY - box.top) / box.height,
      pressure: event.pointerType === 'pen' ? event.pressure || 0.5 : 0.5,
    }
  }
  function start(event: PointerEvent<HTMLCanvasElement>) {
    if (active.current !== null || (event.pointerType === 'mouse' && event.button !== 0)) return
    event.preventDefault()
    active.current = event.pointerId
    event.currentTarget.setPointerCapture(event.pointerId)
    strokes.current.push([point(event)])
    redraw()
  }
  function move(event: PointerEvent<HTMLCanvasElement>) {
    if (active.current !== event.pointerId) return
    event.preventDefault()
    strokes.current[strokes.current.length - 1].push(point(event))
    redraw()
  }
  function stop(event: PointerEvent<HTMLCanvasElement>) {
    if (active.current !== event.pointerId) return
    active.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  return <div className="drawing-area">
    <div className="drawing-baseline" />
    <span className="tracing-letter arabic" lang="ar" dir="rtl" aria-hidden="true">{letter}</span>
    <canvas ref={canvasRef} aria-label="Freehand practice area. Draw with a mouse, touch, or pen. Use Clear to remove your strokes."
      onPointerDown={start} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}>
      Freehand drawing requires a browser with canvas support. You can still use the reference letter and return to reading.
    </canvas>
    <span className="drawing-caption" aria-hidden="true">Your space to practise</span>
  </div>
}
