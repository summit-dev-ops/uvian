import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@org/ui';

export interface UserSearchResultItemContent {
  avatarUrl: string | null;
  displayName: string;
  userType: string;
  profileId: string;
}

export interface UserSearchResultItemProps {
  content: UserSearchResultItemContent;
}

export function UserSearchResultItem({ content }: UserSearchResultItemProps) {
  return (
    <>
      <ItemMedia>
        <Avatar className="size-10">
          <AvatarImage src={content.avatarUrl ?? undefined} />
          <AvatarFallback>ER</AvatarFallback>
        </Avatar>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{content.displayName}</ItemTitle>
        <ItemDescription>{content.userType}</ItemDescription>
      </ItemContent>
    </>
  );
}
