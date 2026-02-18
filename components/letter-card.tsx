"use client";

import { forwardRef } from "react";
import type { NoteTheme } from "@/lib/note-themes";

interface LetterCardProps {
	text: string;
	isEditing: boolean;
	onTextChange: (text: string) => void;
	onStartEditing: () => void;
	theme: NoteTheme;
}

const LINE_HEIGHT = 30;
const TOP_PADDING = 56;

const LetterCard = forwardRef<HTMLDivElement, LetterCardProps>(
	({ text, isEditing, onTextChange, onStartEditing, theme }, ref) => {
		return (
			<div
				ref={ref}
				className="relative w-[340px] sm:w-[400px] md:w-[440px] min-h-[420px] md:min-h-[480px]"
				style={{ transform: "rotate(-2deg)" }}
			>
				{/* Paper shadow layers */}
				<div
					className="absolute inset-0 rounded-sm"
					style={{
						background: theme.shadowLayerDark,
						transform: "rotate(0.7deg) translate(5px, 5px)",
						zIndex: 0,
					}}
				/>
				<div
					className="absolute inset-0 rounded-sm"
					style={{
						background: theme.shadowLayerLight,
						transform: "rotate(0.3deg) translate(2px, 2px)",
						zIndex: 1,
					}}
				/>

				{/* Main paper */}
				<div
					className="relative z-10 rounded-sm overflow-hidden"
					style={{
						background: theme.paperGradient,
						boxShadow: theme.shadowColor,
					}}
				>
					{/* Notebook ruled lines */}
					<div
						className="absolute inset-0 pointer-events-none"
						style={{
							backgroundImage: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent ${LINE_HEIGHT - 1}px,
                ${theme.lineColor} ${LINE_HEIGHT - 1}px,
                ${theme.lineColor} ${LINE_HEIGHT}px
              )`,
							backgroundPosition: `0 ${TOP_PADDING}px`,
							opacity: theme.lineOpacity,
						}}
					/>

					{/* Margin line */}
					<div
						className="absolute top-0 bottom-0 pointer-events-none"
						style={{
							left: "40px",
							width: "1.5px",
							background: theme.marginColor,
							opacity: theme.marginOpacity,
						}}
					/>

					{/* Content area */}
					<div
						className="relative flex flex-col min-h-[420px] md:min-h-[480px]"
						style={{
							paddingTop: `${TOP_PADDING + 4}px`,
							paddingLeft: "52px",
							paddingRight: "32px",
							paddingBottom: "16px",
						}}
					>
						{isEditing ? (
							<textarea
								value={text}
								onChange={(e) => onTextChange(e.target.value)}
								className="w-full flex-1 bg-transparent resize-none outline-none italic"
								style={{
									fontFamily: "var(--font-body), 'Cormorant Garamond', serif",
									fontSize: "18px",
									lineHeight: `${LINE_HEIGHT}px`,
									color: theme.textColor,
									caretColor: theme.marginColor,
								}}
								placeholder={"Querido/a...\n\nEscribí tu nota acá..."}
								autoFocus
							/>
						) : (
							<div
								className="w-full flex-1 cursor-pointer italic whitespace-pre-wrap"
								style={{
									fontFamily: "var(--font-body), 'Cormorant Garamond', serif",
									fontSize: "18px",
									lineHeight: `${LINE_HEIGHT}px`,
									color: theme.textColor,
								}}
								onClick={onStartEditing}
							>
								{text || (
									<span style={{ color: theme.placeholderColor }}>
										{"Toca para escribir..."}
									</span>
								)}
							</div>
						)}
					</div>

					{/* Wrinkled bottom edge */}
					<div className="relative w-full h-14 -mt-2">
						<svg
							viewBox="0 0 440 56"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							className="absolute bottom-0 left-0 w-full"
							preserveAspectRatio="none"
						>
							<path
								d="M0 7 C22 3, 38 15, 62 10 C86 5, 100 17, 124 12 C148 7, 162 19, 186 14 C210 9, 224 21, 248 16 C272 11, 286 23, 310 18 C334 13, 348 22, 372 18 C396 14, 420 19, 440 16 L440 56 L0 56 Z"
								fill={theme.wrinkleShadow}
								opacity="0.5"
							/>
							<path
								d="M0 12 C26 7, 40 19, 68 13 C96 7, 108 21, 132 15 C156 9, 170 23, 194 17 C218 11, 232 25, 256 19 C280 13, 294 25, 318 20 C342 15, 356 23, 380 19 C404 15, 428 19, 440 17 L440 56 L0 56 Z"
								fill={theme.wrinkleFold1}
							/>
							<path
								d="M0 21 C30 15, 46 27, 76 20 C106 13, 118 28, 148 21 C178 14, 194 30, 220 23 C246 16, 262 31, 288 24 C314 18, 330 29, 356 24 C382 19, 416 26, 440 23 L440 56 L0 56 Z"
								fill={theme.wrinkleFold2}
							/>
							<path
								d="M0 30 C34 24, 54 34, 84 28 C114 22, 130 36, 160 30 C190 24, 210 38, 236 32 C262 26, 280 38, 306 33 C332 28, 352 36, 378 32 C404 28, 424 33, 440 31 L440 56 L0 56 Z"
								fill={theme.wrinkleFold3}
							/>
							<path
								d="M56 24 Q76 17 96 24"
								stroke={theme.creaseColor}
								strokeWidth="0.5"
								fill="none"
								opacity="0.6"
							/>
							<path
								d="M186 22 Q210 14 234 22"
								stroke={theme.creaseColor}
								strokeWidth="0.5"
								fill="none"
								opacity="0.5"
							/>
							<path
								d="M330 26 Q354 18 378 26"
								stroke={theme.creaseColor}
								strokeWidth="0.4"
								fill="none"
								opacity="0.4"
							/>
							<path
								d="M118 28 Q138 21 158 28"
								stroke={theme.creaseColor}
								strokeWidth="0.4"
								fill="none"
								opacity="0.4"
							/>
						</svg>
					</div>
				</div>
			</div>
		);
	},
);

LetterCard.displayName = "LetterCard";

export default LetterCard;
