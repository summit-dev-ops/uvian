'use client';

import { Link as LinkIcon } from 'lucide-react';

interface ExternalPostItemProps {
  url: string;
  maxLines?: number;
}

export function ExternalPostItem({ url, maxLines }: ExternalPostItemProps) {
  const displayUrl =
    maxLines && url.length > 50 ? url.substring(0, 50) + '...' : url;

  return (
    <div className="flex items-center gap-2 p-3 bg-secondary rounded-md">
      <LinkIcon className="h-4 w-4 shrink-0" />
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm hover:underline truncate"
        title={url}
      >
        {displayUrl}
      </a>
    </div>
  );
}
