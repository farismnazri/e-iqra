// Original code-drawn decorative artwork, inspired by the owner's visual direction.
export function Rosette({ className = '' }: { className?: string }) {
  return <svg className={`rosette ${className}`} viewBox="0 0 100 100" fill="none" aria-hidden="true">
    {Array.from({ length: 8 }, (_, i) => <path key={i} d="M50 8 62 31 50 50 38 31Z" transform={`rotate(${i * 45} 50 50)`} />)}
    <path d="m50 29 15 21-15 21-15-21Z" /><circle cx="50" cy="50" r="5" />
  </svg>
}

export function Leaves({ className = '' }: { className?: string }) {
  return <svg className={`leaves ${className}`} viewBox="0 0 160 320" fill="none" aria-hidden="true">
    <path d="M52 315C101 242 48 135 115 22" stroke="currentColor" strokeWidth="2" />
    {[ [85, 225, -55], [78, 192, 24], [78, 154, -50], [85, 113, 26], [101, 70, -30] ].map(([x,y,r],i) =>
      <path key={i} d="M0 0C-40-12-45-43-40-67-9-53 7-28 0 0Z" fill="currentColor" opacity={0.65 + i * 0.05} transform={`translate(${x} ${y}) rotate(${r})`} />)}
  </svg>
}

export function BookScene() {
  return <div className="book-scene" aria-hidden="true">
    <img className="scene-background" src="/images/landing/arch-background.webp" width="1417" height="1110" alt="" />
    <img className="scene-foreground" src="/images/landing/book-foreground.webp" width="1536" height="1024" alt="" />
  </div>
}

export function FrameDecoration() {
  return <div className="frame-decoration" aria-hidden="true">
    <div className="corner corner-tl" /><div className="corner corner-tr" />
    <div className="corner corner-bl" /><div className="corner corner-br" />
  </div>
}
