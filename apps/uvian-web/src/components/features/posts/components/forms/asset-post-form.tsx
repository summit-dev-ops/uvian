'use client';

import * as React from 'react';
import { Image } from 'lucide-react';
import { Button } from '@org/ui';
import { AssetPickerDialog } from '~/components/features/assets';
import { AssetPreview } from '~/components/features/assets';
import type { AssetUI } from '~/lib/domains/assets';

export interface AssetPostFormProps {
  initialValues?: {
    asset?: AssetUI;
  };
  onChange?: (data: { assetId: string; asset: AssetUI }) => void;
  disabled?: boolean;
}

export function AssetPostForm({
  initialValues,
  onChange,
  disabled = false,
}: AssetPostFormProps) {
  const [showAssetPicker, setShowAssetPicker] = React.useState(false);
  const [asset, setAsset] = React.useState<AssetUI | undefined>(
    initialValues?.asset
  );

  const handleAssetSelect = (selectedAsset: AssetUI) => {
    setAsset(selectedAsset);
    onChange?.({
      assetId: selectedAsset.id,
      asset: selectedAsset,
    });
    setShowAssetPicker(false);
  };

  const handleRemoveAsset = () => {
    setAsset(undefined);
    onChange?.({
      assetId: '',
      asset: {} as AssetUI,
    });
  };

  return (
    <div className="space-y-4">
      {!asset ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowAssetPicker(true)}
          className="w-full"
          disabled={disabled}
        >
          <Image className="h-4 w-4 mr-2" />
          Select File
        </Button>
      ) : (
        <div className="relative">
          <AssetPreview asset={asset} onRemove={handleRemoveAsset} />
        </div>
      )}

      <AssetPickerDialog
        open={showAssetPicker}
        onOpenChange={setShowAssetPicker}
        onSelect={handleAssetSelect}
      />
    </div>
  );
}
