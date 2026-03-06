'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Image,
  Link as LinkIcon,
  Loader2,
} from 'lucide-react';
import { Button, Spinner } from '@org/ui';
import { notesQueries } from '~/lib/domains/notes/api';
import { assetsQueries } from '~/lib/domains/assets/api';
import { MarkdownView } from '~/components/shared/ui/markdown';
import {
  ImageGallery,
  ImageChips,
  FileChips,
} from '~/components/shared/ui/attachments/display';
import {
  isImageAttachment,
  isFileAttachment,
} from '~/lib/domains/shared/attachments/utils';
import type { Attachment } from '~/lib/domains/shared/attachments/types';
import type { PostContent } from '~/lib/domains/posts/types';

interface PostDetailCarouselProps {
  spaceId: string;
  contents: PostContent[];
}

function ContentTypeIcon({ contentType }: { contentType: string }) {
  switch (contentType) {
    case 'note':
      return <FileText className="h-4 w-4" />;
    case 'asset':
      return <Image className="h-4 w-4" />;
    case 'external':
      return <LinkIcon className="h-4 w-4" />;
    default:
      return null;
  }
}

export function PostDetailCarousel({
  spaceId,
  contents,
}: PostDetailCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const currentContent = contents[currentIndex];
  const totalCount = contents.length;

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(totalCount - 1, prev + 1));
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  if (!currentContent) {
    return <div className="text-muted-foreground">No content</div>;
  }

  return (
    <div className=" max-w-3xl mx-auto">
      {/* Main Content Display */}
      <div className="flex min-h-[200px] ">
        <CarouselContent spaceId={spaceId} content={currentContent} />
      </div>

      {/* Navigation Controls */}
      {totalCount > 1 && (
        <div className="space-y-3">
          {/* Dot Indicators */}
          <div className="flex justify-center gap-2">
            {contents.map((_, index) => (
              <button
                key={index}
                onClick={() => goToIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-6 bg-primary'
                    : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Go to content ${index + 1}`}
              />
            ))}
          </div>

          {/* Prev/Next Buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {totalCount}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              disabled={currentIndex === totalCount - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Thumbnail Strip */}
          <div className="flex justify-center gap-2 pt-2">
            {contents.map((content, index) => (
              <button
                key={content.id}
                onClick={() => goToIndex(index)}
                className={`h-10 w-10 rounded-md border-2 flex items-center justify-center transition-colors ${
                  index === currentIndex
                    ? 'border-primary bg-primary/10'
                    : 'border-transparent hover:bg-muted'
                }`}
                title={content.contentType}
              >
                <ContentTypeIcon contentType={content.contentType} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface CarouselContentProps {
  spaceId: string;
  content: PostContent;
}

function CarouselContent({ spaceId, content }: CarouselContentProps) {
  switch (content.contentType) {
    case 'note':
      return <NoteContent spaceId={spaceId} noteId={content.noteId} />;

    case 'asset':
      return <AssetContent assetId={content.assetId} />;

    case 'external':
      if (!content.url) {
        return (
          <div className="flex items-center gap-2 p-4 bg-secondary rounded-md">
            <span className="text-sm text-muted-foreground">URL missing</span>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-2 p-4 bg-secondary rounded-md">
          <LinkIcon className="h-5 w-5" />
          <a
            href={content.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm hover:underline"
          >
            {content.url}
          </a>
        </div>
      );

    default:
      return <div className="text-muted-foreground">Unknown content type</div>;
  }
}

interface NoteContentProps {
  spaceId: string;
  noteId: string | null;
}

function NoteContent({ spaceId, noteId }: NoteContentProps) {
  if (!noteId) {
    return (
      <div className="flex items-center gap-2 p-4 bg-secondary rounded-md">
        <span className="text-sm text-muted-foreground">
          Note reference missing
        </span>
      </div>
    );
  }

  const { data: note, isLoading } = useQuery(
    notesQueries.note(spaceId, noteId)
  );

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col  items-center justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex items-center gap-2 p-4 bg-secondary rounded-md">
        <FileText className="h-5 w-5" />
        <span className="text-sm text-muted-foreground">Note not found</span>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-4 gap-2">
      <h1 className="text-2xl font-bold">{note.title}</h1>
      {note.body && <MarkdownView content={note.body} />}

      {/* Note Attachments */}
      {note.attachments && note.attachments.length > 0 && (
        <NoteAttachments attachments={note.attachments} />
      )}
    </div>
  );
}

function NoteAttachments({ attachments }: { attachments: any[] }) {
  const images = attachments.filter(isImageAttachment);
  const files = attachments.filter(isFileAttachment);

  if (images.length === 0 && files.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {images.length > 0 && <ImageChips images={images} />}
      {files.length > 0 && <FileChips files={files} />}
    </div>
  );
}

interface AssetContentProps {
  assetId: string | null;
}

function AssetContent({ assetId }: AssetContentProps) {
  if (!assetId) {
    return (
      <div className="flex items-center gap-2 p-4 bg-secondary rounded-md">
        <span className="text-sm text-muted-foreground">
          Asset reference missing
        </span>
      </div>
    );
  }

  const { data: asset, isLoading } = useQuery(assetsQueries.detail(assetId));

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col  items-center justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex items-center gap-2 p-4 bg-secondary rounded-md">
        <Image className="h-5 w-5" />
        <span className="text-sm text-muted-foreground">Asset not found</span>
      </div>
    );
  }

  const attachment: Attachment = {
    type: 'file',
    key: asset.url,
    url: asset.url,
    filename: asset.filename || undefined,
    mimeType: asset.mimeType || undefined,
    size: asset.fileSizeBytes || undefined,
  };

  if (asset.mimeType?.startsWith('image/')) {
    return (
      <img
        src={asset.url}
        alt={asset.filename || 'Image'}
        className="flex flex-1"
        loading="lazy"
      />
    );
  }

  return <FileChips files={[attachment]} />;
}
