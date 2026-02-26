'use client'

import { forwardRef } from 'react'
import { type NoteTheme, FONT_OPTIONS, FONT_SIZES, type FontId, type FontSizeKey } from '@/lib/note-themes'

type Align = 'left' | 'center' | 'right'

type Props = {
  theme: NoteTheme
  fontId: FontId
  fontSize: FontSizeKey
  bold: boolean
  italic: boolean
  align: Align
  tilt: number
  text: string
  onChange: (text: string) => void
}

const MAX_CHARS = 600
const NOTE_WIDTH = 420
const NOTE_HEIGHT = 500
const PAD_LEFT = 54
const PAD_RIGHT = 32
const PAD_TOP = 52
const PAD_BOTTOM = 52
const HOLE_COUNT = 7

const LetterCard = forwardRef<HTMLDivElement, Props>(function LetterCard(
  { theme, fontId, fontSize, bold, italic, align, tilt, text, onChange },
  ref,
) {
  const fontCss = FONT_OPTIONS.find(f => f.id === fontId)?.cssVar ?? FONT_OPTIONS[0].cssVar
  const { px, lineHeight } = FONT_SIZES[fontSize]

  const usableHeight = NOTE_HEIGHT - PAD_TOP - PAD_BOTTOM
  const lineCount = Math.ceil(usableHeight / lineHeight) + 2

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= MAX_CHARS) onChange(e.target.value)
  }

  const textStyle: React.CSSProperties = {
    fontFamily: fontCss,
    fontSize: px,
    lineHeight: `${lineHeight}px`,
    fontWeight: bold ? 700 : 400,
    fontStyle: italic ? 'italic' : 'normal',
    textAlign: align,
    color: theme.textColor,
    caretColor: theme.accentColor,
  }

  return (
    <div style={{ transform: `rotate(${tilt}deg)`, transition: 'transform 0.3s ease' }}>
      {/* Stacked paper shadows */}
      <div style={{
        position: 'absolute', width: NOTE_WIDTH, height: NOTE_HEIGHT,
        background: theme.paperBgBottom, borderRadius: 3,
        transform: 'rotate(1.8deg) translate(6px, 5px)', opacity: 0.65,
      }} />
      <div style={{
        position: 'absolute', width: NOTE_WIDTH, height: NOTE_HEIGHT,
        background: theme.paperBgBottom, borderRadius: 3,
        transform: 'rotate(-1.2deg) translate(-4px, 3px)', opacity: 0.5,
      }} />

      {/* Main card — this is what html2canvas captures */}
      <div
        ref={ref}
        style={{
          position: 'relative',
          width: NOTE_WIDTH,
          height: NOTE_HEIGHT,
          background: `linear-gradient(175deg, ${theme.paperBg} 0%, ${theme.paperBgBottom} 100%)`,
          boxShadow: theme.shadowColor,
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        {/* Accent top bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: theme.accentColor, opacity: 0.85, zIndex: 4,
        }} />

        {/* Header tint strip */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: PAD_TOP - 6,
          background: theme.accentColor, opacity: 0.08, zIndex: 1,
        }} />

        {/* Spiral holes */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: 26, height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'space-evenly', paddingTop: 28, paddingBottom: 56, zIndex: 5,
        }}>
          {Array.from({ length: HOLE_COUNT }).map((_, i) => (
            <div key={i} style={{
              width: 11, height: 11, borderRadius: '50%',
              background: `linear-gradient(135deg, ${theme.holeColor} 0%, ${theme.paperBgBottom} 100%)`,
              boxShadow: `inset 0 1.5px 3px rgba(0,0,0,0.3), 0 0 0 1.5px ${theme.holeColor}88`,
            }} />
          ))}
        </div>

        {/* Margin vertical line */}
        <div style={{
          position: 'absolute', top: 0, left: 38, width: 1.5, height: '100%',
          background: theme.marginColor, opacity: 0.4, zIndex: 2,
        }} />

        {/* Ruled lines — individual divs so html2canvas renders them */}
        {Array.from({ length: lineCount }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: PAD_TOP + i * lineHeight,
            left: 0, right: 0, height: 1,
            background: theme.lineColor,
            opacity: theme.lineOpacity,
            zIndex: 2,
          }} />
        ))}

        {/* Textarea */}
        <textarea
          value={text}
          onChange={handleChange}
          placeholder="Escribe tu nota aquí..."
          spellCheck={false}
          style={{
            ...textStyle,
            position: 'absolute',
            top: PAD_TOP,
            left: PAD_LEFT,
            width: NOTE_WIDTH - PAD_LEFT - PAD_RIGHT,
            height: NOTE_HEIGHT - PAD_TOP - PAD_BOTTOM,
            resize: 'none',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            padding: 0,
            margin: 0,
            overflow: 'hidden',
            zIndex: 6,
          }}
        />

        {/* Placeholder colour via pseudo-element workaround — inject style tag */}
        <style>{`textarea::placeholder { color: ${theme.placeholderColor}; }`}</style>

        {/* Wrinkled bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: PAD_BOTTOM,
          zIndex: 7, pointerEvents: 'none',
        }}>
          <svg viewBox={`0 0 ${NOTE_WIDTH} ${PAD_BOTTOM}`} preserveAspectRatio="none"
            style={{ width: '100%', height: '100%', display: 'block' }}>
            {/* layer 1 */}
            <path
              d={`M0 10 C30 5,50 20,80 13 C110 6,128 20,158 13 C188 6,206 22,234 15 C262 8,280 24,310 17 C340 10,360 20,390 15 C410 11,${NOTE_WIDTH - 10} 14,${NOTE_WIDTH} 12 L${NOTE_WIDTH} ${PAD_BOTTOM} L0 ${PAD_BOTTOM} Z`}
              fill={theme.wrinkleFill1}
            />
            {/* layer 2 */}
            <path
              d={`M0 20 C35 13,54 28,86 21 C118 14,136 30,166 23 C196 16,215 32,244 25 C273 18,292 34,321 27 C350 20,370 30,398 25 C412 22,${NOTE_WIDTH - 6} 26,${NOTE_WIDTH} 24 L${NOTE_WIDTH} ${PAD_BOTTOM} L0 ${PAD_BOTTOM} Z`}
              fill={theme.wrinkleFill2}
            />
            {/* layer 3 */}
            <path
              d={`M0 30 C38 23,60 36,92 30 C124 23,143 38,174 31 C205 24,226 40,255 33 C284 26,304 41,334 34 C364 27,384 38,${NOTE_WIDTH} 34 L${NOTE_WIDTH} ${PAD_BOTTOM} L0 ${PAD_BOTTOM} Z`}
              fill={theme.wrinkleFill3}
            />
            {/* crease lines */}
            <path d={`M60 26 Q78 18 96 26`} stroke={theme.wrinkleCrease} strokeWidth="0.8" fill="none" />
            <path d={`M170 22 Q192 14 212 22`} stroke={theme.wrinkleCrease} strokeWidth="0.7" fill="none" />
            <path d={`M284 28 Q306 20 326 28`} stroke={theme.wrinkleCrease} strokeWidth="0.8" fill="none" />
            <path d={`M370 24 Q388 16 406 24`} stroke={theme.wrinkleCrease} strokeWidth="0.7" fill="none" />
          </svg>
        </div>
      </div>
    </div>
  )
})

export default LetterCard
