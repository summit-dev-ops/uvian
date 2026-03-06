import { Button } from '@org/ui';
import { useSelectionContext } from '../contexts/search-selection-context';
import { SearchResultItemData } from '../types';
import { AtSign, X } from 'lucide-react';

export function SelectionDisplay() {
  const { selected, toggleSelected } =
    useSelectionContext<SearchResultItemData>();
  return (
    <div className="flex flex-row gap-2">
      {selected.map((selectedItem) => {
        return (
          <span
            key={`${selectedItem.key}`}
            className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full text-xs text-primary"
          >
            <AtSign className="h-3 w-3" />
            <span>{selectedItem.content.displayName}</span>
            <Button
              size={'icon'}
              variant={'ghost'}
              className="h-3 w-3"
              onClick={() => toggleSelected(selectedItem)}
            >
              <X className="h-3 w-3" />
            </Button>
          </span>
        );
      })}
    </div>
  );
}
