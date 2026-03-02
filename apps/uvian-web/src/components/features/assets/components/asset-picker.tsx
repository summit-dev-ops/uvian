'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Image, FileText, Files } from 'lucide-react';
import { Button } from '@org/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@org/ui';
import { Toggle } from '@org/ui';
import { cn } from '@org/ui';
import { assetsQueries, assetsMutations } from '~/lib/domains/assets';
import { AssetUploadZone } from './asset-upload-zone';
import { AssetList } from './asset-list';
import type { AssetUI, AssetType } from '~/lib/domains/assets';

type Tab = 'upload' | 'library';
type FilterType = 'all' | 'image' | 'text';

interface AssetPickerProps {
  onSelect?: (asset: AssetUI) => void;
  onClose?: () => void;
  selectedAssetId?: string;
  className?: string;
}

function getAssetType(mimeType: string): AssetType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('text/')) return 'text';
  return 'document';
}

const FILTER_OPTIONS: {
  value: FilterType;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: 'all', label: 'All', icon: Files },
  { value: 'image', label: 'Images', icon: Image },
  { value: 'text', label: 'Text', icon: FileText },
];

export function AssetPicker({
  onSelect,
  onClose,
  selectedAssetId,
  className,
}: AssetPickerProps) {
  const [activeTab, setActiveTab] = React.useState<Tab>('upload');
  const [filter, setFilter] = React.useState<FilterType>('all');
  const queryClient = useQueryClient();

  const { data: assetsData, isLoading: isLoadingAssets } = useQuery({
    ...assetsQueries.list({ type: filter === 'all' ? undefined : filter }),
    enabled: activeTab === 'library',
  });

  const uploadMutation = useMutation({
    ...assetsMutations.uploadAsset(queryClient),
  });

  const deleteMutation = useMutation({
    ...assetsMutations.deleteAsset(queryClient),
  });

  const handleFileSelect = React.useCallback(
    async (file: File) => {
      try {
        const assetType = getAssetType(file.type);
        const asset = await uploadMutation.mutateAsync({
          file,
          type: assetType,
        });
        onSelect?.(asset);
        onClose?.();
      } catch (error) {
        console.error('Upload failed:', error);
      }
    },
    [uploadMutation, onSelect, onClose]
  );

  const handleAssetSelect = React.useCallback(
    (asset: AssetUI) => {
      onSelect?.(asset);
      onClose?.();
    },
    [onSelect, onClose]
  );

  const handleDelete = React.useCallback(
    async (assetId: string) => {
      try {
        await deleteMutation.mutateAsync({ assetId });
      } catch (error) {
        console.error('Delete failed:', error);
      }
    },
    [deleteMutation]
  );

  const isUploading = uploadMutation.isPending;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
          <TabsTrigger
            value="upload"
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent',
              'text-muted-foreground data-[state=active]:text-foreground'
            )}
          >
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger
            value="library"
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent',
              'text-muted-foreground data-[state=active]:text-foreground'
            )}
          >
            <Image className="h-4 w-4" />
            Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-0">
          <div className="no-scrollbar -mx-4 max-h-[50vh] overflow-y-auto px-4">
            <AssetUploadZone
              onFileSelect={handleFileSelect}
              isUploading={isUploading}
            />
          </div>
        </TabsContent>

        <TabsContent value="library" className="mt-0">
          <div className="no-scrollbar -mx-4 max-h-[50vh] overflow-y-auto px-4">
            <div className="flex gap-1 mb-4">
              {FILTER_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <Toggle
                    key={option.value}
                    pressed={filter === option.value}
                    onPressedChange={(pressed) => {
                      if (pressed) setFilter(option.value);
                    }}
                    className="gap-1.5 px-3 py-1.5 text-xs font-medium"
                  >
                    <Icon className="h-3 w-3" />
                    {option.label}
                  </Toggle>
                );
              })}
            </div>
            <AssetList
              assets={assetsData?.assets || []}
              onSelect={handleAssetSelect}
              onDelete={handleDelete}
              selectedAssetId={selectedAssetId}
              isLoading={isLoadingAssets}
            />
          </div>
        </TabsContent>
      </Tabs>

      {onClose && (
        <div className="border-t p-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
