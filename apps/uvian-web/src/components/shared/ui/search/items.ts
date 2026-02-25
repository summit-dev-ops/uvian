// Placeholder for search items - to be implemented
export type SearchResultItemData = {
  type: string;
  url: string;
  [key: string]: unknown;
};

export interface SearchResultItemProps {
  data: SearchResultItemData;
}
export const ITEM_RENDERERS: Record<
  string,
  React.FC<{ data: SearchResultItemData }>
> = {};
