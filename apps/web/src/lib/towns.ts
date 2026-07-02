export const CAMEROON_TOWNS = [
	"Douala",
	"Yaounde",
	"Bafoussam",
	"Bamenda",
	"Garoua",
	"Maroua",
	"Limbe",
	"Buea",
	"Kumba",
	"Kribi",
	"Edea",
	"Nkongsamba",
	"Bertoua",
	"Ebolowa",
	"Meiganga",
	"Ngaoundere",
	"Foumban",
	"Dschang",
	"Mbouda",
	"Bangangte",
	"Foumbot",
	"Kousseri",
	"Yagoua",
	"Batouri",
	"Sangmelima",
	"Obala",
	"Mbalmayo",
	"Tiko",
	"Mutengene",
	"Loum",
	"Manjo",
	"Mora",
	"Guider",
	"Kaele",
	"Mokolo",
	"Akonolinga",
	"Abong-Mbang",
	"Bafia",
	"Nkoteng",
	"Eséka",
	"Melong",
	"Penja",
	"Mbanga",
	"Wum",
	"Kumbo",
	"Mamfe",
	"Fundong",
	"Nkambe",
	"Belabo",
	"Tibati",
] as const;

export function normalizeTown(value: string) {
	return value
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.trim()
		.toLowerCase();
}

export function townMatches(a: string, b: string) {
	return normalizeTown(a) === normalizeTown(b);
}

export function extractTownFromPlace(place: {
	town?: string;
	displayName?: string;
}) {
	if (place.town?.trim()) return place.town.trim();
	const parts = place.displayName?.split(",").map((part) => part.trim()) ?? [];
	return parts.find(Boolean) ?? null;
}
