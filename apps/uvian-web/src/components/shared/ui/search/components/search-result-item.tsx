import { Button, Item, ItemActions } from '@org/ui';
import { Check, Plus } from 'lucide-react';
import { SearchResultItemData } from '../types';
import { ITEM_RENDERERS } from './items';
import { useSelectionContext } from '../contexts/search-selection-context';

export interface SearchResultItemContentProps {
  data: SearchResultItemData;
}

function SearchResultContent({ data }: SearchResultItemContentProps) {
  switch (data.type) {
    case 'user':
      return ITEM_RENDERERS.user?.({ content: data.content });
    default:
      return null;
  }
}

export interface SearchResultItemProps {
  data: SearchResultItemData;
}
export function SearchResultItem({ data }: SearchResultItemProps) {
  const { isSelected, toggleSelected } =
    useSelectionContext<SearchResultItemData>();
  const isItemSelected = isSelected(data);
  return (
    <Item variant="outline">
      <SearchResultContent data={data} />
      <ItemActions>
        <Button
          size="icon"
          variant="outline"
          className="rounded-full"
          aria-label="Invite"
          onClick={() => toggleSelected(data)}
        >
          {isItemSelected ? <Check /> : <Plus />}
        </Button>
      </ItemActions>
    </Item>
  );
}
