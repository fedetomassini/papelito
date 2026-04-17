"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Toaster, toast } from "sonner";
import html2canvas from "html2canvas";
import {
	BookOpenText,
	Clock3,
	Flame,
	Github,
	ImageDown,
	Instagram,
	Save,
	Share2,
	Sparkles,
	Target,
	WandSparkles,
} from "lucide-react";

import LetterCard from "@/components/letter-card";
import EditorToolbar from "@/components/editor-toolbar";
import ThemePicker from "@/components/theme-picker";
import {
	NOTE_THEMES,
	FONT_OPTIONS,
	FONT_SIZES,
	type NoteTheme,
	type FontId,
	type FontSizeKey,
} from "@/lib/note-themes";

const DEFAULT_THEME = NOTE_THEMES[0];
const MAX_CHARS = 460;
const MAX_HISTORY = 50;
const MAX_SNAPSHOTS = 8;
const STORAGE_KEY = "papelito_v2";
const LEGACY_STORAGE_KEY = "papelito_v1";
const STREAK_KEY = "papelito_streak";
const LAST_VISIT_KEY = "papelito_last_visit";

type Align = "left" | "center" | "right";

type Snapshot = {
	id: string;
	label: string;
	text: string;
	title: string;
	themeId: string;
	fontId: FontId;
	fontSize: FontSizeKey;
	bold: boolean;
	italic: boolean;
	align: Align;
	tilt: number;
	sticker: string;
	signature: string;
	showDate: boolean;
	dateIso: string;
	createdAt: string;
};

type SavedState = {
	text: string;
	themeId: string;
	fontId: FontId;
	fontSize: FontSizeKey;
	bold: boolean;
	italic: boolean;
	align: Align;
	tilt: number;
	title: string;
	showDate: boolean;
	dateIso: string;
	signature: string;
	sticker: string;
	focusMode: boolean;
	targetChars: number;
	snapshots: Snapshot[];
	downloads: number;
	shares: number;
};

const QUICK_TEMPLATES = [
	{
		id: "agradecimiento",
		label: "Agradecimiento",
		title: "Gracias por todo",
		text: "Gracias por estar siempre. Tu apoyo hizo una diferencia enorme y no queria dejar pasar el dia sin decirtelo.",
		sticker: "✨",
		signature: "Con carino",
	},
	{
		id: "recordatorio",
		label: "Recordatorio",
		title: "Pendientes de hoy",
		text: "1. Revisar ideas\n2. Resolver lo urgente\n3. Cerrar el dia con una nota positiva",
		sticker: "📌",
		signature: "",
	},
	{
		id: "inspiracion",
		label: "Inspiracion",
		title: "Mini manifiesto",
		text: "Hacer menos, pero mejor.\nElegir claridad antes que ruido.\nConstruir todos los dias, aunque sea poco.",
		sticker: "⭐",
		signature: "Yo",
	},
	{
		id: "carta",
		label: "Carta corta",
		title: "Hola",
		text: "Te escribo esta nota para recordarte algo simple: vas por buen camino. Respira, ordena una cosa y segui.",
		sticker: "🌿",
		signature: "Abrazo",
	},
] as const;

const STICKER_OPTIONS = [
	{ value: "none", label: "Sin sticker" },
	{ value: "✨", label: "Brillo" },
	{ value: "❤️", label: "Corazon" },
	{ value: "📌", label: "Pin" },
	{ value: "🌿", label: "Hoja" },
	{ value: "⭐", label: "Estrella" },
] as const;

function toDateKey(date: Date) {
	const y = date.getFullYear();
	const m = `${date.getMonth() + 1}`.padStart(2, "0");
	const d = `${date.getDate()}`.padStart(2, "0");
	return `${y}-${m}-${d}`;
}

function formatDateLabel(isoDate: string) {
	const [year, month, day] = isoDate.split("-").map(Number);
	if (!year || !month || !day) return isoDate;
	const date = new Date(year, month - 1, day);
	return new Intl.DateTimeFormat("es-AR", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(date);
}

function createId() {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}
	return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function randomFrom<T>(items: readonly T[]) {
	return items[Math.floor(Math.random() * items.length)];
}

export default function HomePage() {
	const [theme, setTheme] = useState<NoteTheme>(DEFAULT_THEME);
	const [text, setText] = useState("");
	const [fontId, setFontId] = useState<FontId>("cormorant");
	const [fontSize, setFontSize] = useState<FontSizeKey>("md");
	const [bold, setBold] = useState(false);
	const [italic, setItalic] = useState(true);
	const [align, setAlign] = useState<Align>("left");
	const [tilt, setTilt] = useState(0);

	const [title, setTitle] = useState("Mi nota");
	const [showDate, setShowDate] = useState(true);
	const [dateIso, setDateIso] = useState(toDateKey(new Date()));
	const [signature, setSignature] = useState("");
	const [sticker, setSticker] = useState<string>("none");
	const [targetChars, setTargetChars] = useState(220);
	const [focusMode, setFocusMode] = useState(false);

	const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
	const [downloads, setDownloads] = useState(0);
	const [shares, setShares] = useState(0);
	const [streak, setStreak] = useState(1);
	const [exportingAction, setExportingAction] = useState<
		"download" | "copy-image" | "share" | null
	>(null);
	const [shareSupported, setShareSupported] = useState(false);

	const [history, setHistory] = useState<string[]>([""]);
	const [historyIdx, setHistoryIdx] = useState(0);
	const historyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const historyIdxRef = useRef(0);

	const cardRef = useRef<HTMLDivElement>(null);

	const formattedDate = useMemo(() => formatDateLabel(dateIso), [dateIso]);

	const wordCount = useMemo(() => {
		const cleaned = text.trim();
		if (!cleaned) return 0;
		return cleaned.split(/\s+/).filter(Boolean).length;
	}, [text]);

	const lineCount = useMemo(() => {
		if (!text) return 0;
		return text.split(/\r?\n/).length;
	}, [text]);

	const longestWord = useMemo(() => {
		const words = text.match(/[\p{L}\p{N}_-]+/gu) ?? [];
		if (!words.length) return "-";
		return words.reduce((longest, current) =>
			current.length > longest.length ? current : longest,
		);
	}, [text]);

	const readingMinutes = wordCount === 0 ? 0 : Math.max(1, Math.ceil(wordCount / 180));

	const vibe = useMemo(() => {
		if (!text.trim()) return "Silenciosa";
		const exclamations = (text.match(/[!¡]/g) ?? []).length;
		const questions = (text.match(/[?¿]/g) ?? []).length;
		if (exclamations >= 3) return "Energica";
		if (questions >= 2) return "Reflexiva";
		if (wordCount >= 80) return "Narrativa";
		return "Calma";
	}, [text, wordCount]);

	const goalProgress = Math.min(100, (text.length / Math.max(targetChars, 1)) * 100);
	const goalDelta = targetChars - text.length;

	historyIdxRef.current = historyIdx;

	const pushHistory = useCallback((nextText: string) => {
		setHistory((prev) => {
			const base = prev.slice(0, historyIdxRef.current + 1);
			if (base[base.length - 1] === nextText) return prev;
			const next = [...base, nextText].slice(-MAX_HISTORY);
			setHistoryIdx(next.length - 1);
			return next;
		});
	}, []);

	const captureCard = useCallback(async () => {
		if (!cardRef.current) throw new Error("CARD_NOT_READY");
		return html2canvas(cardRef.current, {
			scale: 3,
			useCORS: true,
			backgroundColor: null,
			logging: false,
		});
	}, []);

	const handleTextChange = useCallback(
		(value: string) => {
			setText(value);
			if (historyTimer.current) clearTimeout(historyTimer.current);
			historyTimer.current = setTimeout(() => {
				pushHistory(value);
			}, 350);
		},
		[pushHistory],
	);

	const handleUndo = useCallback(() => {
		if (historyIdx <= 0) return;
		const nextIdx = historyIdx - 1;
		setHistoryIdx(nextIdx);
		setText(history[nextIdx] ?? "");
	}, [history, historyIdx]);

	const handleRedo = useCallback(() => {
		if (historyIdx >= history.length - 1) return;
		const nextIdx = historyIdx + 1;
		setHistoryIdx(nextIdx);
		setText(history[nextIdx] ?? "");
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
		try {
			await navigator.clipboard.writeText(text);
			toast.success("Texto copiado al portapapeles");
		} catch {
			toast.error("No se pudo copiar el texto");
		}
	}, [text]);

	const handleSaveSnapshot = useCallback(() => {
		if (!text.trim()) {
			toast.error("Escribe algo antes de guardar una version");
			return;
		}
		const snapshot: Snapshot = {
			id: createId(),
			label: title.trim() || `Version ${snapshots.length + 1}`,
			text,
			title,
			themeId: theme.id,
			fontId,
			fontSize,
			bold,
			italic,
			align,
			tilt,
			sticker,
			signature,
			showDate,
			dateIso,
			createdAt: new Date().toISOString(),
		};
		setSnapshots((prev) => [snapshot, ...prev].slice(0, MAX_SNAPSHOTS));
		toast.success("Version guardada");
	}, [
		align,
		bold,
		dateIso,
		fontId,
		fontSize,
		italic,
		signature,
		snapshots.length,
		showDate,
		sticker,
		text,
		theme.id,
		tilt,
		title,
	]);

	const handleRestoreSnapshot = useCallback(
		(snapshot: Snapshot) => {
			const restoredTheme =
				NOTE_THEMES.find((item) => item.id === snapshot.themeId) ?? DEFAULT_THEME;
			setTheme(restoredTheme);
			setText(snapshot.text);
			setTitle(snapshot.title);
			setFontId(snapshot.fontId);
			setFontSize(snapshot.fontSize);
			setBold(snapshot.bold);
			setItalic(snapshot.italic);
			setAlign(snapshot.align);
			setTilt(snapshot.tilt);
			setSticker(snapshot.sticker);
			setSignature(snapshot.signature);
			setShowDate(snapshot.showDate);
			setDateIso(snapshot.dateIso);
			pushHistory(snapshot.text);
			toast("Version restaurada");
		},
		[pushHistory],
	);

	const handleSurprise = useCallback(() => {
		const randomTheme = randomFrom(NOTE_THEMES);
		const randomFont = randomFrom(FONT_OPTIONS).id;
		const randomSize = randomFrom(Object.keys(FONT_SIZES) as FontSizeKey[]);
		const randomSticker = randomFrom(STICKER_OPTIONS).value;
		setTheme(randomTheme);
		setFontId(randomFont);
		setFontSize(randomSize);
		setTilt(Math.floor(Math.random() * 11) - 5);
		setSticker(randomSticker);
		toast("Modo sorpresa aplicado", {
			description: "Cambiamos estilo, tipografia y angulo automaticamente.",
		});
	}, []);

	const handleApplyTemplate = useCallback(
		(template: (typeof QUICK_TEMPLATES)[number]) => {
			setTitle(template.title);
			setText(template.text);
			setSticker(template.sticker);
			setSignature(template.signature);
			pushHistory(template.text);
			toast.success(`Plantilla ${template.label} aplicada`);
		},
		[pushHistory],
	);

	const handleDownload = useCallback(async () => {
		setExportingAction("download");
		try {
			const canvas = await captureCard();
			const link = document.createElement("a");
			link.download = `papelito-${theme.id}-${Date.now()}.png`;
			link.href = canvas.toDataURL("image/png");
			link.click();
			setDownloads((value) => value + 1);
			toast.success("Nota descargada en alta resolucion");
		} catch {
			toast.error("Error al descargar la nota");
		} finally {
			setExportingAction(null);
		}
	}, [captureCard, theme.id]);

	const handleCopyImage = useCallback(async () => {
		if (
			typeof navigator === "undefined" ||
			typeof navigator.clipboard?.write !== "function" ||
			typeof ClipboardItem === "undefined"
		) {
			toast.error("Tu navegador no soporta copiar imagenes");
			return;
		}

		setExportingAction("copy-image");
		try {
			const canvas = await captureCard();
			const blob = await new Promise<Blob | null>((resolve) =>
				canvas.toBlob(resolve, "image/png"),
			);
			if (!blob) throw new Error("NO_BLOB");
			await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
			toast.success("Imagen copiada al portapapeles");
		} catch {
			toast.error("No se pudo copiar la imagen");
		} finally {
			setExportingAction(null);
		}
	}, [captureCard]);

	const handleShare = useCallback(async () => {
		if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
			toast.error("Compartir no esta disponible en este navegador");
			return;
		}

		setExportingAction("share");
		try {
			const canvas = await captureCard();
			const blob = await new Promise<Blob | null>((resolve) =>
				canvas.toBlob(resolve, "image/png"),
			);
			if (!blob) throw new Error("NO_BLOB");

			const file = new File([blob], `papelito-${Date.now()}.png`, {
				type: "image/png",
			});
			const shareData: ShareData = {
				title: title.trim() || "Nota de Papelito",
				text: text.slice(0, 120),
				files: [file],
			};
			const navigatorWithCanShare = navigator as Navigator & {
				canShare?: (data?: ShareData) => boolean;
			};
			if (
				typeof navigatorWithCanShare.canShare === "function" &&
				!navigatorWithCanShare.canShare({ files: [file] })
			) {
				toast.error("Tu dispositivo no permite compartir este archivo");
				return;
			}

			await navigator.share(shareData);
			setShares((value) => value + 1);
			toast.success("Nota compartida");
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError") return;
			toast.error("No se pudo compartir la nota");
		} finally {
			setExportingAction(null);
		}
	}, [captureCard, text, title]);

	useEffect(() => {
		try {
			const raw =
				localStorage.getItem(STORAGE_KEY) ??
				localStorage.getItem(LEGACY_STORAGE_KEY);
			if (raw) {
				const saved = JSON.parse(raw) as Partial<SavedState>;
				const restoredTheme =
					NOTE_THEMES.find((item) => item.id === saved.themeId) ?? DEFAULT_THEME;
				setTheme(restoredTheme);
				setText(saved.text ?? "");
				setFontId(saved.fontId ?? "cormorant");
				setFontSize(saved.fontSize ?? "md");
				setBold(saved.bold ?? false);
				setItalic(saved.italic ?? true);
				setAlign(saved.align ?? "left");
				setTilt(saved.tilt ?? 0);
				setTitle(saved.title ?? "Mi nota");
				setShowDate(saved.showDate ?? true);
				setDateIso(saved.dateIso ?? toDateKey(new Date()));
				setSignature(saved.signature ?? "");
				setSticker(saved.sticker ?? "none");
				setFocusMode(saved.focusMode ?? false);
				setTargetChars(saved.targetChars ?? 220);
				setDownloads(saved.downloads ?? 0);
				setShares(saved.shares ?? 0);

				const restoredSnapshots = Array.isArray(saved.snapshots)
					? saved.snapshots.slice(0, MAX_SNAPSHOTS)
					: [];
				setSnapshots(restoredSnapshots as Snapshot[]);

				const restoredText = saved.text ?? "";
				setHistory([restoredText]);
				setHistoryIdx(0);
				if (restoredText.trim()) {
					toast("Borrador restaurado", {
						description: "Recuperamos tu ultima sesion automaticamente.",
					});
				}
			}
		} catch {
			// ignore restore errors
		}

		const today = toDateKey(new Date());
		const yesterday = toDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
		const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
		const savedStreak = Number(localStorage.getItem(STREAK_KEY) ?? "0");

		let nextStreak = savedStreak > 0 ? savedStreak : 1;
		if (lastVisit === today) {
			nextStreak = savedStreak > 0 ? savedStreak : 1;
		} else if (lastVisit === yesterday) {
			nextStreak = savedStreak + 1;
		} else {
			nextStreak = 1;
		}

		localStorage.setItem(LAST_VISIT_KEY, today);
		localStorage.setItem(STREAK_KEY, String(nextStreak));
		setStreak(nextStreak);
		setShareSupported(typeof navigator.share === "function");

		return () => {
			if (historyTimer.current) clearTimeout(historyTimer.current);
		};
	}, []);

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
			title,
			showDate,
			dateIso,
			signature,
			sticker,
			focusMode,
			targetChars,
			snapshots,
			downloads,
			shares,
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	}, [
		align,
		bold,
		dateIso,
		downloads,
		focusMode,
		fontId,
		fontSize,
		italic,
		signature,
		shares,
		showDate,
		snapshots,
		sticker,
		targetChars,
		text,
		theme.id,
		tilt,
		title,
	]);

	useEffect(() => {
		const handler = (event: KeyboardEvent) => {
			const mod = event.ctrlKey || event.metaKey;
			const key = event.key.toLowerCase();

			if (mod && key === "z" && !event.shiftKey) {
				event.preventDefault();
				handleUndo();
			}
			if (mod && (key === "y" || (key === "z" && event.shiftKey))) {
				event.preventDefault();
				handleRedo();
			}
			if (mod && key === "b") {
				event.preventDefault();
				setBold((value) => !value);
			}
			if (mod && key === "i") {
				event.preventDefault();
				setItalic((value) => !value);
			}
			if (mod && event.shiftKey && key === "s") {
				event.preventDefault();
				handleSaveSnapshot();
			}
			if (mod && key === "enter") {
				event.preventDefault();
				handleDownload();
			}
			if (mod && key === "k") {
				event.preventDefault();
				handleSurprise();
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [handleDownload, handleRedo, handleSaveSnapshot, handleSurprise, handleUndo]);

	return (
		<>
			<Toaster position="bottom-right" richColors />

			<div className="min-h-screen flex flex-col dot-grid">
				<header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
					<div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between gap-4">
						<div className="flex items-center gap-2.5">
							<div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
								<Image
									src="/icon-light.ico"
									width={32}
									height={32}
									quality={100}
									alt="Icono de lapiz"
								/>
							</div>
							<span
								className="text-xl font-semibold tracking-tight"
								style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
							>
								Papelito
							</span>
							<span className="hidden sm:inline-flex items-center text-[11px] mt-1 text-muted-foreground border border-border rounded-full px-2.5 py-0.5 leading-none">
								Estudio creativo
							</span>
						</div>

						<div className="flex items-center gap-2 sm:gap-4">
							<button
								onClick={() => setFocusMode((value) => !value)}
								className="text-xs px-2.5 py-1 rounded-full border border-border bg-background hover:bg-muted transition-colors"
							>
								{focusMode ? "Salir enfoque" : "Modo enfoque"}
							</button>
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

				<main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-10 lg:py-14">
					<div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-start justify-center">
						<div className="w-full lg:w-[460px] flex flex-col gap-6">
							<div>
								<h1
									className="text-3xl font-semibold text-balance leading-tight"
									style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
								>
									Disena notas con personalidad
								</h1>
								<p className="mt-2 text-sm text-muted-foreground leading-relaxed text-pretty">
									Ahora podes crear, versionar, medir y compartir tus notas
									desde un solo lugar.
								</p>
							</div>

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
									onBoldToggle={() => setBold((value) => !value)}
									onItalicToggle={() => setItalic((value) => !value)}
									onAlignChange={setAlign}
									onTiltChange={setTilt}
									onUndo={handleUndo}
									onRedo={handleRedo}
									onClear={handleClear}
									onCopy={handleCopy}
									onDownload={handleDownload}
									onSaveSnapshot={handleSaveSnapshot}
									onSurprise={handleSurprise}
									downloading={exportingAction === "download"}
								/>
							</div>

							<div className="rounded-2xl border border-border bg-background/75 backdrop-blur-sm p-5 shadow-sm">
								<ThemePicker activeId={theme.id} onSelect={setTheme} />
							</div>

							<div className="rounded-2xl border border-border bg-background/75 backdrop-blur-sm p-5 shadow-sm">
								<p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
									Cabecera de nota
								</p>
								<div className="flex flex-col gap-3">
									<div>
										<label className="text-xs text-muted-foreground">
											Titulo
										</label>
										<input
											value={title}
											onChange={(event) => setTitle(event.target.value.slice(0, 44))}
											placeholder="Titulo corto"
											className="mt-1 w-full h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
										/>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										<div>
											<label className="text-xs text-muted-foreground">Fecha</label>
											<input
												type="date"
												disabled={!showDate}
												value={dateIso}
												onChange={(event) => setDateIso(event.target.value)}
												className="mt-1 w-full h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none disabled:opacity-40"
											/>
										</div>
										<div>
											<label className="text-xs text-muted-foreground">Firma</label>
											<input
												value={signature}
												onChange={(event) =>
													setSignature(event.target.value.slice(0, 28))
												}
												placeholder="Tu nombre"
												className="mt-1 w-full h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
											/>
										</div>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										<label className="flex items-center gap-2 text-sm text-muted-foreground">
											<input
												type="checkbox"
												checked={showDate}
												onChange={(event) => setShowDate(event.target.checked)}
												className="h-4 w-4 rounded border-border"
											/>
											Mostrar fecha
										</label>
										<div>
											<label className="text-xs text-muted-foreground">Sticker</label>
											<select
												value={sticker}
												onChange={(event) => setSticker(event.target.value)}
												className="mt-1 w-full h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none"
											>
												{STICKER_OPTIONS.map((option) => (
													<option key={option.value} value={option.value}>
														{option.label}
													</option>
												))}
											</select>
										</div>
									</div>
								</div>
							</div>

							{!focusMode && (
								<>
									<div className="rounded-2xl border border-border bg-background/75 backdrop-blur-sm p-5 shadow-sm">
										<div className="flex items-center justify-between gap-3 mb-3">
											<p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
												Plantillas rapidas
											</p>
											<WandSparkles className="w-4 h-4 text-muted-foreground" />
										</div>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
											{QUICK_TEMPLATES.map((template) => (
												<button
													key={template.id}
													onClick={() => handleApplyTemplate(template)}
													className="text-left rounded-lg border border-border bg-background px-3 py-2 hover:border-foreground/25 hover:bg-muted transition-colors"
												>
													<p className="text-sm font-medium">{template.label}</p>
													<p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
														{template.text}
													</p>
												</button>
											))}
										</div>
									</div>

									<div className="rounded-2xl border border-border bg-background/75 backdrop-blur-sm p-5 shadow-sm">
										<div className="flex items-center justify-between gap-2 mb-3">
											<p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
												Objetivo de escritura
											</p>
											<Target className="w-4 h-4 text-muted-foreground" />
										</div>
										<input
											type="range"
											min={80}
											max={MAX_CHARS}
											step={10}
											value={targetChars}
											onChange={(event) =>
												setTargetChars(Number(event.target.value))
											}
											className="w-full"
										/>
										<div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
											<span>Meta: {targetChars} caracteres</span>
											<span>{Math.round(goalProgress)}%</span>
										</div>
										<div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
											<div
												className="h-full rounded-full bg-foreground/60 transition-all"
												style={{ width: `${goalProgress}%` }}
											/>
										</div>
										<p className="mt-2 text-xs text-muted-foreground">
											{goalDelta >= 0
												? `Te faltan ${goalDelta} caracteres para cumplir la meta.`
												: `Superaste la meta por ${Math.abs(goalDelta)} caracteres.`}
										</p>
									</div>

									<div className="rounded-2xl border border-border bg-background/75 backdrop-blur-sm p-5 shadow-sm">
										<div className="flex items-center justify-between gap-3 mb-3">
											<p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
												Versiones guardadas
											</p>
											<button
												onClick={handleSaveSnapshot}
												className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border border-border hover:bg-muted"
											>
												<Save className="w-3 h-3" /> Guardar
											</button>
										</div>
										{snapshots.length === 0 ? (
											<p className="text-xs text-muted-foreground">
												Todavia no hay versiones. Guarda una para poder volver
												atras.
											</p>
										) : (
											<div className="space-y-2 max-h-40 overflow-y-auto pr-1">
												{snapshots.map((snapshot) => (
													<button
														key={snapshot.id}
														onClick={() => handleRestoreSnapshot(snapshot)}
														className="w-full text-left rounded-lg border border-border bg-background px-3 py-2 hover:border-foreground/25 hover:bg-muted transition-colors"
													>
														<p className="text-sm font-medium truncate">
															{snapshot.label}
														</p>
														<p className="text-[11px] text-muted-foreground mt-0.5">
															{new Date(snapshot.createdAt).toLocaleString("es-AR", {
																hour: "2-digit",
																minute: "2-digit",
																day: "2-digit",
																month: "short",
															})}
														</p>
													</button>
												))}
											</div>
										)}
									</div>

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
												["Ctrl + Shift + S", "Guardar version"],
												["Ctrl + Enter", "Descargar"],
												["Ctrl + K", "Sorpresa"],
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
								</>
							)}

							<div className="flex items-center gap-4 px-1 flex-wrap">
								{[
									[`${NOTE_THEMES.length} estilos`, "de papel"],
									[`${FONT_OPTIONS.length} tipografias`, "disponibles"],
									[`${downloads} descargas`, "acumuladas"],
									[`${shares} compartidas`, "desde la app"],
								].map(([value, label]) => (
									<div key={value} className="flex flex-col max-md:mx-auto">
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

						<div className="flex-1 w-full flex flex-col items-center lg:pt-8">
							<div style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 28 }}>
								<LetterCard
									ref={cardRef}
									theme={theme}
									fontId={fontId}
									fontSize={fontSize}
									bold={bold}
									italic={italic}
									align={align}
									tilt={tilt}
									title={title}
									showDate={showDate}
									dateLabel={formattedDate}
									signature={signature}
									sticker={sticker}
									text={text}
									onChange={handleTextChange}
								/>
								<p className="mt-4 text-center text-[11px] text-muted-foreground select-none">
									Haz clic en la nota para escribir
								</p>
							</div>

							<div className="w-full max-w-[520px] grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="rounded-2xl border border-border bg-background/75 backdrop-blur-sm p-5 shadow-sm">
									<p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
										Exportar y compartir
									</p>
									<div className="flex flex-wrap gap-2">
										<button
											onClick={handleDownload}
											disabled={exportingAction !== null}
											className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-foreground text-primary-foreground text-xs font-medium disabled:opacity-40"
										>
											<ImageDown className="w-3.5 h-3.5" />
											PNG
										</button>
										<button
											onClick={handleCopyImage}
											disabled={exportingAction !== null}
											className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background text-xs font-medium hover:bg-muted disabled:opacity-40"
										>
											<Sparkles className="w-3.5 h-3.5" />
											Copiar imagen
										</button>
										<button
											onClick={handleShare}
											disabled={!shareSupported || exportingAction !== null}
											className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background text-xs font-medium hover:bg-muted disabled:opacity-40"
										>
											<Share2 className="w-3.5 h-3.5" />
											Compartir
										</button>
									</div>
									<p className="mt-3 text-[11px] text-muted-foreground">
										{shareSupported
											? "Compartir esta activo en tu navegador."
											: "Compartir no esta disponible en este dispositivo."}
									</p>
								</div>

								<div className="rounded-2xl border border-border bg-background/75 backdrop-blur-sm p-5 shadow-sm">
									<p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
										Analitica en vivo
									</p>
									<div className="grid grid-cols-2 gap-2.5 text-sm">
										<div className="rounded-lg border border-border bg-background px-2.5 py-2">
											<p className="text-muted-foreground text-[11px]">Palabras</p>
											<p className="font-semibold">{wordCount}</p>
										</div>
										<div className="rounded-lg border border-border bg-background px-2.5 py-2">
											<p className="text-muted-foreground text-[11px]">Lineas</p>
											<p className="font-semibold">{lineCount}</p>
										</div>
										<div className="rounded-lg border border-border bg-background px-2.5 py-2">
											<p className="text-muted-foreground text-[11px]">Lectura</p>
											<p className="font-semibold inline-flex items-center gap-1">
												<Clock3 className="w-3 h-3" />
												{readingMinutes} min
											</p>
										</div>
										<div className="rounded-lg border border-border bg-background px-2.5 py-2">
											<p className="text-muted-foreground text-[11px]">Tono</p>
											<p className="font-semibold">{vibe}</p>
										</div>
									</div>
									<div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
										<span className="inline-flex items-center gap-1">
											<BookOpenText className="w-3 h-3" />
											Palabra larga: {longestWord}
										</span>
										<span className="inline-flex items-center gap-1">
											<Flame className="w-3 h-3" />
											Racha: {streak} dia(s)
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</main>

				<footer className="border-t border-border bg-background/60 backdrop-blur-sm">
					<div className="max-w-6xl mx-auto px-5 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
								<Image
									src="/icon-light.ico"
									width={32}
									height={32}
									quality={100}
									alt="Icono de lapiz"
								/>
							</div>
							<span
								className="font-medium text-foreground"
								style={{ fontFamily: "var(--font-playfair), serif" }}
							>
								Papelito
							</span>
							<span className="opacity-30">-</span>
							<span className="text-xs">Notas con estilo, versionado y exportacion</span>
						</div>
						<div className="flex items-center gap-5 text-xs text-muted-foreground">
							<span>{NOTE_THEMES.length} estilos de papel</span>
							<span className="opacity-30">-</span>
							<span>{snapshots.length} versiones guardadas</span>
							<span className="opacity-30">-</span>
							<span>{downloads} descargas</span>
						</div>
					</div>
				</footer>
			</div>
		</>
	);
}
