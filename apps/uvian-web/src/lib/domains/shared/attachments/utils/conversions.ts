import type { AssetUI } from '~/lib/domains/assets';
import type { FileAttachment } from '../types';

export function assetToAttachment(asset: AssetUI): FileAttachment {
  return {
    type: 'file',
    key: asset.url,
    url: asset.url,
    filename: asset.filename || undefined,
    mimeType: asset.mimeType || undefined,
    size: asset.fileSizeBytes || undefined,
  };
}
