"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Toaster, toast } from "sonner";
import html2canvas from "html2canvas";
import { z } from "zod";
import {
	Clock3,
	Github,
	ImageDown,
	Download,
	FilePlus2,
	Files,
	Instagram,
	Search,
	Save,
	Share2,
	Sparkles,
	Target,
	Trash2,
	Upload,
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
const WORKSPACE_KEY = "papelito_workspace_v1";
const LEGACY_STORAGE_KEY = "papelito_v1";

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

type NoteRecord = {
	id: string;
	updatedAt: string;
	data: SavedState;
};

const snapshotSchema = z.object({
	id: z.string(),
	label: z.string(),
	text: z.string().max(MAX_CHARS),
	title: z.string(),
	themeId: z.string(),
	fontId: z.enum(["cormorant", "playfair", "lora", "crimson", "sacramento"]),
	fontSize: z.enum(["sm", "md", "lg"]),
	bold: z.boolean(),
	italic: z.boolean(),
	align: z.enum(["left", "center", "right"]),
	tilt: z.number(),
	sticker: z.string(),
	signature: z.string(),
	showDate: z.boolean(),
	dateIso: z.string(),
	createdAt: z.string(),
});

const stateSchema = z.object({
	text: z.string().max(MAX_CHARS),
	themeId: z.string(),
	fontId: snapshotSchema.shape.fontId,
	fontSize: snapshotSchema.shape.fontSize,
	bold: z.boolean(),
	italic: z.boolean(),
	align: snapshotSchema.shape.align,
	tilt: z.number(),
	title: z.string().max(44),
	showDate: z.boolean(),
	dateIso: z.string(),
	signature: z.string().max(28),
	sticker: z.string(),
	focusMode: z.boolean(),
	targetChars: z.number().min(80).max(MAX_CHARS),
	snapshots: z.array(snapshotSchema).max(MAX_SNAPSHOTS),
	downloads: z.number().min(0),
	shares: z.number().min(0),
});

const workspaceSchema = z.object({
	activeId: z.string(),
	notes: z.array(z.object({ id: z.string(), updatedAt: z.string(), data: stateSchema })).min(1).max(100),
});

function emptyNote(): SavedState {
	return {
		text: "", themeId: DEFAULT_THEME.id, fontId: "cormorant", fontSize: "md",
		bold: false, italic: true, align: "left", tilt: 0, title: "Mi nota",
		showDate: true, dateIso: toDateKey(new Date()), signature: "", sticker: "none",
		focusMode: false, targetChars: 220, snapshots: [], downloads: 0, shares: 0,
	};
}

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
	const [exportingAction, setExportingAction] = useState<
		"download" | "copy-image" | "share" | null
	>(null);
	const [shareSupported, setShareSupported] = useState(false);
	const [notes, setNotes] = useState<NoteRecord[]>([]);
	const [activeId, setActiveId] = useState("");
	const [ready, setReady] = useState(false);
	const [search, setSearch] = useState("");
	const importRef = useRef<HTMLInputElement>(null);

	const [history, setHistory] = useState<string[]>([""]);
	const [historyIdx, setHistoryIdx] = useState(0);
	const historyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const historyIdxRef = useRef(0);
	const storageWarningShown = useRef(false);

	const cardRef = useRef<HTMLDivElement>(null);
	const currentData: SavedState = {
		text, themeId: theme.id, fontId, fontSize, bold, italic, align, tilt,
		title, showDate, dateIso, signature, sticker, focusMode, targetChars,
		snapshots, downloads, shares,
	};
	const filteredNotes = notes.filter((note) =>
		`${note.data.title} ${note.data.text}`.toLocaleLowerCase("es").includes(search.toLocaleLowerCase("es")),
	).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

	const applyNote = (data: SavedState) => {
		if (historyTimer.current) clearTimeout(historyTimer.current);
		historyTimer.current = null;
		setTheme(NOTE_THEMES.find((item) => item.id === data.themeId) ?? DEFAULT_THEME);
		setText(data.text);
		setFontId(data.fontId);
		setFontSize(data.fontSize);
		setBold(data.bold);
		setItalic(data.italic);
		setAlign(data.align);
		setTilt(data.tilt);
		setTitle(data.title);
		setShowDate(data.showDate);
		setDateIso(data.dateIso);
		setSignature(data.signature);
		setSticker(data.sticker);
		setFocusMode(data.focusMode);
		setTargetChars(data.targetChars);
		setSnapshots(data.snapshots);
		setDownloads(data.downloads);
		setShares(data.shares);
		setHistory([data.text]);
		setHistoryIdx(0);
		historyIdxRef.current = 0;
	};

	const selectNote = (note: NoteRecord) => {
		if (note.id === activeId) return;
		setNotes((previous) => previous.map((item) => item.id === activeId
			? { ...item, data: currentData } : item));
		setActiveId(note.id);
		applyNote(note.data);
	};

	const createNote = (data = emptyNote()) => {
		if (notes.length >= 100) {
			toast.error("Llegaste al límite de 100 notas. Exportá un respaldo antes de borrar alguna.");
			return;
		}
		const note = { id: createId(), updatedAt: new Date().toISOString(), data };
		setNotes((previous) => [note, ...previous.map((item) => item.id === activeId
			? { ...item, data: currentData } : item)]);
		setSearch("");
		setActiveId(note.id);
		applyNote(data);
	};

	const deleteNote = (note: NoteRecord) => {
		if (!window.confirm(`¿Eliminar “${note.data.title || "Sin título"}”? Esta acción no se puede deshacer.`)) return;
		if (notes.length === 1) {
			const replacement = { id: createId(), updatedAt: new Date().toISOString(), data: emptyNote() };
			setNotes([replacement]);
			setActiveId(replacement.id);
			applyNote(replacement.data);
			return;
		}
		setNotes((previous) => previous.filter((item) => item.id !== note.id));
		if (note.id === activeId) {
			const next = notes.find((item) => item.id !== note.id)!;
			setActiveId(next.id);
			applyNote(next.data);
		}
		toast.success("Nota eliminada");
	};

	const exportBackup = () => {
		const workspace = { activeId, notes: notes.map((note) => note.id === activeId
			? { ...note, data: currentData } : note) };
		const url = URL.createObjectURL(new Blob([JSON.stringify(workspace, null, 2)], { type: "application/json" }));
		const link = document.createElement("a");
		link.href = url;
		link.download = `papelito-respaldo-${toDateKey(new Date())}.json`;
		link.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	};

	const importBackup = async (file: File) => {
		if (file.size > 2_000_000) {
			toast.error("El archivo supera los 2 MB");
			return;
		}
		try {
			const parsed = workspaceSchema.parse(JSON.parse(await file.text()));
			if (new Set(parsed.notes.map((note) => note.id)).size !== parsed.notes.length ||
				!parsed.notes.some((note) => note.id === parsed.activeId)) throw new Error("Invalid workspace");
			if (!window.confirm("¿Reemplazar todas las notas locales con este respaldo?")) return;
			setNotes(parsed.notes);
			setSearch("");
			setActiveId(parsed.activeId);
			applyNote(parsed.notes.find((note) => note.id === parsed.activeId)!.data);
			toast.success("Respaldo importado");
		} catch {
			toast.error("El archivo no es un respaldo válido de Papelito");
		}
	};

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

	const readingMinutes = wordCount === 0 ? 0 : Math.max(1, Math.ceil(wordCount / 180));

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
				historyTimer.current = null;
			}, 350);
		},
		[pushHistory],
	);

	const handleUndo = useCallback(() => {
		if (historyTimer.current) {
			clearTimeout(historyTimer.current);
			historyTimer.current = null;
			if (text !== history[historyIdx]) {
				setHistory((previous) => [...previous.slice(0, historyIdx + 1), text].slice(-MAX_HISTORY));
				setHistoryIdx(Math.min(historyIdx, MAX_HISTORY - 2));
				setText(history[historyIdx] ?? "");
				return;
			}
		}
		if (historyIdx <= 0) return;
		const nextIdx = historyIdx - 1;
		setHistoryIdx(nextIdx);
		setText(history[nextIdx] ?? "");
	}, [history, historyIdx, text]);

	const handleRedo = useCallback(() => {
		if (historyTimer.current) {
			clearTimeout(historyTimer.current);
			historyTimer.current = null;
			pushHistory(text);
			return;
		}
		if (historyIdx >= history.length - 1) return;
		const nextIdx = historyIdx + 1;
		setHistoryIdx(nextIdx);
		setText(history[nextIdx] ?? "");
	}, [history, historyIdx, pushHistory, text]);

	const handleClear = useCallback(() => {
		if (historyTimer.current) clearTimeout(historyTimer.current);
		historyTimer.current = null;
		if (!text) return;
		const next = [...history.slice(0, historyIdx + 1), ...(text !== history[historyIdx] ? [text] : []), ""].slice(-MAX_HISTORY);
		setHistory(next);
		setHistoryIdx(next.length - 1);
		setText("");
		toast("Nota borrada");
	}, [history, historyIdx, text]);

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
			if (historyTimer.current) clearTimeout(historyTimer.current);
			historyTimer.current = null;
			const next = [...history.slice(0, historyIdx + 1), ...(text !== history[historyIdx] ? [text] : []), snapshot.text].slice(-MAX_HISTORY);
			setHistory(next);
			setHistoryIdx(next.length - 1);
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
			toast("Version restaurada");
		},
		[history, historyIdx, text],
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
			if (historyTimer.current) clearTimeout(historyTimer.current);
			historyTimer.current = null;
			const next = [...history.slice(0, historyIdx + 1), ...(text !== history[historyIdx] ? [text] : []), template.text].slice(-MAX_HISTORY);
			setHistory(next);
			setHistoryIdx(next.length - 1);
			setTitle(template.title);
			setText(template.text);
			setSticker(template.sticker);
			setSignature(template.signature);
			toast.success(`Plantilla ${template.label} aplicada`);
		},
		[history, historyIdx, text],
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
			const raw = localStorage.getItem(WORKSPACE_KEY);
			const workspace = raw ? workspaceSchema.safeParse(JSON.parse(raw)) : null;
			if (workspace?.success && workspace.data.notes.some((note) => note.id === workspace.data.activeId)) {
				setNotes(workspace.data.notes);
				setActiveId(workspace.data.activeId);
				applyNote(workspace.data.notes.find((note) => note.id === workspace.data.activeId)!.data);
			} else {
				const legacyRaw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
				const legacy = legacyRaw ? stateSchema.partial().safeParse(JSON.parse(legacyRaw)) : null;
				const data = legacy?.success ? stateSchema.parse({ ...emptyNote(), ...legacy.data }) : emptyNote();
				const note = { id: createId(), updatedAt: new Date().toISOString(), data };
				setNotes([note]);
				setActiveId(note.id);
				applyNote(data);
			}
		} catch {
			const note = { id: createId(), updatedAt: new Date().toISOString(), data: emptyNote() };
			setNotes([note]);
			setActiveId(note.id);
		}
		setReady(true);

		setShareSupported(typeof navigator.share === "function");

		return () => {
			if (historyTimer.current) clearTimeout(historyTimer.current);
		};
	}, []);

	useEffect(() => {
		if (!ready || !activeId) return;
		setNotes((previous) => previous.map((note) => {
			if (note.id !== activeId || JSON.stringify(note.data) === JSON.stringify(currentData)) return note;
			return { ...note, data: currentData, updatedAt: new Date().toISOString() };
		}));
	}, [
		activeId,
		align,
		bold,
		dateIso,
		downloads,
		focusMode,
		fontId,
		fontSize,
		italic,
		ready,
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
		if (!ready || notes.length === 0) return;
		try {
			localStorage.setItem(WORKSPACE_KEY, JSON.stringify({ activeId, notes }));
			storageWarningShown.current = false;
		} catch {
			if (!storageWarningShown.current) {
				toast.error("No se pudieron guardar las notas en este navegador. Exportá un respaldo.");
				storageWarningShown.current = true;
			}
		}
	}, [activeId, notes, ready]);

	useEffect(() => {
		const handler = (event: KeyboardEvent) => {
			const mod = event.ctrlKey || event.metaKey;
			const key = event.key.toLowerCase();
			const target = event.target;
			const editingOtherField = target instanceof HTMLElement &&
				(target.isContentEditable || target.matches("input, textarea:not(.letter-note-input), select"));

			if (mod && !editingOtherField && key === "z" && !event.shiftKey) {
				event.preventDefault();
				handleUndo();
			}
			if (mod && !editingOtherField && (key === "y" || (key === "z" && event.shiftKey))) {
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
					<div className="max-w-[1600px] mx-auto px-5 sm:px-8 xl:px-12 h-16 flex items-center justify-between gap-4">
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
								className="text-2xl font-semibold tracking-tight"
								style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
							>
								Papelito
							</span>
							<span className="hidden sm:inline-flex items-center text-sm mt-1 text-muted-foreground border border-border rounded-full px-2.5 py-1 leading-none">
								Estudio creativo
							</span>
						</div>

						<div className="flex items-center gap-2 sm:gap-4">
							<button
								onClick={() => setFocusMode((value) => !value)}
								className="text-sm px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
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

				<main className="flex-1 max-w-[1600px] mx-auto w-full px-5 sm:px-8 xl:px-12 py-8 lg:py-12">
					<div className="mb-8 lg:mb-10">
						<p className="text-sm font-medium text-accent mb-2">TU ESPACIO PARA ESCRIBIR</p>
						<h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">Una idea merece su papel</h1>
						<p className="mt-3 max-w-2xl text-base text-muted-foreground">Escribí, diseñá y compartí. Tus notas quedan guardadas mientras creás.</p>
					</div>
					<div className={`grid grid-cols-1 gap-6 xl:gap-10 items-start ${focusMode
						? "lg:max-w-[1200px] lg:mx-auto lg:grid-cols-[minmax(440px,540px)_minmax(0,1fr)]"
						: "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] 2xl:grid-cols-[minmax(270px,300px)_minmax(440px,540px)_minmax(0,1fr)]"}`}>
						<div className="min-w-0 order-1 lg:col-span-2 2xl:col-span-1">
							{!focusMode && <section className="rounded-xl border border-border bg-background/95 p-6 shadow-sm" aria-label="Mis notas">
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="text-sm font-medium text-muted-foreground">Biblioteca · {notes.length}/100</p>
										<h2 className="font-serif text-2xl font-semibold">Mis notas</h2>
									</div>
									<button onClick={() => createNote()} disabled={!ready} className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-80 disabled:opacity-40"><FilePlus2 className="w-4 h-4" /> Nueva nota</button>
								</div>
								<div className="relative mt-4">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
									<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar notas" aria-label="Buscar notas" className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-base outline-none focus:ring-2 focus:ring-ring/30" />
								</div>
								<div className="mt-4 max-h-[420px] overflow-y-auto space-y-1.5 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0 2xl:block 2xl:space-y-1.5" aria-label="Lista de notas">
									{filteredNotes.length === 0 && <p className="py-4 text-center text-base text-muted-foreground lg:col-span-2 2xl:col-span-1">No encontramos notas con esa búsqueda.</p>}
									{filteredNotes.map((note) => (
										<div key={note.id} className={`flex items-center gap-2 rounded-lg border px-2 py-2 ${note.id === activeId ? "border-foreground/40 bg-muted" : "border-transparent hover:bg-muted/70"}`}>
											<button onClick={() => selectNote(note)} className="min-w-0 flex-1 text-left px-2 py-1" aria-current={note.id === activeId ? "true" : undefined}>
												<span className="block truncate text-base font-medium">{note.data.title.trim() || "Sin título"}</span>
												<span className="block truncate text-sm text-muted-foreground">{note.data.text.trim() || "Nota vacía"}</span>
											</button>
											<button
												onClick={() => {
													const source = note.id === activeId ? currentData : note.data;
													createNote({ ...source, title: `${source.title.slice(0, 36)} (copia)`, snapshots: [], downloads: 0, shares: 0 });
												}}
												title="Duplicar nota"
												aria-label={`Duplicar ${note.data.title || "nota"}`}
												className="rounded p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
											><Files className="w-4 h-4" /></button>
											<button onClick={() => deleteNote(note)} title="Eliminar nota" aria-label={`Eliminar ${note.data.title || "nota"}`} className="rounded p-1.5 text-muted-foreground hover:bg-background hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
										</div>
									))}
								</div>
								<div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
									<button onClick={exportBackup} disabled={!ready} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-40"><Download className="w-4 h-4" /> Exportar respaldo</button>
									<button onClick={() => importRef.current?.click()} disabled={!ready} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-40"><Upload className="w-4 h-4" /> Importar respaldo</button>
									<input ref={importRef} type="file" accept="application/json,.json" className="hidden" aria-label="Seleccionar respaldo" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importBackup(file); event.target.value = ""; }} />
								</div>
								<p className="mt-3 text-sm leading-relaxed text-muted-foreground">Se guardan automáticamente en este navegador. Exportá un respaldo para llevarlas a otro dispositivo.</p>
							</section>}
						</div>
						<div className="min-w-0 order-3 lg:order-2 flex flex-col gap-6">

							<section className="rounded-xl border border-border bg-background/95 p-6 shadow-sm" aria-label="Herramientas de edición">
								<EditorToolbar
									fontId={fontId}
									fontSize={fontSize}
									bold={bold}
									italic={italic}
									align={align}
									tilt={tilt}
									charCount={text.length}
									maxChars={MAX_CHARS}
									canUndo={historyIdx > 0 || text !== history[historyIdx]}
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
							</section>

							<section className="rounded-xl border border-border bg-background/95 p-6 shadow-sm" aria-label="Estilos de papel">
								<ThemePicker activeId={theme.id} onSelect={setTheme} />
							</section>

							<section className="rounded-xl border border-border bg-background/95 p-6 shadow-sm">
								<h2 className="font-serif text-xl font-semibold mb-4">
									Cabecera de nota
								</h2>
								<div className="flex flex-col gap-5">
									<div>
										<label htmlFor="note-title" className="text-base font-medium">
											Título
										</label>
										<input
											id="note-title"
											value={title}
											onChange={(event) => setTitle(event.target.value.slice(0, 44))}
											placeholder="Título corto"
											className="mt-2 w-full h-11 rounded-lg border border-border bg-background px-3 text-base outline-none focus:ring-2 focus:ring-ring/30"
										/>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
										<div>
											<label htmlFor="note-date" className="text-base font-medium">Fecha</label>
											<input
												id="note-date"
												type="date"
												disabled={!showDate}
												value={dateIso}
												onChange={(event) => setDateIso(event.target.value)}
												className="mt-2 w-full h-11 rounded-lg border border-border bg-background px-3 text-base outline-none disabled:opacity-40"
											/>
										</div>
										<div>
											<label htmlFor="note-signature" className="text-base font-medium">Firma</label>
											<input
												id="note-signature"
												value={signature}
												onChange={(event) =>
													setSignature(event.target.value.slice(0, 28))
												}
												placeholder="Tu nombre"
												className="mt-2 w-full h-11 rounded-lg border border-border bg-background px-3 text-base outline-none focus:ring-2 focus:ring-ring/30"
											/>
										</div>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
										<label className="flex items-center gap-2 text-base">
											<input
												type="checkbox"
												checked={showDate}
												onChange={(event) => setShowDate(event.target.checked)}
												className="h-4 w-4 rounded border-border"
											/>
											Mostrar fecha
										</label>
										<div>
											<label htmlFor="note-sticker" className="text-base font-medium">Sticker</label>
											<select
												id="note-sticker"
												value={sticker}
												onChange={(event) => setSticker(event.target.value)}
												className="mt-2 w-full h-11 rounded-lg border border-border bg-background px-3 text-base outline-none"
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
							</section>

							{!focusMode && (
								<>
									<section className="rounded-xl border border-border bg-background/95 p-6 shadow-sm">
										<div className="flex items-center justify-between gap-3 mb-4">
											<h2 className="font-serif text-xl font-semibold">Plantillas rápidas</h2>
											<WandSparkles className="w-4 h-4 text-muted-foreground" />
										</div>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
											{QUICK_TEMPLATES.map((template) => (
												<button
													key={template.id}
													onClick={() => handleApplyTemplate(template)}
													className="text-left rounded-lg border border-border bg-background px-4 py-3 hover:border-foreground/25 hover:bg-muted transition-colors"
												>
													<p className="text-base font-medium">{template.label}</p>
													<p className="text-sm text-muted-foreground line-clamp-2 mt-1">
														{template.text}
													</p>
												</button>
											))}
										</div>
									</section>

									<section className="rounded-xl border border-border bg-background/95 p-6 shadow-sm">
										<div className="flex items-center justify-between gap-2 mb-4">
											<h2 className="font-serif text-xl font-semibold">Objetivo de escritura</h2>
											<Target className="w-4 h-4 text-muted-foreground" />
										</div>
										<input
											type="range"
											aria-label="Objetivo de caracteres"
											min={80}
											max={MAX_CHARS}
											step={10}
											value={targetChars}
											onChange={(event) =>
												setTargetChars(Number(event.target.value))
											}
											className="w-full"
										/>
										<div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
											<span>Meta: {targetChars} caracteres</span>
											<span>{Math.round(goalProgress)}%</span>
										</div>
										<div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
											<div
												className="h-full rounded-full bg-foreground/60 transition-all"
												style={{ width: `${goalProgress}%` }}
											/>
										</div>
										<p className="mt-3 text-sm text-muted-foreground">
											{goalDelta >= 0
												? `Te faltan ${goalDelta} caracteres para cumplir la meta.`
												: `Superaste la meta por ${Math.abs(goalDelta)} caracteres.`}
										</p>
									</section>

									<section className="rounded-xl border border-border bg-background/95 p-6 shadow-sm">
										<div className="flex items-center justify-between gap-3 mb-3">
											<h2 className="font-serif text-xl font-semibold">Versiones guardadas</h2>
											<button
												onClick={handleSaveSnapshot}
												className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border border-border hover:bg-muted"
											>
												<Save className="w-4 h-4" /> Guardar
											</button>
										</div>
										{snapshots.length === 0 ? (
											<p className="text-sm text-muted-foreground">
												Todavía no hay versiones. Guardá una para poder volver atrás.
											</p>
										) : (
											<div className="space-y-2 max-h-64 overflow-y-auto pr-1">
												{snapshots.map((snapshot) => (
													<button
														key={snapshot.id}
														onClick={() => handleRestoreSnapshot(snapshot)}
													className="w-full text-left rounded-lg border border-border bg-background px-4 py-3 hover:border-foreground/25 hover:bg-muted transition-colors"
													>
													<p className="text-base font-medium truncate">
															{snapshot.label}
														</p>
													<p className="text-sm text-muted-foreground mt-1">
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
									</section>

									<section className="rounded-xl border border-border bg-background/95 p-6 shadow-sm">
										<h2 className="font-serif text-xl font-semibold mb-4">Atajos de teclado</h2>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
											{[
												["Ctrl + Z", "Deshacer"],
												["Ctrl + Y", "Rehacer"],
												["Ctrl + B", "Negrita"],
												["Ctrl + I", "Cursiva"],
												["Ctrl + Shift + S", "Guardar versión"],
												["Ctrl + Enter", "Descargar"],
												["Ctrl + K", "Sorpresa"],
											].map(([key, label]) => (
												<div key={key} className="flex items-center gap-2">
													<kbd className="shrink-0 px-2 py-1 rounded border border-border bg-muted text-sm font-mono whitespace-nowrap">
														{key}
													</kbd>
													<span className="text-sm text-muted-foreground">
														{label}
													</span>
												</div>
											))}
										</div>
									</section>
								</>
							)}
						</div>

						<aside className="min-w-0 order-2 lg:order-3 w-full flex flex-col items-center gap-6 lg:sticky lg:top-20" aria-label="Vista previa y exportación">
							<h2 className="w-full font-serif text-xl font-semibold">Vista previa</h2>
							<div className="letter-stage">
								<div className="letter-scale">
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
									<p className="mt-4 text-center text-sm text-muted-foreground select-none">
										Tocá la nota para escribir
									</p>
								</div>
							</div>

							<div className="w-full max-w-[620px] flex flex-col gap-6">
								<section className="rounded-xl border border-border bg-background/95 p-6 shadow-sm">
									<h3 className="font-serif text-xl font-semibold mb-4">Exportar y compartir</h3>
									<div className="flex flex-wrap gap-3">
										<button
											onClick={handleDownload}
											disabled={exportingAction !== null}
											className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-foreground text-primary-foreground text-sm font-medium disabled:opacity-40"
										>
											<ImageDown className="w-3.5 h-3.5" />
											PNG
										</button>
										<button
											onClick={handleCopyImage}
											disabled={exportingAction !== null}
											className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted disabled:opacity-40"
										>
											<Sparkles className="w-3.5 h-3.5" />
											Copiar imagen
										</button>
										<button
											onClick={handleShare}
											disabled={!shareSupported || exportingAction !== null}
											className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted disabled:opacity-40"
										>
											<Share2 className="w-3.5 h-3.5" />
											Compartir
										</button>
									</div>
									<p className="mt-4 text-sm text-muted-foreground">
										{shareSupported
											? "Compartir esta activo en tu navegador."
											: "Compartir no esta disponible en este dispositivo."}
									</p>
								</section>

								<section className="rounded-xl border border-border bg-background/95 p-6 shadow-sm">
									<h3 className="font-serif text-xl font-semibold mb-4">Tu escritura en números</h3>
									<div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 2xl:grid-cols-4 gap-4">
										<div>
											<p className="text-sm text-muted-foreground">Palabras</p>
											<p className="font-serif text-2xl font-semibold">{wordCount}</p>
										</div>
										<div>
											<p className="text-sm text-muted-foreground">Líneas</p>
											<p className="font-serif text-2xl font-semibold">{lineCount}</p>
										</div>
										<div>
											<p className="text-sm text-muted-foreground">Lectura</p>
											<p className="font-serif text-2xl font-semibold inline-flex items-center gap-1">
												<Clock3 className="w-4 h-4" />
												{readingMinutes} min
											</p>
										</div>
										<div>
											<p className="text-sm text-muted-foreground">Caracteres</p>
											<p className="font-serif text-2xl font-semibold">{text.length}</p>
										</div>
									</div>
								</section>
							</div>
						</aside>
					</div>
				</main>

				<footer className="border-t border-border bg-background/60 backdrop-blur-sm">
					<div className="max-w-[1600px] mx-auto px-5 sm:px-8 xl:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
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
							<span className="text-sm">Notas con estilo, versiones y exportación</span>
						</div>
						<div className="flex items-center gap-5 text-sm text-muted-foreground">
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
