import { Avatar, AvatarFallback, AvatarImage, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@org/ui"
import { BaseSearchResultItemData, BaseSearchResultItemProps } from "~/components/shared/ui/search/types"

export interface ProfileItemSearchResultData extends BaseSearchResultItemData {
    type: "profile"
    avatarUrl: string
}

export interface ProfileItemSearchResultProps extends BaseSearchResultItemProps {
    data: ProfileItemSearchResultData
}

export function ProfileItemSearchResult({ data }: ProfileItemSearchResultProps) {
    return (
        <>
            <ItemMedia>
                <Avatar className="size-10">
                    <AvatarImage src={data.avatarUrl} />
                    <AvatarFallback>ER</AvatarFallback>
                </Avatar>
            </ItemMedia>
            <ItemContent>
                <ItemTitle>{data.label}</ItemTitle>
                <ItemDescription>{data.type}</ItemDescription>
            </ItemContent>
        </>
    )
}