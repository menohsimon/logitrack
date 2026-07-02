"use client";

import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@logitrack/ui/components/combobox";
import { Label } from "@logitrack/ui/components/label";

import { CURRENCIES } from "@/lib/countries";

export function CurrencySelect({
	id,
	label = "Currency",
	value,
	onChange,
}: {
	id: string;
	label?: string;
	value: string;
	onChange: (currency: string) => void;
}) {
	return (
		<div className="space-y-2">
			<Label htmlFor={id}>{label}</Label>
			<Combobox
				items={CURRENCIES}
				value={CURRENCIES.find((currency) => currency.code === value) ?? null}
				onValueChange={(currency) => {
					if (currency) onChange(currency.code);
				}}
				itemToStringLabel={(currency) =>
					currency
						? `${currency.code} ${currency.name} ${currency.countries.join(" ")}`
						: ""
				}
				itemToStringValue={(currency) => currency?.code ?? ""}
			>
				<ComboboxInput
					id={id}
					className="w-full"
					placeholder="Search currency"
				/>
				<ComboboxContent>
					<ComboboxEmpty>No currency found</ComboboxEmpty>
					<ComboboxList>
						{CURRENCIES.map((currency) => (
							<ComboboxItem key={currency.code} value={currency}>
								<div className="min-w-0">
									<p className="font-medium">{currency.code}</p>
									<p className="truncate text-muted-foreground text-xs">
										{currency.name}
									</p>
								</div>
							</ComboboxItem>
						))}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>
		</div>
	);
}
