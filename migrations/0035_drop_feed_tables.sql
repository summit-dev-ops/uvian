-- Drop dead feed tables (events + feed_items)
-- Feed feature is being pruned - no data to preserve

DROP TABLE IF EXISTS public.feed_items;
DROP TABLE IF EXISTS public.events;
