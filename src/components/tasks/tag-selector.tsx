"use client";

import { Check, ChevronsUpDown, Loader2, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { createTag, getTags } from "@/app/actions/tasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Tag {
	id: string;
	name: string;
	color: string;
}

interface TagSelectorProps {
	value?: string[];
	onChange: (value: string[]) => void;
}

const DEFAULT_TAGS: { name: string; color: string }[] = [
	{ name: "Matemática", color: "#3b82f6" },
	{ name: "Física", color: "#8b5cf6" },
	{ name: "Química", color: "#10b981" },
	{ name: "Biologia", color: "#22c55e" },
	{ name: "Português", color: "#f59e0b" },
	{ name: "Redação", color: "#f97316" },
	{ name: "História", color: "#ef4444" },
	{ name: "Geografia", color: "#06b6d4" },
	{ name: "Filosofia", color: "#a855f7" },
	{ name: "Sociologia", color: "#ec4899" },
	{ name: "Inglês", color: "#6366f1" },
	{ name: "Literatura", color: "#d946ef" },
];

const DEFAULT_NAMES_LOWER = new Set(
	DEFAULT_TAGS.map((d) => d.name.toLowerCase()),
);

export function TagSelector({ value = [], onChange }: TagSelectorProps) {
	const [open, setOpen] = useState(false);
	const [tags, setTags] = useState<Tag[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [searchValue, setSearchValue] = useState("");

	useEffect(() => {
		setIsLoading(true);
		getTags()
			.then((data) => setTags(data))
			.catch(() => toast.error("Erro ao carregar tags"))
			.finally(() => setIsLoading(false));
	}, []);

	const defaultTagMap = useMemo(() => {
		const map = new Map<string, Tag>();
		for (const tag of tags) {
			if (DEFAULT_NAMES_LOWER.has(tag.name.toLowerCase())) {
				map.set(tag.name.toLowerCase(), tag);
			}
		}
		return map;
	}, [tags]);

	const customTags = useMemo(
		() => tags.filter((t) => !DEFAULT_NAMES_LOWER.has(t.name.toLowerCase())),
		[tags],
	);

	const selectedTags = useMemo(
		() => tags.filter((t) => value.includes(t.id)),
		[tags, value],
	);

	const toggleTag = (tagId: string) => {
		if (value.includes(tagId)) {
			onChange(value.filter((id) => id !== tagId));
		} else {
			onChange([...value, tagId]);
		}
	};

	const handleSelectDefault = (preset: { name: string; color: string }) => {
		const existing = defaultTagMap.get(preset.name.toLowerCase());

		if (existing) {
			toggleTag(existing.id);
			return;
		}

		startTransition(async () => {
			try {
				const newTag = await createTag(preset.name, preset.color);
				setTags((prev) => [...prev, newTag]);
				onChange([...value, newTag.id]);
			} catch {
				toast.error("Erro ao criar tag");
			}
		});
	};

	const handleCreateCustom = () => {
		if (!searchValue.trim()) return;

		startTransition(async () => {
			try {
				const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;
				const newTag = await createTag(searchValue.trim(), randomColor);
				setTags((prev) => [...prev, newTag]);
				onChange([...value, newTag.id]);
				setSearchValue("");
				toast.success("Tag criada!");
			} catch {
				toast.error("Erro ao criar tag");
			}
		});
	};

	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen);
		if (!nextOpen) {
			setSearchValue("");
		}
	};

	const allNamesLower = useMemo(() => {
		const names = new Set(tags.map((t) => t.name.toLowerCase()));
		for (const d of DEFAULT_TAGS) names.add(d.name.toLowerCase());
		return names;
	}, [tags]);

	const showCreateOption =
		searchValue.trim().length > 0 &&
		!allNamesLower.has(searchValue.trim().toLowerCase());

	return (
		<div className="flex flex-col gap-2">
			<Popover open={open} onOpenChange={handleOpenChange}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						className="w-full justify-between"
						disabled={isLoading}
					>
						{isLoading ? (
							<span className="flex items-center gap-2 text-muted-foreground">
								<Loader2 className="h-4 w-4 animate-spin" />
								Carregando tags...
							</span>
						) : selectedTags.length > 0 ? (
							<span className="text-sm truncate">
								{selectedTags.length} tag{selectedTags.length > 1 ? "s" : ""} selecionada{selectedTags.length > 1 ? "s" : ""}
							</span>
						) : (
							"Selecione tags..."
						)}
						<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[300px] p-0" align="start">
					<Command shouldFilter={true}>
						<CommandInput
							placeholder="Procurar tag..."
							value={searchValue}
							onValueChange={setSearchValue}
						/>
						<CommandList>
							<CommandEmpty>
								<p className="text-sm text-muted-foreground">
									Nenhuma tag encontrada.
								</p>
							</CommandEmpty>

							<CommandGroup heading="Matérias">
								{DEFAULT_TAGS.map((preset) => {
									const dbTag = defaultTagMap.get(preset.name.toLowerCase());
									const isSelected = !!dbTag && value.includes(dbTag.id);
									return (
										<CommandItem
											key={preset.name}
											value={preset.name}
											disabled={isPending}
											onSelect={() => handleSelectDefault(preset)}
										>
											<Check
												className={cn(
													"mr-2 h-4 w-4",
													isSelected ? "opacity-100" : "opacity-0",
												)}
											/>
											<div
												className="h-3 w-3 rounded-full mr-2 border border-black/10"
												style={{ backgroundColor: preset.color }}
											/>
											{preset.name}
										</CommandItem>
									);
								})}
							</CommandGroup>

							{customTags.length > 0 && (
								<>
									<CommandSeparator />
									<CommandGroup heading="Minhas tags">
										{customTags.map((tag) => (
											<CommandItem
												key={tag.id}
												value={tag.name}
												onSelect={() => toggleTag(tag.id)}
											>
												<Check
													className={cn(
														"mr-2 h-4 w-4",
														value.includes(tag.id) ? "opacity-100" : "opacity-0",
													)}
												/>
												<div
													className="h-3 w-3 rounded-full mr-2 border border-black/10"
													style={{ backgroundColor: tag.color }}
												/>
												{tag.name}
											</CommandItem>
										))}
									</CommandGroup>
								</>
							)}

							{showCreateOption && (
								<CommandGroup forceMount>
									<CommandItem
										forceMount
										value={`__create__${searchValue}`}
										onSelect={handleCreateCustom}
										disabled={isPending}
									>
										{isPending ? (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										) : (
											<Plus className="mr-2 h-4 w-4" />
										)}
										Criar "{searchValue.trim()}"
									</CommandItem>
								</CommandGroup>
							)}
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

			{selectedTags.length > 0 && (
				<div className="flex flex-wrap gap-1.5">
					{selectedTags.map((tag) => (
						<Badge
							key={tag.id}
							variant="secondary"
							className="gap-1 pr-1"
							style={{ borderColor: tag.color }}
						>
							<div
								className="h-2 w-2 rounded-full"
								style={{ backgroundColor: tag.color }}
							/>
							{tag.name}
							<button
								type="button"
								className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
								onClick={() => toggleTag(tag.id)}
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					))}
				</div>
			)}
		</div>
	);
}
