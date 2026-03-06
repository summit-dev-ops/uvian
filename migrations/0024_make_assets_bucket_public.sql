-- Make assets bucket public
-- This allows attachment URLs to be permanent without needing signed URLs

UPDATE storage.buckets SET public = true WHERE id = 'assets';
