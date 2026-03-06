import { SearchResultItemContent } from "./components/items";

export type SearchResultItemData = {
  type: string;
  key: string;
  url: string;
  content: SearchResultItemContent;
};