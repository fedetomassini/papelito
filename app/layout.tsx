import type { Metadata } from "next";
import {
	Playfair_Display,
	Cormorant_Garamond,
	Sacramento,
	Lora,
	Crimson_Pro,
} from "next/font/google";

import "./globals.css";

const playfair = Playfair_Display({
	subsets: ["latin"],
	variable: "--font-playfair",
	style: ["normal", "italic"],
	weight: ["400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
	subsets: ["latin"],
	variable: "--font-cormorant",
	style: ["normal", "italic"],
	weight: ["300", "400", "500", "600"],
});

const sacramento = Sacramento({
	subsets: ["latin"],
	variable: "--font-sacramento",
	weight: ["400"],
});

const lora = Lora({
	subsets: ["latin"],
	variable: "--font-lora",
	style: ["normal", "italic"],
	weight: ["400", "500", "600", "700"],
});

const crimson = Crimson_Pro({
	subsets: ["latin"],
	variable: "--font-crimson",
	style: ["normal", "italic"],
	weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
	title: "Papelito — Crea y descarga notas con estilo",
	description:
		"Editor de notas elegante. Elige tu estilo de papel, tipografía y descarga tu nota como imagen.",
	icons: {
		icon: [
			{
				media: "(prefers-color-scheme: light)",
				url: "/icon-light.ico",
				type: "image/ico",
			},
			{
				media: "(prefers-color-scheme: dark)",
				url: "/icon-dark.ico",
				type: "image/ico",
			},
		],
		shortcut: [
			{
				media: "(prefers-color-scheme: light)",
				url: "/icon-light.ico",
				type: "image/ico",
			},
			{
				media: "(prefers-color-scheme: dark)",
				url: "/icon-dark.ico",
				type: "image/ico",
			},
		],
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="es">
			<body
				className={`${playfair.variable} ${cormorant.variable} ${sacramento.variable} ${lora.variable} ${crimson.variable} antialiased`}
			>
				{children}
			</body>
		</html>
	);
}
