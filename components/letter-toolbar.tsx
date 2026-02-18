"use client"

import { Download, Pencil, Check } from "lucide-react"

interface LetterToolbarProps {
  isEditing: boolean
  onToggleEdit: () => void
  onDownload: () => void
  isDownloading: boolean
}

export default function LetterToolbar({
  isEditing,
  onToggleEdit,
  onDownload,
  isDownloading,
}: LetterToolbarProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onToggleEdit}
        className="group flex items-center gap-2 px-5 py-2.5 rounded-sm border border-border text-foreground transition-all hover:bg-secondary/60"
        style={{
          fontFamily: "var(--font-body), 'Cormorant Garamond', serif",
          fontSize: "15px",
          letterSpacing: "0.02em",
        }}
      >
        {isEditing ? (
          <>
            <Check className="w-4 h-4" />
            <span className="italic">Listo</span>
          </>
        ) : (
          <>
            <Pencil className="w-4 h-4" />
            <span className="italic">Editar</span>
          </>
        )}
      </button>

      {!isEditing && (
        <button
          onClick={onDownload}
          disabled={isDownloading}
          className="group flex items-center gap-2 px-5 py-2.5 rounded-sm bg-foreground text-background transition-all hover:opacity-90 disabled:opacity-50"
          style={{
            fontFamily: "var(--font-body), 'Cormorant Garamond', serif",
            fontSize: "15px",
            letterSpacing: "0.02em",
          }}
        >
          <Download className="w-4 h-4" />
          <span className="italic">
            {isDownloading ? "Descargando..." : "Descargar"}
          </span>
        </button>
      )}
    </div>
  )
}
