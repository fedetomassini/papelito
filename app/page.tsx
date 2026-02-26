"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import html2canvas from "html2canvas";
import { PenLine, Github, Instagram } from "lucide-react";

import LetterCard from "@/components/letter-card";
import EditorToolbar from "@/components/editor-toolbar";
import ThemePicker from "@/components/theme-picker";
import {
	NOTE_THEMES,
	FONT_OPTIONS,
	type NoteTheme,
	type FontId,
	type FontSizeKey,
} from "@/lib/note-themes";

const DEFAULT_THEME = NOTE_THEMES[0];
const MAX_CHARS = 600;
const STORAGE_KEY = "papelito_v1";

type SavedState = {
	text: string;
	themeId: string;
	fontId: FontId;
	fontSize: FontSizeKey;
	bold: boolean;
	italic: boolean;
	align: "left" | "center" | "right";
	tilt: number;
};

export default function HomePage() {
	const [theme, setTheme] = useState<NoteTheme>(DEFAULT_THEME);
	const [text, setText] = useState("");
	const [fontId, setFontId] = useState<FontId>("cormorant");
	const [fontSize, setFontSize] = useState<FontSizeKey>("md");
	const [bold, setBold] = useState(false);
	const [italic, setItalic] = useState(true);
	const [align, setAlign] = useState<"left" | "center" | "right">("left");
	const [tilt, setTilt] = useState(-2);

	// undo / redo
	const [history, setHistory] = useState<string[]>([""]);
	const [historyIdx, setHistoryIdx] = useState(0);
	const historyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const cardRef = useRef<HTMLDivElement>(null);
	const [downloading, setDownloading] = useState(false);

	// restore saved draft
	useEffect(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return;
			const saved: SavedState = JSON.parse(raw);
			const restoredTheme =
				NOTE_THEMES.find((t) => t.id === saved.themeId) ?? DEFAULT_THEME;
			setTheme(restoredTheme);
			setText(saved.text ?? "");
			setFontId(saved.fontId ?? "cormorant");
			setFontSize(saved.fontSize ?? "md");
			setBold(saved.bold ?? false);
			setItalic(saved.italic ?? true);
			setAlign(saved.align ?? "left");
			setTilt(saved.tilt ?? -2);
			setHistory([saved.text ?? ""]);
			if (saved.text)
				toast("Nota restaurada", {
					description: "Tu borrador fue recuperado.",
				});
		} catch {
			/* ignore */
		}
	}, []);

	// auto-save
	useEffect(() => {
		const state: SavedState = {
			text,
			themeId: theme.id,
			fontId,
			fontSize,
			bold,
			italic,
			align,
			tilt,
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	}, [text, theme.id, fontId, fontSize, bold, italic, align, tilt]);

	// text change with debounced history
	const handleTextChange = useCallback(
		(val: string) => {
			setText(val);
			if (historyTimer.current) clearTimeout(historyTimer.current);
			historyTimer.current = setTimeout(() => {
				setHistory((prev) => {
					const trimmed = prev.slice(0, historyIdx + 1);
					return [...trimmed, val].slice(-50);
				});
				setHistoryIdx((prev) => Math.min(prev + 1, 49));
			}, 400);
		},
		[historyIdx],
	);

	const handleUndo = useCallback(() => {
		if (historyIdx <= 0) return;
		const idx = historyIdx - 1;
		setHistoryIdx(idx);
		setText(history[idx]);
	}, [history, historyIdx]);

	const handleRedo = useCallback(() => {
		if (historyIdx >= history.length - 1) return;
		const idx = historyIdx + 1;
		setHistoryIdx(idx);
		setText(history[idx]);
	}, [history, historyIdx]);

	const handleClear = useCallback(() => {
		setText("");
		setHistory([""]);
		setHistoryIdx(0);
		toast("Nota borrada");
	}, []);

	const handleCopy = useCallback(async () => {
		if (!text.trim()) {
			toast.error("No hay texto para copiar");
			return;
		}
		await navigator.clipboard.writeText(text);
		toast.success("Texto copiado al portapapeles");
	}, [text]);

	const handleDownload = useCallback(async () => {
		if (!cardRef.current) return;
		setDownloading(true);
		try {
			const canvas = await html2canvas(cardRef.current, {
				scale: 3,
				useCORS: true,
				backgroundColor: null,
				logging: false,
			});
			const link = document.createElement("a");
			link.download = `papelito-${theme.id}-${Date.now()}.png`;
			link.href = canvas.toDataURL("image/png");
			link.click();
			toast.success("Nota descargada en alta resolución");
		} catch {
			toast.error("Error al descargar la nota");
		} finally {
			setDownloading(false);
		}
	}, [theme.id]);

	// keyboard shortcuts
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			const mod = e.ctrlKey || e.metaKey;
			if (mod && e.key === "z" && !e.shiftKey) {
				e.preventDefault();
				handleUndo();
			}
			if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
				e.preventDefault();
				handleRedo();
			}
			if (mod && e.key === "b") {
				e.preventDefault();
				setBold((v) => !v);
			}
			if (mod && e.key === "i") {
				e.preventDefault();
				setItalic((v) => !v);
			}
			if (mod && e.key === "s") {
				e.preventDefault();
				toast.success("Guardado automáticamente");
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [handleUndo, handleRedo]);

	return (
		<>
			<Toaster position="bottom-right" richColors />

			<div className="min-h-screen flex flex-col dot-grid">
				{/* Header */}
				<header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
					<div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between gap-4">
						<div className="flex items-center gap-2.5">
							<div
								className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
								style={{ background: DEFAULT_THEME.accentColor }}
							>
								<PenLine className="w-4 h-4 text-white" />
							</div>
							<span
								className="text-xl font-semibold tracking-tight"
								style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
							>
								Papelito
							</span>
							<span className="hidden sm:inline-flex items-center text-[11px] text-muted-foreground border border-border rounded-full px-2.5 py-0.5 leading-none">
								Editor de notas
							</span>
						</div>

						<div className="flex items-center gap-3 sm:gap-5">
							<div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground select-none">
								<kbd className="px-1.5 py-0.5 rounded border border-border bg-muted font-mono text-[11px]">
									Ctrl+Z
								</kbd>
								<span>deshacer</span>
								<span className="mx-1 opacity-40">·</span>
								<kbd className="px-1.5 py-0.5 rounded border border-border bg-muted font-mono text-[11px]">
									Ctrl+B
								</kbd>
								<span>negrita</span>
							</div>
							<a
								href="https://instagram.com/fede.tomassini"
								target="_blank"
								rel="noopener noreferrer"
								className="text-muted-foreground hover:text-foreground transition-colors"
								aria-label="Instagram"
							>
								<Instagram className="w-[18px] h-[18px]" />
							</a>
							<a
								href="https://github.com/fedetomassini"
								target="_blank"
								rel="noopener noreferrer"
								className="text-muted-foreground hover:text-foreground transition-colors"
								aria-label="GitHub"
							>
								<Github className="w-[18px] h-[18px]" />
							</a>
						</div>
					</div>
				</header>

				{/* Main */}
				<main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-10 lg:py-14">
					<div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-start justify-center">
						{/* Left — controls */}
						<div className="w-full lg:w-[460px] flex flex-col gap-6 lg:sticky lg:top-24">
							<div>
								<h1
									className="text-3xl font-semibold text-balance leading-tight"
									style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
								>
									Crea tu nota perfecta
								</h1>
								<p className="mt-2 text-sm text-muted-foreground leading-relaxed text-pretty">
									Escribe, personaliza el estilo de papel y tipografía, luego
									descarga como imagen PNG en alta resolución.
								</p>
							</div>

							{/* Formatting toolbar */}
							<div className="rounded-2xl border border-border bg-background/75 backdrop-blur-sm p-5 shadow-sm">
								<EditorToolbar
									fontId={fontId}
									fontSize={fontSize}
									bold={bold}
									italic={italic}
									align={align}
									tilt={tilt}
									charCount={text.length}
									maxChars={MAX_CHARS}
									canUndo={historyIdx > 0}
									canRedo={historyIdx < history.length - 1}
									onFontChange={setFontId}
									onFontSizeChange={setFontSize}
									onBoldToggle={() => setBold((v) => !v)}
									onItalicToggle={() => setItalic((v) => !v)}
									onAlignChange={setAlign}
									onTiltChange={setTilt}
									onUndo={handleUndo}
									onRedo={handleRedo}
									onClear={handleClear}
									onCopy={handleCopy}
									onDownload={handleDownload}
								/>
							</div>

							{/* Theme picker */}
							<div className="rounded-2xl border border-border bg-background/75 backdrop-blur-sm p-5 shadow-sm">
								<ThemePicker activeId={theme.id} onSelect={setTheme} />
							</div>

							{/* Keyboard shortcuts */}
							<div className="rounded-2xl border border-border bg-background/75 backdrop-blur-sm p-5 shadow-sm">
								<p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 select-none">
									Atajos de teclado
								</p>
								<div className="grid grid-cols-2 gap-y-2.5 gap-x-6">
									{[
										["Ctrl + Z", "Deshacer"],
										["Ctrl + Y", "Rehacer"],
										["Ctrl + B", "Negrita"],
										["Ctrl + I", "Cursiva"],
										["Ctrl + S", "Guardar"],
									].map(([key, label]) => (
										<div key={key} className="flex items-center gap-2">
											<kbd className="shrink-0 px-1.5 py-0.5 rounded border border-border bg-muted text-[11px] font-mono whitespace-nowrap">
												{key}
											</kbd>
											<span className="text-xs text-muted-foreground">
												{label}
											</span>
										</div>
									))}
								</div>
							</div>

							{/* Stats strip */}
							<div className="flex items-center gap-4 px-1 flex-wrap">
								{[
									[`${NOTE_THEMES.length} estilos`, "de papel"],
									[`${FONT_OPTIONS.length} tipografías`, "disponibles"],
									["PNG 3×", "alta resolución"],
									["Auto-guardado", "en borrador"],
								].map(([value, label]) => (
									<div key={value} className="flex flex-col">
										<span
											className="text-sm font-semibold text-foreground"
											style={{ fontFamily: "var(--font-playfair), serif" }}
										>
											{value}
										</span>
										<span className="text-[11px] text-muted-foreground">
											{label}
										</span>
									</div>
								))}
							</div>
						</div>

						{/* Right — note preview */}
						<div className="flex-1 flex items-start justify-center lg:pt-8">
							<div
								style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 28 }}
							>
								<LetterCard
									ref={cardRef}
									theme={theme}
									fontId={fontId}
									fontSize={fontSize}
									bold={bold}
									italic={italic}
									align={align}
									tilt={tilt}
									text={text}
									onChange={handleTextChange}
								/>
								<p className="mt-4 text-center text-[11px] text-muted-foreground select-none">
									Haz clic en la nota para escribir
								</p>
							</div>
						</div>
					</div>
				</main>

				{/* Footer */}
				<footer className="border-t border-border bg-background/60 backdrop-blur-sm">
					<div className="max-w-6xl mx-auto px-5 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<div
								className="w-5 h-5 rounded flex items-center justify-center shrink-0"
								style={{ background: DEFAULT_THEME.accentColor }}
							>
								<PenLine className="w-3 h-3 text-white" />
							</div>
							<span
								className="font-medium text-foreground"
								style={{ fontFamily: "var(--font-playfair), serif" }}
							>
								Papelito
							</span>
							<span className="opacity-30">—</span>
							<span className="text-xs">Crea y descarga notas con estilo</span>
						</div>
						<div className="flex items-center gap-5 text-xs text-muted-foreground">
							<span>{NOTE_THEMES.length} estilos de papel</span>
							<span className="opacity-30">·</span>
							<span>{FONT_OPTIONS.length} tipografías</span>
							<span className="opacity-30">·</span>
							<span>Descarga HD gratuita</span>
						</div>
					</div>
				</footer>
			</div>
		</>
	);
}
