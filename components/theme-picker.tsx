"use client"

import { noteThemes, type NoteTheme } from "@/lib/note-themes"

interface ThemePickerProps {
  selected: NoteTheme
  onSelect: (theme: NoteTheme) => void
}

export default function ThemePicker({ selected, onSelect }: ThemePickerProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <span
        className="text-xs italic tracking-wider uppercase"
        style={{
          fontFamily: "var(--font-body), 'Cormorant Garamond', serif",
          color: "hsl(24, 5%, 50%)",
          letterSpacing: "0.14em",
        }}
      >
        Estilo de papel
      </span>
      <div className="flex items-center gap-3 flex-wrap justify-center max-w-[380px]">
        {noteThemes.map((theme) => {
          const isActive = selected.id === theme.id
          return (
            <button
              key={theme.id}
              onClick={() => onSelect(theme)}
              className="group flex flex-col items-center gap-1.5 transition-all"
              aria-label={`Tema ${theme.name}`}
            >
              <div
                className="relative w-10 h-10 rounded-full transition-all"
                style={{
                  background: theme.previewBg,
                  border: isActive
                    ? `2.5px solid ${theme.previewAccent}`
                    : "1.5px solid hsl(0, 0%, 85%)",
                  boxShadow: isActive
                    ? `0 0 0 2.5px hsl(0, 0%, 100%), 0 2px 10px rgba(0,0,0,0.12)`
                    : "0 1px 4px rgba(0,0,0,0.06)",
                  transform: isActive ? "scale(1.15)" : "scale(1)",
                }}
              >
                {/* Mini notebook lines */}
                <div
                  className="absolute inset-[4px] rounded-full overflow-hidden pointer-events-none"
                >
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage: `repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 4px,
                        ${theme.lineColor} 4px,
                        ${theme.lineColor} 4.5px
                      )`,
                      opacity: theme.lineOpacity + 0.1,
                    }}
                  />
                </div>
              </div>
              <span
                className="text-[10px] italic transition-all"
                style={{
                  fontFamily: "var(--font-body), 'Cormorant Garamond', serif",
                  color: isActive ? "hsl(24, 10%, 25%)" : "hsl(24, 5%, 58%)",
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {theme.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
