'use client';

import { useState } from 'react';
import { Paperclip, Link as LinkIcon } from 'lucide-react';
import { Button } from '@org/ui';
import { AssetPickerDialog } from '~/components/features/assets/components/dialogs/asset-picker-dialog';
import { LinkInput } from '~/components/features/chat/components/link-input';
import type { AssetUI } from '~/lib/domains/assets';
import type { Attachment } from '~/lib/domains/shared/attachments/types';
import { assetToAttachment } from '~/lib/domains/shared/attachments/utils';

interface AttachmentInputProps {
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  showFiles?: boolean;
  showLinks?: boolean;
  mentionPickerProps?: {
    conversationId: string;
    onOpenChange: (open: boolean) => void;
    onSelect: (userId: string, label: string) => void;
  };
}

export function AttachmentInput({
  attachments,
  onAttachmentsChange,
  showFiles = true,
  showLinks = true,
  mentionPickerProps,
}: AttachmentInputProps) {
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);

  const handleAssetSelect = (asset: AssetUI) => {
    const fileAttachment = assetToAttachment(asset);
    onAttachmentsChange([...attachments, fileAttachment]);
    setShowAssetPicker(false);
  };

  const handleLinkAdd = (url: string) => {
    const linkAttachment: Attachment = {
      type: 'link',
      url,
    };
    onAttachmentsChange([...attachments, linkAttachment]);
    setShowLinkInput(false);
  };

  return (
    <>
      <div className="flex gap-2">
        {showFiles && (
          <AssetPickerDialog
            open={showAssetPicker}
            onOpenChange={setShowAssetPicker}
            onSelect={handleAssetSelect}
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAssetPicker(true)}
            >
              <Paperclip className="h-4 w-4 mr-1" />
              File
            </Button>
          </AssetPickerDialog>
        )}

        {showLinks && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowLinkInput(true)}
          >
            <LinkIcon className="h-4 w-4 mr-1" />
            Link
          </Button>
        )}
      </div>

      <LinkInput
        open={showLinkInput}
        onOpenChange={setShowLinkInput}
        onAdd={handleLinkAdd}
      />
    </>
  );
}
