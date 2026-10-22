import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, Pencil, Play, RotateCcw } from 'lucide-react'
import { pageIndex, pages, units } from './content'
import { audio } from './audio'
import { usePrototype } from './state'
import { BookScene, FrameDecoration, Leaves, Rosette } from './Artwork'
import { DrawingCanvas } from './DrawingCanvas'

function Divider() { return <div className="ornamental-divider" aria-hidden="true"><span />◆<span /></div> }
function DraftNote() { return <p className="draft-note">Draft samples · Not teacher-reviewed · For prototype review only</p> }

function Landing() {
  return <main id="main" className="paper-frame landing">
    <FrameDecoration />
    <div className="cover-copy">
      <Rosette className="cover-rosette" />
      <p className="eyebrow">A gentle beginning</p>
      <h1 tabIndex={-1}>Iqra<span className="arabic brand-arabic" lang="ar" dir="rtl">اقرأ</span></h1>
      <Divider />
      <p className="cover-intro">Learn to read Quranic Arabic,<br />one page at a time.</p>
      <Link className="button button-primary start-button" to="/chapters">Start Reading <ChevronRight size={22} /></Link>
      <p className="quiet-note">Free to explore. At your own pace.</p>
    </div>
    <BookScene />
    <p className="cover-footnote">A reading workbook, made for a quiet moment.</p>
  </main>
}

function Chapters() {
  const { lastPage, visited } = usePrototype()
  const started = visited.length > 0
  return <main id="main" className="paper-frame chapters">
    <FrameDecoration />
    <Link className="back-link" to="/"><ArrowLeft size={18} /> Back to Iqra</Link>
    <header className="chapter-heading"><Rosette /><h1 tabIndex={-1}>Choose a chapter</h1><Divider /><p>One page at a time. Begin wherever you are.</p></header>
    <div className="chapter-selection">
      <div className="book-cover" aria-hidden="true"><div className="book-cover-inner"><Rosette /><span>Iqra</span><strong>1</strong><Divider /><Leaves /></div></div>
      <section className="chapter-details">
        <p className="eyebrow">Your first pages</p><h2>Chapter 1</h2><p className="chapter-description">A gentle start with Arabic letters.</p>
        <p className="chapter-meta">2 draft sample pages{started ? ` · Last opened: page ${lastPage + 1}` : ''}</p>
        <Link className="button button-primary" to={`/learn?page=${lastPage + 1}`}>{started ? 'Continue Reading' : 'Start Chapter'}<ChevronRight size={20} /></Link>
        <p className="quiet-note">No account needed. Ticks last until you reload.</p>
      </section>
    </div>
    <div className="shelf" aria-hidden="true" />
    <p className="future-note"><BookOpen size={18} /> Further chapters are unavailable in this prototype.</p>
    <DraftNote />
  </main>
}

function Reader() {
  const [params, setParams] = useSearchParams()
  const index = pageIndex(params.get('page'))
  const page = pages[index]
  const { ticks, toggle, visit, visited, readingReturn } = usePrototype()
  const [reviewMessage, setReviewMessage] = useState('')
  const currentExercise = useRef<string | null>(null)
  const pendingFocus = useRef<string | null>(null)

  useEffect(() => { visit(index) }, [index, visit])
  useLayoutEffect(() => {
    setReviewMessage('')
    const saved = readingReturn.current
    const frame = requestAnimationFrame(() => {
      if (saved && saved.page === index) {
        document.getElementById(saved.focusId)?.focus({ preventScroll: true })
        window.scrollTo(0, saved.scrollY)
        readingReturn.current = null
      } else if (pendingFocus.current) {
        document.getElementById(pendingFocus.current)?.focus()
        pendingFocus.current = null
      } else {
        window.scrollTo(0, 0)
        document.getElementById('reader-title')?.focus({ preventScroll: true })
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [index, readingReturn])

  function goToPage(next: number) {
    currentExercise.current = null
    setParams({ page: String(next + 1) })
  }
  function nextPractice() {
    setReviewMessage('')
    const candidates = pages.flatMap((p, i) => visited.includes(i) ? p.exercises.map(e => ({ id: e.id, page: i })) : [])
    const start = candidates.findIndex(e => e.id === currentExercise.current)
    const currentPageStart = candidates.findIndex(e => e.page === index)
    const offset = start >= 0 ? start + 1 : Math.max(0, currentPageStart)
    const ordered = [...candidates.slice(offset), ...candidates.slice(0, offset)]
    const next = ordered.find(e => ticks[e.id] !== 'checked')
    if (!next) { setReviewMessage("No unchecked practices on the pages you've visited."); return }
    currentExercise.current = next.id
    if (next.page === index) document.getElementById(next.id)?.focus()
    else { pendingFocus.current = next.id; setParams({ page: String(next.page + 1) }) }
  }

  return <main id="main" className="paper-frame reader">
    <FrameDecoration />
    <div className="reader-toolbar">
      <Link className="back-link" to="/chapters"><ChevronLeft size={20} /><span>Back to Chapters</span></Link>
      <div className="reader-identity"><h1 id="reader-title" tabIndex={-1}>Chapter 1</h1><Divider /><p>Page {index + 1} <span>of {pages.length}</span></p></div>
      <Link id="write-action" className="button button-primary write-button" to={`/learn/write?page=${index + 1}`} onClick={() => { readingReturn.current = { page: index, scrollY: window.scrollY, focusId: 'write-action' } }}><Pencil size={18} /> Write</Link>
    </div>
    <div className="page-introduction"><p className="eyebrow">{page.title}</p><p>{page.goal}</p></div>
    <DraftNote />
    <p id="audio-note" className="audio-note">Approved audio is unavailable. You can still read and tick.</p>
    <section key={page.id} className="reading-sheet" aria-label={`Draft exercises, page ${index + 1}`}>
      <ol className="exercise-grid">
        {page.exercises.map((exercise, i) => <li key={exercise.id} id={exercise.id} tabIndex={-1} className="exercise" onFocus={() => { currentExercise.current = exercise.id }}>
          <span className="exercise-number" aria-label={`Exercise ${i + 1}`}>{String(i + 1).padStart(2, '0')}</span>
          <span className="arabic exercise-arabic" lang="ar" dir="rtl">{exercise.units.map(id => units[id].text).join(' ')}</span>
          <div className="exercise-actions">
            <button className="exercise-control sound-control" disabled={audio.status === 'unavailable'} aria-describedby="audio-note" aria-label={`Sound for exercise ${i + 1}: approved audio unavailable`}><span className="round-icon"><Play size={15} fill="currentColor" /></span>Sound</button>
            <button className={`exercise-control tick-control ${ticks[exercise.id] === 'checked' ? 'is-checked' : ''}`} aria-pressed={ticks[exercise.id] === 'checked'} aria-label={`Tick exercise ${i + 1}`} onClick={() => toggle(exercise.id)}><span className="round-icon"><Check size={19} /></span>{ticks[exercise.id] === 'checked' ? 'Ticked' : 'Tick'}</button>
          </div>
        </li>)}
      </ol>
      <p className="sheet-footnote"><span className="wide-order">Read from right to left, then move to the next row.</span><span className="phone-order">Read down the page, one exercise at a time.</span><span>Separated practice units · Not Quran quotations</span></p>
    </section>
    <nav className="page-navigation" aria-label="Workbook pages">
      <button className="button button-paper" disabled={index === 0} onClick={() => goToPage(index - 1)}><ChevronLeft size={19} /><span>Previous Page</span></button>
      <label className="page-picker"><span className="sr-only">Choose page</span><select aria-label="Choose page" value={index} onChange={e => goToPage(Number(e.target.value))}>{pages.map((p,i) => <option key={p.id} value={i}>Page {i + 1} of {pages.length}</option>)}</select></label>
      <button className="button button-primary" disabled={index === pages.length - 1} onClick={() => goToPage(index + 1)}><span>Next Page</span><ChevronRight size={19} /></button>
    </nav>
    <button className="next-practice" onClick={nextPractice}><BookOpen size={19} /> Go to next practice <ChevronRight size={17} /></button>
    <p className="review-message" role="status">{reviewMessage}</p>
    <p className="quiet-note reader-note">Ticks are your own confidence check. You can change them anytime.</p>
  </main>
}

function Write() {
  const [params] = useSearchParams()
  const index = pageIndex(params.get('page'))
  const page = pages[index]
  const [formIndex, setFormIndex] = useState(0)
  const [resetKey, setResetKey] = useState(0)
  const [announcement, setAnnouncement] = useState('')
  const form = units[page.eligibleForms[formIndex % page.eligibleForms.length]]
  return <main id="main" className="paper-frame write-view">
    <FrameDecoration />
    <Link className="back-link" to={`/learn?page=${index + 1}`}><ArrowLeft size={18} /> Back to Reading</Link>
    <header className="write-heading"><p className="eyebrow">Chapter 1 · Page {index + 1}</p><h1 tabIndex={-1}>A moment to write</h1><Divider /><p>Follow the faint form, or try it in your own space.</p></header>
    <DraftNote />
    <div className="writing-workspace">
      <div className="letter-reference"><span className="eyebrow">Reference form</span><span className="arabic" lang="ar" dir="rtl">{form.text}</span><p>{form.label}</p><p className="quiet-note">Draft tracing form<br />No grading. No need to be perfect.</p></div>
      <DrawingCanvas letter={form.text} resetKey={resetKey} />
    </div>
    <div className="write-actions"><button className="button button-paper" onClick={() => { setResetKey(n => n + 1); setAnnouncement('Drawing cleared.') }}><RotateCcw size={18} /> Clear</button><p>Mouse, touch or Apple Pencil</p><button className="button button-primary" onClick={() => { setFormIndex(n => (n + 1) % page.eligibleForms.length); setAnnouncement('Next reference form. Drawing cleared.') }}>Next Letter <ArrowRight size={18} /></button></div>
    <p className="sr-only" role="status">{announcement}</p>
    <p className="quiet-note">Drawing is temporary and stays on this screen only.</p>
  </main>
}

export function App() {
  const location = useLocation()
  useEffect(() => {
    const titles: Record<string, string> = { '/': 'One page at a time', '/chapters': 'Choose a chapter', '/learn': 'Chapter 1', '/learn/write': 'Write practice' }
    document.title = `Iqra — ${titles[location.pathname] ?? 'Workbook'}`
    if (location.pathname !== '/learn') {
      window.scrollTo(0, 0)
      document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true })
    }
  }, [location.pathname])
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="app-shell"><Routes><Route path="/" element={<Landing />} /><Route path="/chapters" element={<Chapters />} /><Route path="/learn" element={<Reader />} /><Route path="/learn/write" element={<Write />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></div>
    <footer className="prototype-footer"><span>Iqra · Prototype v0.1</span><span>Unpublished · Temporary local state · Page sounds off</span></footer>
  </>
}
