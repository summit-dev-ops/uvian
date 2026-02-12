import { SpaceItemSearchResult, SpaceItemSearchResultData } from "~/components/features/spaces/components/search";
import { ProfileItemSearchResult, ProfileItemSearchResultData } from "~/components/features/user/components/search";

export type SearchResultItemData = ProfileItemSearchResultData | SpaceItemSearchResultData

export interface SearchResultItemProps {
  data: SearchResultItemData
}
export const ITEM_RENDERERS = {
    profile: ProfileItemSearchResult,
    space: SpaceItemSearchResult
}