import { Button, cn, ScrollArea } from "@org/ui";
import { ChevronDown } from "lucide-react";
import React from "react";

export interface SearchResultsWrapper {
    className: string
    children: React.ReactElement,
    onEndReached: () => void
}

export function SearchResultsWrapper({ onEndReached, className, children }: SearchResultsWrapper) {
    return (
        <ScrollArea className={cn(className,
        )}>
            {children}
            <Button onClick={onEndReached}>
                <ChevronDown />
            </Button>
        </ScrollArea>
    )
}