import {  Button, Item, ItemActions } from "@org/ui"
import { Plus } from "lucide-react"
import Link from "next/link"
import { ITEM_RENDERERS, SearchResultItemProps } from "./items"

function SearchResultContent({data}: SearchResultItemProps){
    switch(data.type){
        case "profile":
            return ITEM_RENDERERS.profile({data})
        case "space":
            return ITEM_RENDERERS.space({data})
    }
}

export function SearchResultItem({ data}: SearchResultItemProps) {

    return (
        <Item variant="outline">
            <Link href={data.url}>
            <SearchResultContent data={data}/>
            <ItemActions>
                <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    aria-label="Invite"
                >
                    <Plus />
                </Button>
            </ItemActions>
            </Link>
        </Item>
    )
}