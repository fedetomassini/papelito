export interface NoteTheme {
	id: string;
	name: string;
	paperGradient: string;
	shadowColor: string;
	shadowLayerDark: string;
	shadowLayerLight: string;
	textColor: string;
	placeholderColor: string;
	lineColor: string;
	lineOpacity: number;
	marginColor: string;
	marginOpacity: number;
	wrinkleShadow: string;
	wrinkleFold1: string;
	wrinkleFold2: string;
	wrinkleFold3: string;
	creaseColor: string;
	previewBg: string;
	previewAccent: string;
}

export const noteThemes: NoteTheme[] = [
	{
		id: "classic",
		name: "Clasica",
		paperGradient:
			"linear-gradient(180deg, hsl(40, 30%, 97%) 0%, hsl(36, 33%, 95%) 60%, hsl(33, 28%, 91%) 100%)",
		shadowColor:
			"0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)",
		shadowLayerDark: "hsl(36, 33%, 88%)",
		shadowLayerLight: "hsl(36, 33%, 91%)",
		textColor: "hsl(24, 10%, 20%)",
		placeholderColor: "hsl(24, 10%, 20%, 0.25)",
		lineColor: "hsl(210, 15%, 75%)",
		lineOpacity: 0.4,
		marginColor: "hsl(0, 55%, 58%)",
		marginOpacity: 0.3,
		wrinkleShadow: "hsl(33, 20%, 82%)",
		wrinkleFold1: "hsl(36, 28%, 90%)",
		wrinkleFold2: "hsl(37, 30%, 92%)",
		wrinkleFold3: "hsl(38, 30%, 95%)",
		creaseColor: "hsl(30, 15%, 78%)",
		previewBg: "hsl(40, 30%, 96%)",
		previewAccent: "hsl(0, 55%, 58%)",
	},
	{
		id: "midnight",
		name: "Noche",
		paperGradient:
			"linear-gradient(180deg, hsl(222, 22%, 20%) 0%, hsl(222, 24%, 16%) 60%, hsl(222, 26%, 13%) 100%)",
		shadowColor:
			"0 4px 28px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)",
		shadowLayerDark: "hsl(222, 22%, 10%)",
		shadowLayerLight: "hsl(222, 22%, 13%)",
		textColor: "hsl(42, 25%, 88%)",
		placeholderColor: "hsl(42, 20%, 85%, 0.25)",
		lineColor: "hsl(42, 15%, 50%)",
		lineOpacity: 0.15,
		marginColor: "hsl(200, 55%, 50%)",
		marginOpacity: 0.25,
		wrinkleShadow: "hsl(222, 26%, 10%)",
		wrinkleFold1: "hsl(222, 24%, 13%)",
		wrinkleFold2: "hsl(222, 23%, 15%)",
		wrinkleFold3: "hsl(222, 22%, 18%)",
		creaseColor: "hsl(222, 15%, 24%)",
		previewBg: "hsl(222, 22%, 18%)",
		previewAccent: "hsl(200, 55%, 50%)",
	},
	{
		id: "rose",
		name: "Rosa",
		paperGradient:
			"linear-gradient(180deg, hsl(348, 35%, 96%) 0%, hsl(345, 30%, 93%) 60%, hsl(342, 25%, 89%) 100%)",
		shadowColor:
			"0 4px 24px rgba(130,50,70,0.08), 0 1px 4px rgba(130,50,70,0.04), inset 0 1px 0 rgba(255,255,255,0.6)",
		shadowLayerDark: "hsl(345, 25%, 85%)",
		shadowLayerLight: "hsl(345, 25%, 89%)",
		textColor: "hsl(340, 22%, 22%)",
		placeholderColor: "hsl(340, 20%, 22%, 0.25)",
		lineColor: "hsl(340, 20%, 72%)",
		lineOpacity: 0.35,
		marginColor: "hsl(340, 50%, 58%)",
		marginOpacity: 0.3,
		wrinkleShadow: "hsl(342, 20%, 82%)",
		wrinkleFold1: "hsl(345, 25%, 88%)",
		wrinkleFold2: "hsl(347, 28%, 90%)",
		wrinkleFold3: "hsl(348, 30%, 93%)",
		creaseColor: "hsl(342, 15%, 80%)",
		previewBg: "hsl(348, 35%, 95%)",
		previewAccent: "hsl(340, 50%, 58%)",
	},
	{
		id: "sepia",
		name: "Sepia",
		paperGradient:
			"linear-gradient(180deg, hsl(32, 38%, 92%) 0%, hsl(30, 40%, 87%) 60%, hsl(27, 34%, 80%) 100%)",
		shadowColor:
			"0 4px 24px rgba(85,55,25,0.12), 0 1px 4px rgba(85,55,25,0.06), inset 0 1px 0 rgba(255,255,255,0.4)",
		shadowLayerDark: "hsl(30, 30%, 74%)",
		shadowLayerLight: "hsl(30, 30%, 78%)",
		textColor: "hsl(25, 28%, 16%)",
		placeholderColor: "hsl(25, 25%, 16%, 0.25)",
		lineColor: "hsl(28, 22%, 65%)",
		lineOpacity: 0.4,
		marginColor: "hsl(15, 55%, 42%)",
		marginOpacity: 0.3,
		wrinkleShadow: "hsl(28, 26%, 72%)",
		wrinkleFold1: "hsl(30, 34%, 80%)",
		wrinkleFold2: "hsl(31, 36%, 84%)",
		wrinkleFold3: "hsl(32, 38%, 88%)",
		creaseColor: "hsl(28, 18%, 70%)",
		previewBg: "hsl(32, 38%, 90%)",
		previewAccent: "hsl(15, 55%, 42%)",
	},
	{
		id: "lavender",
		name: "Lavanda",
		paperGradient:
			"linear-gradient(180deg, hsl(260, 25%, 96%) 0%, hsl(258, 22%, 93%) 60%, hsl(255, 18%, 89%) 100%)",
		shadowColor:
			"0 4px 24px rgba(80,60,120,0.08), 0 1px 4px rgba(80,60,120,0.04), inset 0 1px 0 rgba(255,255,255,0.6)",
		shadowLayerDark: "hsl(258, 18%, 84%)",
		shadowLayerLight: "hsl(258, 18%, 88%)",
		textColor: "hsl(260, 20%, 20%)",
		placeholderColor: "hsl(260, 18%, 20%, 0.25)",
		lineColor: "hsl(258, 15%, 74%)",
		lineOpacity: 0.35,
		marginColor: "hsl(260, 40%, 58%)",
		marginOpacity: 0.3,
		wrinkleShadow: "hsl(255, 15%, 80%)",
		wrinkleFold1: "hsl(258, 20%, 87%)",
		wrinkleFold2: "hsl(259, 22%, 90%)",
		wrinkleFold3: "hsl(260, 24%, 93%)",
		creaseColor: "hsl(258, 12%, 78%)",
		previewBg: "hsl(260, 25%, 95%)",
		previewAccent: "hsl(260, 40%, 58%)",
	},
	{
		id: "ocean",
		name: "Oceano",
		paperGradient:
			"linear-gradient(180deg, hsl(198, 25%, 95%) 0%, hsl(200, 28%, 92%) 60%, hsl(202, 22%, 88%) 100%)",
		shadowColor:
			"0 4px 24px rgba(40,70,100,0.08), 0 1px 4px rgba(40,70,100,0.04), inset 0 1px 0 rgba(255,255,255,0.6)",
		shadowLayerDark: "hsl(200, 20%, 84%)",
		shadowLayerLight: "hsl(200, 20%, 88%)",
		textColor: "hsl(205, 22%, 18%)",
		placeholderColor: "hsl(205, 20%, 18%, 0.25)",
		lineColor: "hsl(200, 18%, 72%)",
		lineOpacity: 0.35,
		marginColor: "hsl(200, 50%, 48%)",
		marginOpacity: 0.3,
		wrinkleShadow: "hsl(202, 18%, 80%)",
		wrinkleFold1: "hsl(200, 24%, 87%)",
		wrinkleFold2: "hsl(199, 26%, 90%)",
		wrinkleFold3: "hsl(198, 25%, 93%)",
		creaseColor: "hsl(200, 14%, 78%)",
		previewBg: "hsl(198, 25%, 94%)",
		previewAccent: "hsl(200, 50%, 48%)",
	},
	{
		id: "carbon",
		name: "Carbon",
		paperGradient:
			"linear-gradient(180deg, hsl(0, 0%, 22%) 0%, hsl(0, 0%, 17%) 60%, hsl(0, 0%, 13%) 100%)",
		shadowColor:
			"0 4px 28px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
		shadowLayerDark: "hsl(0, 0%, 10%)",
		shadowLayerLight: "hsl(0, 0%, 13%)",
		textColor: "hsl(0, 0%, 90%)",
		placeholderColor: "hsl(0, 0%, 90%, 0.25)",
		lineColor: "hsl(0, 0%, 40%)",
		lineOpacity: 0.18,
		marginColor: "hsl(0, 65%, 52%)",
		marginOpacity: 0.3,
		wrinkleShadow: "hsl(0, 0%, 10%)",
		wrinkleFold1: "hsl(0, 0%, 13%)",
		wrinkleFold2: "hsl(0, 0%, 16%)",
		wrinkleFold3: "hsl(0, 0%, 20%)",
		creaseColor: "hsl(0, 0%, 25%)",
		previewBg: "hsl(0, 0%, 20%)",
		previewAccent: "hsl(0, 65%, 52%)",
	},
];
