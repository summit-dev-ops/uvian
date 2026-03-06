'use client';

import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { Button, InputGroup, InputGroupAddon, InputGroupButton } from '@org/ui';
import {
  SendHorizontal,
  Paperclip,
  AtSign,
  Link as LinkIcon,
  X,
} from 'lucide-react';
import { RichTextArea } from '~/components/shared/ui/rich-input';
import { AssetPickerDialog } from '~/components/features/assets';
import { MentionPickerDialog } from './mention-picker-dialog';
import { LinkInput } from './link-input';
import { useQueryClient } from '@tanstack/react-query';
import { chatQueries } from '~/lib/domains/chat/api';
import { userQueries } from '~/lib/domains/user/api';
import type { AssetUI } from '~/lib/domains/assets';
import { Attachment, MentionAttachment } from '~/lib/domains/posts/types';

interface ChatInputProps {
  value: string;
  context: { conversationId: string };
  onChange: (value: string) => void;
  onSend: () => void;
  attachments?: Attachment[];
  onAttachmentsChange?: (attachments: Attachment[]) => void;
  disabled?: boolean;
}

export function ChatInput({
  value,
  context,
  onChange,
  onSend,
  attachments = [],
  onAttachmentsChange,
  disabled,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);

  const fetchMembers = useMemo(
    () => async () => {
      return queryClient.fetchQuery(
        chatQueries.conversationMembers(context.conversationId)
      );
    },
    [queryClient, context.conversationId]
  );

  const fetchProfiles = useMemo(
    () => async (userIds: string[]) => {
      const result = await queryClient.fetchQuery(
        userQueries.profilesByUserIds(userIds)
      );
      return result || {};
    },
    [queryClient]
  );

  const mentionSearchFn = useCallback(
    async (query: string) => {
      const members = await fetchMembers();
      const profilesMap = await fetchProfiles(
        members.map((m: any) => m.userId)
      );
      const membersWithProfiles = members.map((member: any) => ({
        ...member,
        profile: profilesMap[member.userId],
      }));

      if (!query.trim()) {
        return membersWithProfiles.map((m: any) => ({
          key: m.userId,
          type: 'user',
          url: '',
          content: {
            displayName: m.profile?.displayName || '',
            avatarUrl: m.profile?.avatarUrl || null,
            userType: m.profile?.type || 'human',
            profileId: m.profile?.id || '',
          },
        }));
      }

      const q = query.toLowerCase();
      const filtered = membersWithProfiles.filter((m: any) =>
        m.profile?.displayName?.toLowerCase().includes(q)
      );

      return filtered.map((m: any) => ({
        key: m.userId,
        type: 'user',
        url: '',
        content: {
          displayName: m.profile?.displayName || '',
          avatarUrl: m.profile?.avatarUrl || null,
          userType: m.profile?.type || 'human',
          profileId: m.profile?.id || '',
        },
      }));
    },
    [fetchMembers, fetchProfiles]
  );

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleAssetSelect = (asset: AssetUI) => {
    const fileAttachment: Attachment = {
      key: asset.url,
      type: 'file',
      url: asset.url,
      filename: asset.filename || undefined,
      mimeType: asset.mimeType || undefined,
      size: asset.fileSizeBytes || undefined,
    };
    onAttachmentsChange?.([...attachments, fileAttachment]);
    setShowAssetPicker(false);
  };

  const handleMentionConfirm = (mentions: MentionAttachment[]) => {
    const nonMentions = attachments.filter((a) => a.type !== 'mention');
    onAttachmentsChange?.([...nonMentions, ...mentions]);
  };

  const handleMentionCancel = () => {
    setShowMentionPicker(false);
  };

  const handleLinkAdd = (url: string) => {
    const linkAttachment: Attachment = {
      key: url,
      type: 'link',
      url,
    };
    onAttachmentsChange?.([...attachments, linkAttachment]);
  };

  const removeAttachment = (key: string) => {
    const newAttachments = attachments.filter((a) => a.key !== key);
    onAttachmentsChange?.(newAttachments);
  };

  return (
    <>
      <InputGroup className="bg-background rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden focus:ring-primary/20 focus:border-primary/40 transition-all has-[>textarea]:h-auto flex-col">
        <InputGroupAddon
          align="block-start"
          className="flex items-center justify-between px-3 bg-muted/5"
        >
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center justify-start">
              {attachments.map((attachment) => (
                <div
                  key={attachment.key}
                  className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
                >
                  {attachment.type === 'mention' && (
                    <AtSign className="h-3 w-3" />
                  )}
                  {attachment.type === 'file' && (
                    <Paperclip className="h-3 w-3" />
                  )}
                  {attachment.type === 'link' && (
                    <LinkIcon className="h-3 w-3" />
                  )}
                  <span className="max-w-[150px] truncate">
                    {attachment.type === 'mention'
                      ? attachment.label
                      : attachment.type === 'file'
                      ? attachment.filename
                      : attachment.url}
                  </span>
                  <Button
                    variant={'ghost'}
                    size={'icon'}
                    className="h-4 w-4"
                    onClick={() => removeAttachment(attachment.key)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </InputGroupAddon>

        <RichTextArea
          value={value}
          onChange={(newValue) => onChange(newValue)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="py-3.5 px-4 max-h-[200px] overflow-y-auto"
          disabled={disabled}
          mentionSearch={mentionSearchFn}
        />

        <InputGroupAddon
          align="block-end"
          className="flex items-center justify-between px-3 pb-3 bg-muted/5"
        >
          <div className="flex items-center gap-1">
            <InputGroupButton
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setShowMentionPicker(true)}
              type="button"
            >
              <AtSign className="h-5 w-5" />
            </InputGroupButton>
            <InputGroupButton
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setShowAssetPicker(true)}
              type="button"
            >
              <Paperclip className="h-5 w-5" />
            </InputGroupButton>
            <InputGroupButton
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setShowLinkInput(true)}
              type="button"
            >
              <LinkIcon className="h-5 w-5" />
            </InputGroupButton>
          </div>

          <InputGroupButton
            size="icon-sm"
            variant="default"
            onClick={onSend}
            disabled={!value.trim() || disabled}
            className="rounded-xl shrink-0"
          >
            <SendHorizontal className="h-4 w-4" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>

      <AssetPickerDialog
        open={showAssetPicker}
        onOpenChange={setShowAssetPicker}
        onSelect={handleAssetSelect}
      />
      <MentionPickerDialog
        conversationId={context.conversationId}
        open={showMentionPicker}
        onOpenChange={setShowMentionPicker}
        onConfirm={handleMentionConfirm}
        onCancel={handleMentionCancel}
      />
      <LinkInput
        open={showLinkInput}
        onOpenChange={setShowLinkInput}
        onAdd={handleLinkAdd}
      />
    </>
  );
}
