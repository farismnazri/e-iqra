import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, Info, Check, ChevronLeft, ChevronRight, Pencil, Play, RotateCcw } from 'lucide-react'
import { pageIndex, units } from './content'
import { chapterFromParam, chapterParams, chapters } from './chapters'
import type { Chapter } from './chapters'
import { audio } from './audio'
import { usePrototype } from './state'
import { BookScene, FrameDecoration, Leaves, Rosette } from './Artwork'
import { DrawingCanvas } from './DrawingCanvas'
import { PositionalForms } from './PositionalForms'
import { introductoryLetter } from './articulation/letters'
import { ArticulationDialog } from './articulation/ArticulationDialog'

function Divider() { return <div className="ornamental-divider" aria-hidden="true"><span />◆<span /></div> }

function Landing() {
  return <main id="main" className="paper-frame landing">
    <FrameDecoration />
    <div className="cover-copy">
      <Rosette className="cover-rosette" />
      <h1 tabIndex={-1}>e-iqra<span className="arabic brand-arabic" lang="ar" dir="rtl">اقرأ</span></h1>
      <Divider />
      <p className="cover-intro">Learn to read Quranic Arabic,<br />one page at a time.</p>
      <Link className="button button-primary start-button" to="/chapters">Start</Link>
    </div>
    <BookScene />
  </main>
}

function Chapters() {
  const { sessions } = usePrototype()
  const [comingSoon, setComingSoon] = useState<number | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (comingSoon !== null && !dialog.current?.open) dialog.current?.showModal()
  }, [comingSoon])

  function bookCover(chapter: number) {
    return <span className="book-cover-inner" aria-hidden="true">
      <Rosette /><span className="book-title">Iqra</span><span className="book-number">{chapter}</span>
      <Divider /><span className="book-landscape" /><Leaves />
    </span>
  }

  return <main id="main" className="paper-frame chapters">
    <FrameDecoration />
    <Link className="back-link" to="/"><ArrowLeft size={18} /> Back to Iqra</Link>
    <header className="chapter-heading"><Rosette /><h1 tabIndex={-1}>Choose a chapter</h1><Divider /></header>
    <ol className="chapter-library" aria-label="Iqra books">
      {[1, 2, 3, 4, 5, 6].map(chapter => {
        const available = Object.values(chapters).find(book => book.number === chapter)
        return <li key={chapter} className="library-slot">
          {available
            ? <Link className={`library-book book-${chapter}`} to={`/learn?${chapterParams(available.id, sessions[available.id].lastPage)}`} aria-label={`Iqra ${chapter}`}>{bookCover(chapter)}</Link>
            : <button className={`library-book book-${chapter}`} type="button" aria-label={`Iqra ${chapter}`} aria-haspopup="dialog" onClick={() => setComingSoon(chapter)}>{bookCover(chapter)}</button>}
        </li>
      })}
    </ol>
    <dialog ref={dialog} className="coming-soon-dialog" aria-labelledby="coming-soon-title" aria-describedby="coming-soon-description" onClose={() => setComingSoon(null)} onClick={event => {
      if (event.target !== event.currentTarget) return
      const bounds = event.currentTarget.getBoundingClientRect()
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.currentTarget.close()
    }}>
      <Rosette /><h2 id="coming-soon-title">Coming soon</h2>
      <p id="coming-soon-description">Chapter {comingSoon} is being prepared. Come back soon!</p>
      <button className="button button-primary" type="button" autoFocus onClick={() => dialog.current?.close()}>Back to library</button>
    </dialog>
  </main>
}

function Reader() {
  const [params] = useSearchParams()
  const chapter = chapterFromParam(params.get('chapter'))
  // Reset review/focus cursors when changing chapters, including browser history.
  return <ChapterReader key={chapter.id} chapter={chapter} />
}

function ChapterReader({ chapter }: { chapter: Chapter }) {
  const [params, setParams] = useSearchParams()
  const pages = chapter.pages
  const retiredFinalPage = chapter.number === 2 && params.get('page') === '10'
  const index = pageIndex(retiredFinalPage ? '9' : params.get('page'), pages.length)
  const page = pages[index]
  const positional = 'layout' in page && page.layout === 'positional'
  const { progress, toggle, drawings, saveDrawing, sessions, setMode, visit } = usePrototype()
  const { mode, visited } = sessions[chapter.id]
  const writing = mode === 'writing'
  const checkedField = writing ? 'writingChecked' : 'readingChecked'
  const [reviewMessage, setReviewMessage] = useState('')
  const [articulation, setArticulation] = useState<{ letter: NonNullable<ReturnType<typeof introductoryLetter>>; trigger: HTMLButtonElement } | null>(null)
  const currentExercise = useRef<string | null>(null)
  const pendingFocus = useRef<string | null>(null)
  const pendingScroll = useRef<number | null>(null)

  useEffect(() => {
    if (retiredFinalPage) setParams(chapterParams(chapter.id, index), { replace: true })
  }, [retiredFinalPage, chapter.id, index, setParams])
  useEffect(() => { visit(chapter.id, index) }, [chapter.id, index, visit])
  useLayoutEffect(() => {
    setReviewMessage('')
    const frame = requestAnimationFrame(() => {
      if (pendingFocus.current) {
        document.getElementById(pendingFocus.current)?.focus()
        pendingFocus.current = null
      } else {
        window.scrollTo(0, 0)
        document.getElementById('reader-title')?.focus({ preventScroll: true })
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [index])

  useLayoutEffect(() => {
    if (pendingScroll.current === null) return
    window.scrollTo(0, pendingScroll.current)
    pendingScroll.current = null
  }, [mode])

  function toggleMode() {
    pendingScroll.current = window.scrollY
    setReviewMessage('')
    setMode(chapter.id, writing ? 'reading' : 'writing')
  }

  function goToPage(next: number) {
    currentExercise.current = null
    setParams(chapterParams(chapter.id, next))
  }
  function nextPractice() {
    setReviewMessage('')
    const candidates = pages.flatMap((p, i) => visited.includes(i) ? p.exercises.map(e => ({ id: e.id, page: i })) : [])
    const start = candidates.findIndex(e => e.id === currentExercise.current)
    const currentPageStart = candidates.findIndex(e => e.page === index)
    const offset = start >= 0 ? start + 1 : Math.max(0, currentPageStart)
    const ordered = [...candidates.slice(offset), ...candidates.slice(0, offset)]
    const next = ordered.find(e => !progress[e.id]?.[checkedField])
    if (!next) { setReviewMessage(`No unchecked ${mode} practices on the pages you've visited.`); return }
    currentExercise.current = next.id
    if (next.page === index) document.getElementById(next.id)?.focus()
    else { pendingFocus.current = next.id; setParams(chapterParams(chapter.id, next.page)) }
  }

  return <main id="main" className={`paper-frame reader${writing ? ' is-writing' : ''}`}>
    <FrameDecoration />
    <div className="reader-toolbar">
      <Link className="back-link" to="/chapters"><ChevronLeft size={20} /><span>Back to Chapters</span></Link>
      <div className="reader-identity"><h1 id="reader-title" tabIndex={-1}>Chapter {chapter.number}</h1><Divider /></div>
      <div className="reader-actions">
        <label className="page-picker"><span className="sr-only">Choose page</span><select aria-label="Choose page" value={index} onChange={e => goToPage(Number(e.target.value))}>{pages.map((p,i) => <option key={p.id} value={i}>Page {i + 1} of {pages.length}</option>)}</select></label>
        <button id="write-action" className="button button-primary write-button" aria-pressed={writing} aria-controls="workbook-sheet" onClick={toggleMode}>{writing ? <Check size={18} /> : <Pencil size={18} />}{writing ? 'Done' : 'Write'}</button>
      </div>
    </div>
    <div className="sr-only"><p>{page.title}. {page.goal}</p><p>Draft curriculum, pending qualified teacher review.</p><p id="audio-note">Approved audio is unavailable. You can still read and tick.</p></div>
    <p className="sr-only" role="status">{writing ? 'Writing mode. Draft tracing references, not teacher-reviewed. Tick and Clear are independent; handwriting is kept only until reload. Draw with a pen or mouse; use fingers to scroll.' : 'Reading mode.'}</p>
    {chapter.number === 3 && <div className="chapter3-note">
      <p>Educational draft · Pending qualified teacher review</p>
      {positional && <p>Compare shapes from right to left. Unvowelled letters are shape references only.</p>}
      {index === 6 && <p>Alif reading examples use the familiar hamzah-on-alif short-vowel spelling.</p>}
      {index === 11 && <p>Optional, ungraded mixed reading review.</p>}
    </div>}
    <section id="workbook-sheet" key={page.id} className="reading-sheet" aria-label={`Draft ${mode} exercises, page ${index + 1}`}>
      <ol className={`exercise-grid${positional ? ' positional-grid' : ''}`}>
        {page.exercises.map((exercise, i) => {
          const letter = 'units' in exercise ? introductoryLetter(exercise) : null
          return <li key={exercise.id} id={exercise.id} tabIndex={-1} className={`exercise${!writing && letter ? ' has-letter-info' : ''}`} onFocus={() => { currentExercise.current = exercise.id }}>
          <span className="exercise-number" aria-label={`Exercise ${i + 1}`}>{String(i + 1).padStart(2, '0')}</span>
          {!writing && letter && <button type="button" className="letter-info" aria-label={`Pronunciation information for ${letter.name}, exercise ${i + 1}`} aria-haspopup="dialog" onClick={event => setArticulation({ letter, trigger: event.currentTarget })}><Info size={16} /></button>}
          <div className="exercise-practice">
            {'units' in exercise
              ? <span className="arabic exercise-arabic" lang="ar" dir="rtl">{exercise.units.map((id, unitIndex) => <span key={`${id}-${unitIndex}`}>{units[id].text}{unitIndex < exercise.units.length - 1 ? ' ' : ''}</span>)}</span>
              : 'forms' in exercise
                ? <PositionalForms exercise={exercise} />
                : <span className="arabic exercise-arabic" lang="ar" dir="rtl">{exercise.text}</span>}
            {writing && <DrawingCanvas strokes={drawings[exercise.id]} onChange={strokes => saveDrawing(exercise.id, strokes)} exerciseNumber={i + 1} />}
          </div>
          <div className="exercise-actions">
            {!writing && <button className="exercise-control sound-control" disabled={audio.status === 'unavailable'} aria-describedby="audio-note" aria-label={`Sound for exercise ${i + 1}: approved audio unavailable`}><span className="round-icon"><Play size={15} fill="currentColor" /></span>Sound</button>}
            <button className={`exercise-control tick-control ${progress[exercise.id]?.[checkedField] ? 'is-checked' : ''}`} aria-pressed={progress[exercise.id]?.[checkedField] ?? false} aria-label={`Tick ${mode} exercise ${i + 1}`} onClick={() => toggle(exercise.id, mode)}><span className="round-icon"><Check size={19} /></span>{progress[exercise.id]?.[checkedField] ? 'Ticked' : 'Tick'}</button>
            {writing && <button className="exercise-control clear-control" aria-label={`Clear handwriting for exercise ${i + 1}`} onClick={() => saveDrawing(exercise.id, [])}><span className="round-icon"><RotateCcw size={17} /></span>Clear</button>}
          </div>
        </li>})}
      </ol>
      <p className="sheet-footnote sr-only"><span className="wide-order">{positional ? 'Compare forms from right to left within each row, then move down.' : 'Read from right to left, then move to the next row.'}</span><span className="phone-order">{positional ? 'Compare forms from right to left within each row, then move down.' : 'Read down the page, one exercise at a time.'}</span><span>{chapter.number === 3 ? 'Draft joining practice · Shape samples, constructed drills and source-linked words · Teacher review pending' : 'Separated practice units · Not Quran quotations'}</span></p>
    </section>
    <nav className="page-navigation" aria-label="Workbook pages">
      <button className="button button-primary next-page" disabled={index === pages.length - 1} onClick={() => goToPage(index + 1)}><ChevronLeft size={19} /><span>Next Page</span></button>
      <button className="next-practice" onClick={nextPractice}><BookOpen size={19} /> Go to next practice</button>
      <button className="button button-paper previous-page" disabled={index === 0} onClick={() => goToPage(index - 1)}><span>Previous Page</span><ChevronRight size={19} /></button>
    </nav>
    <p className="review-message" role="status">{reviewMessage}</p>
    {articulation && <ArticulationDialog letter={articulation.letter} trigger={articulation.trigger} onClose={() => setArticulation(null)} />}
  </main>
}

// Preserve old bookmarks while moving all practice into the reader.
function LegacyWriteRedirect() {
  const location = useLocation()
  const { setMode } = usePrototype()
  const chapter = chapterFromParam(new URLSearchParams(location.search).get('chapter'))
  useLayoutEffect(() => { setMode(chapter.id, 'writing') }, [chapter.id, setMode])
  return <Navigate to={{ pathname: '/learn', search: location.search, hash: location.hash }} replace />
}

export function App() {
  const location = useLocation()
  useEffect(() => {
    const chapter = chapterFromParam(new URLSearchParams(location.search).get('chapter'))
    const titles: Record<string, string> = { '/': 'One page at a time', '/chapters': 'Choose a chapter', '/learn': `Chapter ${chapter.number}`, '/learn/write': 'Write practice' }
    document.title = `Iqra — ${titles[location.pathname] ?? 'Workbook'}`
    if (location.pathname !== '/learn') {
      window.scrollTo(0, 0)
      document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true })
    }
  }, [location.pathname, location.search])
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="app-shell"><Routes><Route path="/" element={<Landing />} /><Route path="/chapters" element={<Chapters />} /><Route path="/learn" element={<Reader />} /><Route path="/learn/write" element={<LegacyWriteRedirect />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></div>
    {location.pathname !== '/chapters' && location.pathname !== '/learn' && <footer className="prototype-footer"><span>e-iqra v0.1</span></footer>}
  </>
}
