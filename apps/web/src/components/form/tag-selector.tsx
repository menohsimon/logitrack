"use client";

import { Badge } from "@logitrack/ui/components/badge";
import { Button } from "@logitrack/ui/components/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@logitrack/ui/components/command";
import { Label } from "@logitrack/ui/components/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@logitrack/ui/components/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useMemo, useState } from "react";

type TagSelectorProps = {
	id: string;
	label: string;
	value: string[];
	onChange: (value: string[]) => void;
	options: readonly string[];
	placeholder?: string;
	emptyText?: string;
	allowCustom?: boolean;
};

function normalize(value: string) {
	return value.trim().toLowerCase();
}

export function TagSelector({
	id,
	label,
	value,
	onChange,
	options,
	placeholder = "Select items",
	emptyText = "No items found",
	allowCustom = true,
}: TagSelectorProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");

	const selected = useMemo(
		() => new Set(value.map((item) => normalize(item))),
		[value],
	);
	const filtered = useMemo(() => {
		const query = normalize(search);
		return options
			.filter((option) => !selected.has(normalize(option)))
			.filter((option) => !query || normalize(option).includes(query))
			.slice(0, 30);
	}, [options, search, selected]);

	const customValue = search.trim();
	const canAddCustom =
		allowCustom &&
		customValue.length > 0 &&
		!selected.has(normalize(customValue)) &&
		!options.some((option) => normalize(option) === normalize(customValue));

	function addTag(tag: string) {
		const clean = tag.trim();
		if (!clean || selected.has(normalize(clean))) return;
		onChange([...value, clean]);
		setSearch("");
	}

	function removeTag(tag: string) {
		onChange(value.filter((item) => normalize(item) !== normalize(tag)));
	}

	return (
		<div className="space-y-2">
			<Label htmlFor={id}>{label}</Label>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger
					render={(props) => (
						<Button
							id={id}
							type="button"
							variant="outline"
							className="w-full justify-between"
							{...props}
						>
							<span className="truncate text-muted-foreground">
								{value.length > 0 ? `${value.length} selected` : placeholder}
							</span>
							<ChevronsUpDown className="size-4 opacity-60" />
						</Button>
					)}
				/>
				<PopoverContent className="w-[min(22rem,calc(100vw-2rem))] p-0">
					<Command shouldFilter={false}>
						<CommandInput
							value={search}
							onValueChange={setSearch}
							placeholder={placeholder}
						/>
						<CommandList>
							{filtered.length === 0 && !canAddCustom ? (
								<CommandEmpty>{emptyText}</CommandEmpty>
							) : null}
							<CommandGroup>
								{filtered.map((option) => (
									<CommandItem
										key={option}
										value={option}
										onSelect={() => addTag(option)}
									>
										<span>{option}</span>
										<Check className="ml-auto size-4 opacity-0" />
									</CommandItem>
								))}
								{canAddCustom && (
									<CommandItem
										value={customValue}
										onSelect={() => addTag(customValue)}
									>
										Add "{customValue}"
									</CommandItem>
								)}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			{value.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{value.map((tag) => (
						<Badge key={tag} variant="outline" className="h-7 gap-1 pr-1">
							{tag}
							<button
								type="button"
								className="rounded-full p-0.5 hover:bg-muted"
								onClick={() => removeTag(tag)}
							>
								<X className="size-3" />
							</button>
						</Badge>
					))}
				</div>
			)}
		</div>
	);
}
