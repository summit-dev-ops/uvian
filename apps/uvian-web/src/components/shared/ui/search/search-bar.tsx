import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@org/ui";
import { SearchIcon, X } from "lucide-react";

export interface SearchBarProps {
    query: string
    onChange: (newValue: string) => void
}

export function SearchBar({ query, onChange }: SearchBarProps) {
    return (
        <InputGroup>
            <InputGroupInput
                value={query}
                onChange={(e) => onChange(e.target.value)}
                placeholder={"Try searching for..."}
            />
            <InputGroupAddon>
                <SearchIcon />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
                {query && (
                    <InputGroupButton
                        size="icon-xs" aria-label="Copy"
                        onClick={() => onChange("")}
                    >
                        <X />
                    </InputGroupButton>
                )}
            </InputGroupAddon>
        </InputGroup>
    )
}