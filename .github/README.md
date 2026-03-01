# Papelito

> Create and download stylish notes — an elegant note editor built with Next.js and Tailwind CSS.

![Papelito](/public/icon-dark.ico)

---

## What is Papelito?

**Papelito** is a browser-based note editor that lets you write a message, customize it with different paper styles and typography, and download it as a high-resolution PNG image. No accounts, no servers — everything runs on the client.

---

## Features

### Editor
- Textarea editable directly on the note with a contextual cursor
- 600-character limit with a real-time progress bar
- Auto-save draft to `localStorage` with automatic restore on reopen
- Undo / Redo with a history of up to 50 states (debounced 400 ms)
- Copy text to clipboard with one click

### Formatting
- **5 typefaces**: Cormorant Garamond, Playfair Display, Lora, Crimson Pro, Sacramento
- **3 font sizes**: S (15 px) / M (18 px) / L (22 px)
- Independent Bold and Italic
- Alignment: left, center, right
- Tilt slider from -8 to +8 degrees

### Paper styles (12 themes)
| Theme | Description |
|---|---|
| Classic | Warm cream with light blue lines |
| Night | Dark blue, light ink |
| Rose | Pale pink with magenta lines |
| Sage | Soft green, botanical tone |
| Sepia | Aged brown paper |
| Lavender | Soft violet |
| Ocean | Sky blue and navy |
| Charcoal | Dark gray, nearly black |
| Mint | Fresh mint green |
| Sunrise | Warm golden yellow |
| Slate | Mid-tone slate blue |
| Chalk | Dark green chalkboard style |

Each theme defines: paper color, notebook lines, margin line, bottom wrinkled edge folds, shadow, and text color. Lines are real `<div>` elements (not `background-image`) so that `html2canvas` captures them faithfully.

### Download
- Rendered with `html2canvas` at 3x scale (high resolution)
- Downloads as `.png` named `papelito-{theme}-{timestamp}.png`
- The image includes notebook lines, the red margin, and the wrinkled edge

### UX
- Responsive design (mobile-first, two-column layout on desktop)
- Sticky header with branding and visible keyboard shortcuts
- Subtle dot-grid background pattern
- Confirmation toasts (Sonner) for all actions

### Keyboard shortcuts
| Shortcut | Action |
|---|---|
| `Ctrl + Z` | Undo |
| `Ctrl + Y` or `Ctrl + Shift + Z` | Redo |
| `Ctrl + B` | Bold |
| `Ctrl + I` | Italic |
| `Ctrl + S` | Confirm save |

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styles | Tailwind CSS v3 + shadcn/ui |
| Typefaces | Google Fonts via `next/font/google` |
| Image capture | `html2canvas` ^1.4.1 |
| Notifications | `sonner` ^1.7.1 |
| Icons | `lucide-react` |
| Language | TypeScript |

---

## Project structure

```
papelito/
├── app/
│   ├── globals.css        # Color tokens, dot-grid, base fonts
│   ├── layout.tsx         # Google Fonts loading, metadata
│   └── page.tsx           # Main page with all state
├── components/
│   ├── editor-toolbar.tsx # Full formatting toolbar
│   ├── letter-card.tsx    # The note itself (lines, folds, textarea)
│   └── theme-picker.tsx   # 12 paper style selector
├── lib/
│   ├── note-themes.ts     # Theme and font definitions
│   └── utils.ts           # cn helper
└── public/
    └── icon-light.ico     # App icon
```

---

## Installation and local usage

```bash
# Clone the repository
git clone https://github.com/your-username/papelito.git
cd papelito

# Install dependencies
bun install

# Start in development mode
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

```bash
# Production build
bun build
bun start
```

---

## Deploy

The fastest deploy is with **Vercel**:

1. Import the repository at [vercel.com/new](https://vercel.com/new)
2. Vercel detects Next.js automatically
3. No environment variables needed
4. Click **Deploy**

---

## Customization

### Adding a new theme

In `lib/note-themes.ts`, add an object to the `NOTE_THEMES` array following the `NoteTheme` interface:

```ts
{
  id: 'my-theme',
  name: 'My Theme',
  paperBg: '#ffffff',
  paperBgBottom: '#f0f0f0',
  lineColor: '#cccccc',
  lineOpacity: 0.6,
  marginColor: '#ff6666',
  textColor: '#111111',
  placeholderColor: 'rgba(17,17,17,0.28)',
  shadowColor: '0 8px 40px rgba(0,0,0,0.15)',
  wrinkleFill1: '#e0e0e0',
  wrinkleFill2: '#e8e8e8',
  wrinkleFill3: '#f0f0f0',
  wrinkleCrease: 'rgba(180,180,180,0.55)',
  holeColor: '#d0d0d0',
  accentColor: '#555555',
  previewBg: '#ffffff',
}
```

### Adding a new typeface

1. Import it in `app/layout.tsx` from `next/font/google` and add it as a CSS variable.
2. Register it in the `FONT_OPTIONS` array in `lib/note-themes.ts`.
3. Extend it in `tailwind.config.ts` if you want to use it with Tailwind classes.

---



---