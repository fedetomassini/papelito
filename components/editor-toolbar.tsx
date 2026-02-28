"use client";

import {
	Bold,
	Italic,
	AlignLeft,
	AlignCenter,
	AlignRight,
	Undo2,
	Redo2,
	Trash2,
	Copy,
	Download,
	ChevronDown,
	RotateCcw,
} from "lucide-react";
import {
	FONT_OPTIONS,
	FONT_SIZES,
	type FontId,
	type FontSizeKey,
} from "@/lib/note-themes";
import { cn } from "@/lib/utils";

type Align = "left" | "center" | "right";

type Props = {
	fontId: FontId;
	fontSize: FontSizeKey;
	bold: boolean;
	italic: boolean;
	align: Align;
	tilt: number;
	charCount: number;
	maxChars: number;
	canUndo: boolean;
	canRedo: boolean;
	onFontChange: (id: FontId) => void;
	onFontSizeChange: (size: FontSizeKey) => void;
	onBoldToggle: () => void;
	onItalicToggle: () => void;
	onAlignChange: (align: Align) => void;
	onTiltChange: (tilt: number) => void;
	onUndo: () => void;
	onRedo: () => void;
	onClear: () => void;
	onCopy: () => void;
	onDownload: () => void;
};

export default function EditorToolbar({
	fontId,
	fontSize,
	bold,
	italic,
	align,
	tilt,
	charCount,
	maxChars,
	canUndo,
	canRedo,
	onFontChange,
	onFontSizeChange,
	onBoldToggle,
	onItalicToggle,
	onAlignChange,
	onTiltChange,
	onUndo,
	onRedo,
	onClear,
	onCopy,
	onDownload,
}: Props) {
	const currentFont =
		FONT_OPTIONS.find((f) => f.id === fontId) ?? FONT_OPTIONS[0];
	const charPct = (charCount / maxChars) * 100;

	return (
		<div className="w-full flex flex-col gap-3">
			{/* Row 1: font + size + style + alignment */}
			<div className="flex flex-wrap items-center gap-2">
				{/* Font selector */}
				<div className="relative">
					<select
						value={fontId}
						onChange={(e) => onFontChange(e.target.value as FontId)}
						className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring/30 hover:border-foreground/30 transition-colors"
						style={{ fontFamily: currentFont.cssVar }}
					>
						{FONT_OPTIONS.map((f) => (
							<option key={f.id} value={f.id} style={{ fontFamily: f.cssVar }}>
								{f.label}
							</option>
						))}
					</select>
					<ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
				</div>

				{/* Font size */}
				<div className="flex items-center rounded-lg border border-border overflow-hidden">
					{(Object.keys(FONT_SIZES) as FontSizeKey[]).map((key) => (
						<button
							key={key}
							onClick={() => onFontSizeChange(key)}
							className={cn(
								"px-3 py-1.5 text-xs font-medium transition-colors",
								fontSize === key
									? "bg-foreground text-primary-foreground"
									: "bg-background text-foreground hover:bg-muted",
							)}
						>
							{FONT_SIZES[key].label}
						</button>
					))}
				</div>

				{/* Separator */}
				<div className="h-6 w-px bg-border" />

				{/* Bold / Italic */}
				<div className="flex items-center rounded-lg border border-border overflow-hidden">
					<ToolBtn
						active={bold}
						onClick={onBoldToggle}
						title="Negrita (Ctrl+B)"
						label={<span className="font-bold text-sm">B</span>}
					/>
					<ToolBtn
						active={italic}
						onClick={onItalicToggle}
						title="Cursiva (Ctrl+I)"
						label={<span className="italic text-sm">I</span>}
					/>
				</div>

				{/* Separator */}
				<div className="h-6 w-px bg-border" />

				{/* Alignment */}
				<div className="flex items-center rounded-lg border border-border overflow-hidden">
					<ToolBtn
						active={align === "left"}
						onClick={() => onAlignChange("left")}
						title="Izquierda"
						label={<AlignLeft className="w-3.5 h-3.5" />}
					/>
					<ToolBtn
						active={align === "center"}
						onClick={() => onAlignChange("center")}
						title="Centro"
						label={<AlignCenter className="w-3.5 h-3.5" />}
					/>
					<ToolBtn
						active={align === "right"}
						onClick={() => onAlignChange("right")}
						title="Derecha"
						label={<AlignRight className="w-3.5 h-3.5" />}
					/>
				</div>

				{/* Separator */}
				<div className="h-6 w-px bg-border" />

				{/* Undo / Redo */}
				<div className="flex items-center rounded-lg border border-border overflow-hidden">
					<ToolBtn
						active={false}
						onClick={onUndo}
						disabled={!canUndo}
						title="Deshacer (Ctrl+Z)"
						label={<Undo2 className="w-3.5 h-3.5" />}
					/>
					<ToolBtn
						active={false}
						onClick={onRedo}
						disabled={!canRedo}
						title="Rehacer (Ctrl+Y)"
						label={<Redo2 className="w-3.5 h-3.5" />}
					/>
				</div>

				{/* Separator */}
				<div className="h-6 w-px bg-border" />

				{/* Copy & Clear */}
				<ToolBtn
					active={false}
					onClick={onCopy}
					title="Copiar texto"
					label={<Copy className="w-3.5 h-3.5" />}
					standalone
				/>
				<ToolBtn
					active={false}
					onClick={onClear}
					title="Borrar todo"
					label={<Trash2 className="w-3.5 h-3.5" />}
					standalone
				/>
			</div>

			{/* char counter + download */}
			<div className="flex flex-col items-center gap-4">
				{/* Char counter */}
				<div className="flex items-center gap-2 mx-auto">
					<div className="w-24 h-1 rounded-full bg-muted overflow-hidden">
						<div
							className={cn(
								"h-full rounded-full transition-all duration-300",
								charPct > 90
									? "bg-destructive"
									: charPct > 70
										? "bg-accent"
										: "bg-foreground/40",
							)}
							style={{ width: `${Math.min(charPct, 100)}%` }}
						/>
					</div>
					<span
						className={cn(
							"text-xs tabular-nums",
							charPct > 90 ? "text-destructive" : "text-muted-foreground",
						)}
					>
						{charCount}/{maxChars}
					</span>
				</div>

				{/* Download */}
				<button
					onClick={onDownload}
					className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-foreground text-primary-foreground text-sm font-medium hover:opacity-80 active:scale-95 transition-all"
				>
					<Download className="w-3.5 h-3.5" />
					Descargar
				</button>
			</div>
		</div>
	);
}

function ToolBtn({
	active,
	onClick,
	disabled,
	title,
	label,
	standalone,
}: {
	active: boolean;
	onClick: () => void;
	disabled?: boolean;
	title: string;
	label: React.ReactNode;
	standalone?: boolean;
}) {
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			title={title}
			className={cn(
				"px-2.5 py-1.5 transition-colors flex items-center justify-center",
				standalone ? "rounded-lg border border-border" : "",
				active
					? "bg-foreground text-primary-foreground"
					: "bg-background text-foreground hover:bg-muted",
				disabled && "opacity-30 cursor-not-allowed",
			)}
		>
			{label}
		</button>
	);
}
