'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { NOTE_THEMES, type NoteTheme } from '@/lib/note-themes'
import { cn } from '@/lib/utils'

type Props = {
  activeId: string
  onSelect: (theme: NoteTheme) => void
}

export default function ThemePicker({ activeId, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'right' ? 220 : -220, behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium select-none">
        Estilo de papel
      </p>

      <div className="relative flex items-center gap-1.5">
        <button
          onClick={() => scroll('left')}
          className="shrink-0 w-7 h-7 rounded-full border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors z-10"
          aria-label="Scroll izquierda"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-foreground" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto py-2 px-0.5 flex-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {NOTE_THEMES.map(theme => {
            const isActive = theme.id === activeId
            return (
              <button
                key={theme.id}
                onClick={() => onSelect(theme)}
                title={theme.name}
                className={cn(
                  'shrink-0 flex flex-col rounded-xl overflow-hidden transition-all duration-200 focus:outline-none',
                  isActive
                    ? 'ring-2 ring-foreground scale-[1.06] shadow-lg'
                    : 'ring-1 ring-border hover:ring-foreground/30 hover:scale-[1.03]',
                )}
                style={{ width: 72 }}
              >
                {/* Paper preview */}
                <div style={{
                  background: `linear-gradient(175deg, ${theme.paperBg} 0%, ${theme.paperBgBottom} 100%)`,
                  height: 80,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Accent top strip */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    height: 3, background: theme.accentColor, opacity: 0.9,
                  }} />
                  {/* Margin line */}
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0, left: 11,
                    width: 1, background: theme.marginColor, opacity: 0.4,
                  }} />
                  {/* Ruled lines */}
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{
                      position: 'absolute',
                      top: 14 + i * 11,
                      left: 0, right: 0, height: 1,
                      background: theme.lineColor,
                      opacity: theme.lineOpacity,
                    }} />
                  ))}
                  {/* Mini wrinkle */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 14 }}>
                    <svg viewBox="0 0 72 14" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
                      <path d="M0 4 C9 2,15 8,24 5 C33 2,39 8,48 5 C57 2,63 7,72 4 L72 14 L0 14 Z" fill={theme.wrinkleFill2} />
                      <path d="M0 8 C10 5,17 11,28 8 C39 5,45 11,56 8 C62 6,68 9,72 8 L72 14 L0 14 Z" fill={theme.wrinkleFill3} />
                    </svg>
                  </div>
                  {/* Checkmark */}
                  {isActive && (
                    <div style={{
                      position: 'absolute', top: 6, right: 6,
                      width: 17, height: 17, borderRadius: '50%',
                      background: theme.accentColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                    }}>
                      <Check style={{ width: 10, height: 10, color: '#fff', strokeWidth: 3 }} />
                    </div>
                  )}
                </div>

                {/* Name label */}
                <div style={{
                  background: theme.paperBg,
                  borderTop: `1px solid ${theme.lineColor}44`,
                  padding: '5px 0',
                  textAlign: 'center',
                }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: isActive ? 600 : 400,
                    color: theme.textColor,
                    fontFamily: 'var(--font-cormorant), Georgia, serif',
                    letterSpacing: '0.01em',
                    whiteSpace: 'nowrap',
                  }}>
                    {theme.name}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        <button
          onClick={() => scroll('right')}
          className="shrink-0 w-7 h-7 rounded-full border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors z-10"
          aria-label="Scroll derecha"
        >
          <ChevronRight className="w-3.5 h-3.5 text-foreground" />
        </button>
      </div>
    </div>
  )
}
