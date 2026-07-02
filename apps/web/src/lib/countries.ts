export type CountryCurrency = {
	countryCode: string;
	countryName: string;
	currencyCode: string;
	currencyName: string;
};

export const COUNTRIES: CountryCurrency[] = [
	{
		countryCode: "CM",
		countryName: "Cameroon",
		currencyCode: "XAF",
		currencyName: "Central African CFA franc",
	},
	{
		countryCode: "US",
		countryName: "United States",
		currencyCode: "USD",
		currencyName: "United States dollar",
	},
	{
		countryCode: "CA",
		countryName: "Canada",
		currencyCode: "CAD",
		currencyName: "Canadian dollar",
	},
	{
		countryCode: "GB",
		countryName: "United Kingdom",
		currencyCode: "GBP",
		currencyName: "Pound sterling",
	},
	{
		countryCode: "EU",
		countryName: "European Union",
		currencyCode: "EUR",
		currencyName: "Euro",
	},
	{
		countryCode: "NG",
		countryName: "Nigeria",
		currencyCode: "NGN",
		currencyName: "Nigerian naira",
	},
	{
		countryCode: "GH",
		countryName: "Ghana",
		currencyCode: "GHS",
		currencyName: "Ghanaian cedi",
	},
	{
		countryCode: "ZA",
		countryName: "South Africa",
		currencyCode: "ZAR",
		currencyName: "South African rand",
	},
	{
		countryCode: "KE",
		countryName: "Kenya",
		currencyCode: "KES",
		currencyName: "Kenyan shilling",
	},
	{
		countryCode: "CI",
		countryName: "Cote d'Ivoire",
		currencyCode: "XOF",
		currencyName: "West African CFA franc",
	},
	{
		countryCode: "MA",
		countryName: "Morocco",
		currencyCode: "MAD",
		currencyName: "Moroccan dirham",
	},
	{
		countryCode: "JP",
		countryName: "Japan",
		currencyCode: "JPY",
		currencyName: "Japanese yen",
	},
	{
		countryCode: "CN",
		countryName: "China",
		currencyCode: "CNY",
		currencyName: "Chinese yuan",
	},
	{
		countryCode: "IN",
		countryName: "India",
		currencyCode: "INR",
		currencyName: "Indian rupee",
	},
	{
		countryCode: "BR",
		countryName: "Brazil",
		currencyCode: "BRL",
		currencyName: "Brazilian real",
	},
	{
		countryCode: "AU",
		countryName: "Australia",
		currencyCode: "AUD",
		currencyName: "Australian dollar",
	},
];

const currencyDisplayNames =
	typeof Intl.DisplayNames === "function"
		? new Intl.DisplayNames(["en"], { type: "currency" })
		: null;

const countryCurrencyCodes = COUNTRIES.map((country) => country.currencyCode);
const supportedCurrencyCodes = Array.from(
	new Set([
		...(typeof Intl.supportedValuesOf === "function"
			? Intl.supportedValuesOf("currency")
			: []),
		...countryCurrencyCodes,
	]),
).sort((a, b) => a.localeCompare(b));

export const CURRENCIES = supportedCurrencyCodes.map((code) => {
	const matchingCountries = COUNTRIES.filter(
		(country) => country.currencyCode === code,
	);
	return {
		code,
		name:
			matchingCountries[0]?.currencyName ??
			currencyDisplayNames?.of(code) ??
			code,
		countries: matchingCountries.map((country) => country.countryName),
	};
});
