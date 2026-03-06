'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@org/ui';
import {
  FileText,
  Image,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { PostUI, PostContent } from '~/lib/domains/posts/types';
import { NotePostItem } from './note-post-item';
import { AssetPostItem } from './asset-post-item';
import { ExternalPostItem } from './external-post-item';

interface PostItemProps {
  post: PostUI;
  spaceId: string;
}

function getInitials(displayName: string): string {
  return displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function ContentTypeIcon({ contentType }: { contentType: string }) {
  switch (contentType) {
    case 'note':
      return <FileText className="h-3 w-3" />;
    case 'asset':
      return <Image className="h-3 w-3" />;
    case 'external':
      return <LinkIcon className="h-3 w-3" />;
    default:
      return null;
  }
}

function renderContent(
  content: PostContent,
  spaceId: string,
  maxLines?: number
) {
  if (content.contentType === 'note' && content.noteId) {
    return (
      <NotePostItem
        spaceId={spaceId}
        noteId={content.noteId}
        maxLines={maxLines}
      />
    );
  }
  if (content.contentType === 'asset' && content.assetId) {
    return <AssetPostItem assetId={content.assetId} />;
  }
  if (content.contentType === 'external' && content.url) {
    return <ExternalPostItem url={content.url} maxLines={maxLines} />;
  }
  return null;
}

interface PostItemHeaderProps {
  profile: PostUI['authorProfile'];
  createdAt: string;
}

function PostItemHeader({ profile, createdAt }: PostItemHeaderProps) {
  const displayName = profile?.displayName ?? 'Loading...';
  const initials = getInitials(profile?.displayName ?? 'U');

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-8 w-8">
        {profile?.avatarUrl && (
          <AvatarImage src={profile.avatarUrl} alt={displayName} />
        )}
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{displayName}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(createdAt).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

interface PostItemContentProps {
  contents: PostContent[];
  spaceId: string;
  maxLines?: number;
}

function PostItemContent({
  contents,
  spaceId,
  maxLines,
}: PostItemContentProps) {
  const firstContent = contents[0];

  if (!firstContent) {
    return <div className="text-sm text-muted-foreground">No content</div>;
  }

  return <div>{renderContent(firstContent, spaceId, maxLines)}</div>;
}

interface PostItemFooterProps {
  contents: PostContent[];
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function PostItemFooter({
  contents,
  isExpanded,
  onToggleExpand,
}: PostItemFooterProps) {
  const additionalCount = contents.length - 1;
  const hasMultipleContents = additionalCount > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        {hasMultipleContents && (
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1">
              {contents.slice(1).map((c) => (
                <div
                  key={c.id}
                  className="h-5 w-5 rounded-full bg-secondary border flex items-center justify-center"
                  title={c.contentType}
                >
                  <ContentTypeIcon contentType={c.contentType} />
                </div>
              ))}
            </div>
            <span>+{additionalCount} more</span>
          </div>
        )}
      </div>
      <button
        onClick={onToggleExpand}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-4 w-4" />
            <span>Show less</span>
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" />
            <span>Show more</span>
          </>
        )}
      </button>
    </div>
  );
}

export function PostItem({ post, spaceId }: PostItemProps) {
  const router = useRouter();
  const contents = post.contents || [];
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleContentClick = () => {
    router.push(`/spaces/${spaceId}/posts/${post.id}`);
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const maxLines = isExpanded ? undefined : 3;

  return (
    <div className="p-4 border-b hover:bg-muted/50 transition-colors">
      <PostItemHeader profile={post.authorProfile} createdAt={post.createdAt} />
      <div className="mt-3" onClick={handleContentClick}>
        <PostItemContent
          contents={contents}
          spaceId={spaceId}
          maxLines={maxLines}
        />
      </div>
      <div className="mt-3">
        <PostItemFooter
          contents={contents}
          isExpanded={isExpanded}
          onToggleExpand={handleToggleExpand}
        />
      </div>
    </div>
  );
}
