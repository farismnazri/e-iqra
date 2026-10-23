import type { PositionalExercise } from './chapter3'

// The containing exercise owns its tick and optional drawing surface.
// Each sample is one uninterrupted Arabic shaping run.
export function PositionalForms({ exercise }: { exercise: PositionalExercise }) {
  return <div className="positional-reference">
    <p className="positional-title">{exercise.title}</p>
    <div className="positional-samples" dir="rtl">
      {exercise.forms.map(form => <div className="positional-sample" key={form.label}>
        <span className="form-label" dir="ltr">{form.label}</span>
        <span className="arabic positional-arabic" lang="ar" dir="rtl">{form.text}</span>
        {form.positions && <span className="form-positions" dir="ltr">{form.positions}</span>}
        {form.context && <span className="arabic form-context" lang="ar" dir="rtl" aria-label={`Example: ${form.context}`}>{form.context}</span>}
      </div>)}
    </div>
    {exercise.note && <p className="positional-note">{exercise.note}</p>}
  </div>
}
