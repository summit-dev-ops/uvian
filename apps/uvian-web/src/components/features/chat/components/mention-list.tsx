import { Avatar, AvatarFallback, cn } from '@org/ui';
import { AvatarImage } from '@radix-ui/react-avatar';
import React, {
  useEffect,
  useImperativeHandle,
  useState,
  forwardRef,
} from 'react';

export default forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.profileId, label: item.profile.displayName });
    }
  };

  const upHandler = () => {
    setSelectedIndex(
      (selectedIndex + props.items.length - 1) % props.items.length
    );
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  return (
    <div
      className={cn(
        'bg-popover text-popover-foreground min-w-32 rounded-lg p-1 shadow-md ring-1 ring-foreground/10',
        'overflow-hidden', // Added to ensure items don't bleed out
        'flex flex-col'
      )}
    >
      {props.items.length ? (
        props.items.map((item: any, index: number) => (
          <button
            key={index}
            onClick={() => selectItem(index)}
            // Item: Matches 'DropdownMenuItem' styles
            // We manually apply 'bg-accent' when selected because Tiptap handles the focus state, not the browser
            className={cn(
              'flex w-full cursor-default select-none items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-none',
              index === selectedIndex
                ? 'bg-accent text-accent-foreground'
                : 'text-popover-foreground hover:bg-muted'
            )}
          >
            <Avatar className="h-4 w-4">
              <AvatarImage src={item.profile.avatarUrl} className="h-4 w-4" />
              <AvatarFallback className="h-4 w-4">
                {item.profile.displayName}
              </AvatarFallback>
            </Avatar>
            {item.profile.displayName}
          </button>
        ))
      ) : (
        <div className="text-muted-foreground px-1.5 py-1 text-sm">
          No result
        </div>
      )}
    </div>
  );
});
