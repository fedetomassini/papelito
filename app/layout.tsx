import type { Metadata } from "next";
import { Playfair_Display, Cormorant_Garamond } from "next/font/google";

import "./globals.css";

const playfair = Playfair_Display({
	subsets: ["latin"],
	variable: "--font-serif",
	style: ["normal", "italic"],
	weight: ["400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
	subsets: ["latin"],
	variable: "--font-body",
	style: ["normal", "italic"],
	weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
	title: "Papelito - Creá y descarga notas con estilo",
	description:
		"Editor de notas elegante. Escribí, personalizá el estilo y descarga como imagen.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${playfair.variable} ${cormorant.variable} font-serif antialiased`}
			>
				{children}
			</body>
		</html>
	);
}
