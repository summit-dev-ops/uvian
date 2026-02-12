import { ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@org/ui"
import Image from "next/image"
import { BaseSearchResultItemData, BaseSearchResultItemProps } from "~/components/shared/ui/search/types"

export interface SpaceItemSearchResultData extends BaseSearchResultItemData {
    type: "space"
    imageUrl: string
}

export interface SpaceItemSearchResultProps extends BaseSearchResultItemProps {
    data: SpaceItemSearchResultData
}

export function SpaceItemSearchResult({ data }: SpaceItemSearchResultProps) {
    return (
        <>
            <ItemMedia>
                <Image
                    src={data.imageUrl}
                    alt={data.label}
                    width={32}
                    height={32}
                    className="object-cover"
                />
            </ItemMedia>
            <ItemContent>
                <ItemTitle>{data.label}</ItemTitle>
                <ItemDescription>{data.type}</ItemDescription>
            </ItemContent>
        </>
    )
}