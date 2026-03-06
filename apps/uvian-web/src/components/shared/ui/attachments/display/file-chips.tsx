'use client';

import type { FileAttachment } from '~/lib/domains/shared/attachments/types';
import { FileChip } from '../components/chips';

interface FileChipsProps {
  files: FileAttachment[];
}

export function FileChips({ files }: FileChipsProps) {
  const nonImageFiles = files.filter((f) => !f.mimeType?.startsWith('image/'));

  if (nonImageFiles.length === 0) {
    return null;
  }

  const handleFileClick = (file: FileAttachment) => {
    window.open(file.url, '_blank');
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {nonImageFiles.map((file) => (
        <FileChip
          key={file.key}
          file={file}
          onClick={() => handleFileClick(file)}
        />
      ))}
    </div>
  );
}
