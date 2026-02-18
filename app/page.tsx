"use client";

import { useRef, useState, useCallback } from "react";
import html2canvas from "html2canvas";
import LetterCard from "@/components/letter-card";
import LetterToolbar from "@/components/letter-toolbar";
import ThemePicker from "@/components/theme-picker";
import { noteThemes, type NoteTheme } from "@/lib/note-themes";

export default function Home() {
	const [text, setText] = useState("");
	const [isEditing, setIsEditing] = useState(true);
	const [isDownloading, setIsDownloading] = useState(false);
	const [theme, setTheme] = useState<NoteTheme>(noteThemes[0]);
	const cardRef = useRef<HTMLDivElement>(null);

	const handleDownload = useCallback(async () => {
		if (!cardRef.current) return;
		setIsDownloading(true);

		try {
			const canvas = await html2canvas(cardRef.current, {
				backgroundColor: null,
				scale: 3,
				useCORS: true,
				logging: false,
			});

			const link = document.createElement("a");
			link.download = "mi-nota-noty.png";
			link.href = canvas.toDataURL("image/png");
			link.click();
		} catch (error) {
			console.error("Error generating image:", error);
		} finally {
			setIsDownloading(false);
		}
	}, []);

	return (
		<main className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-0 relative overflow-hidden">
			{/* Subtle grid */}
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					backgroundImage: `
            linear-gradient(hsl(24, 5%, 92%) 1px, transparent 1px),
            linear-gradient(90deg, hsl(24, 5%, 92%) 1px, transparent 1px)
          `,
					backgroundSize: "40px 40px",
					opacity: 0.4,
				}}
			/>

			{/* Header */}
			<div className="mb-5 text-center relative z-10">
				<h1
					className="text-3xl md:text-4xl italic font-extrabold tracking-tight"
					style={{
						fontFamily: "var(--font-serif), 'Playfair Display', serif",
						color: "hsl(24, 10%, 20%)",
					}}
				>
					Papelito
				</h1>
				<p
					className="mt-2 italic text-sm md:text-base"
					style={{
						fontFamily: "var(--font-body), 'Cormorant Garamond', serif",
						color: "hsl(24, 5%, 55%)",
						letterSpacing: "0.03em",
					}}
				>
					{"Escribí tu notita, elegí el color, descargá y mandá!"}
				</p>
			</div>

			{/* Note card */}
			<div className="relative z-10 mb-10">
				<LetterCard
					ref={cardRef}
					text={text}
					isEditing={isEditing}
					onTextChange={setText}
					onStartEditing={() => setIsEditing(true)}
					theme={theme}
				/>
			</div>

			{/* Toolbar */}
			<div className="relative z-10 mb-8">
				<LetterToolbar
					isEditing={isEditing}
					onToggleEdit={() => setIsEditing(!isEditing)}
					onDownload={handleDownload}
					isDownloading={isDownloading}
				/>
			</div>

			{/* Theme picker */}
			<div className="relative z-10">
				<ThemePicker selected={theme} onSelect={setTheme} />
			</div>

			{/* Footer */}
			<p
				className="mt-8 italic text-xs relative z-10"
				style={{
					fontFamily: "var(--font-body), 'Cormorant Garamond', serif",
					color: "hsl(24, 5%, 65%)",
					letterSpacing: "0.04em",
				}}
			></p>
		</main>
	);
}
