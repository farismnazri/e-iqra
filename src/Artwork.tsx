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
    <div className="scene-arch"><Rosette /><div className="scene-sun" /></div>
    <Leaves className="scene-leaf-left" /><Leaves className="scene-leaf-right" />
    <svg className="open-book" viewBox="0 0 600 400" fill="none">
      <ellipse cx="300" cy="350" rx="235" ry="23" fill="#6f4b29" opacity=".10" />
      <path d="m195 257 219 94 24-21-213-98Z" fill="#91623c" /><path d="m388 256-219 95-23-21 212-98Z" fill="#a87344" />
      <path d="m57 181 244 81 241-82-43-113-200 59L102 65Z" fill="#58674f" stroke="#40513f" strokeWidth="6" />
      <path d="m66 169 235 81 234-82-37-106-197 55L103 59Z" fill="#e7d4ac" stroke="#b99b6e" strokeWidth="2" />
      <path d="M301 238c-59-41-132-56-225-76L111 46c84 13 143 33 190 67 47-34 107-54 189-67l35 116c-93 20-165 35-224 76Z" fill="#fbf4df" stroke="#c6ad80" strokeWidth="2" />
      <path d="M301 113v125" stroke="#c6ad80" strokeWidth="3" />
      <path d="M120 63c68 13 123 33 165 60v87c-53-29-115-49-190-64Zm362 0c-68 13-123 33-165 60v87c53-29 115-49 190-64Z" stroke="#bda67c" strokeWidth="1.5" />
      {[0,1,2,3,4,5].map(i => <g key={i} stroke="#c7b690" strokeWidth="2" opacity=".75"><path d={`M${124-i*3} ${81+i*11}q83 18 145 50`} /><path d={`M${478+i*3} ${81+i*11}q-83 18-145 50`} /></g>)}
    </svg>
  </div>
}

export function FrameDecoration() {
  return <div className="frame-decoration" aria-hidden="true">
    <div className="corner corner-tl" /><div className="corner corner-tr" />
    <div className="corner corner-bl" /><div className="corner corner-br" />
  </div>
}
