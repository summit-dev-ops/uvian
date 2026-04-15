from typing import Any, AsyncIterator, Dict, List, Optional, Sequence, Tuple
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.base import (
    BaseCheckpointSaver,
    Checkpoint,
    CheckpointMetadata,
    CheckpointTuple,
    ChannelVersions,
)
from core.logging import log


class SelectiveCheckpointer(BaseCheckpointSaver):
    """Wrapper that filters specific fields from checkpoint restoration.

    This allows certain state fields to be re-initialized fresh on each
    wakeup instead of being restored from the previous run's checkpoint.
    
    Additionally, certain fields can be merged with fresh values provided
    at initialization, deduplicating by name.
    """

    def __init__(self, base_checkpointer: BaseCheckpointSaver, exclude_keys: list[str], fresh_values: Optional[Dict[str, Any]] = None):
        self.base = base_checkpointer
        self.exclude_keys = set(exclude_keys)
        self.fresh_values = fresh_values or {}
        self.serde = base_checkpointer.serde

    async def aget_tuple(self, config: RunnableConfig) -> Optional[CheckpointTuple]:
        checkpoint_tuple = await self.base.aget_tuple(config)
        if checkpoint_tuple is None:
            return None

        filtered_checkpoint = self._filter_excluded_keys(checkpoint_tuple.checkpoint)
        
        # Merge fresh values with checkpoint values for loaded_mcps and loaded_skills
        if self.fresh_values:
            channel_values = filtered_checkpoint.get("channel_values", {})
            for key in ["loaded_mcps", "loaded_skills"]:
                if key in self.fresh_values:
                    checkpoint_value = channel_values.get(key, [])
                    merged = self._merge_by_name(checkpoint_value, self.fresh_values[key])
                    channel_values[key] = merged
            filtered_checkpoint = {
                **filtered_checkpoint,
                "channel_values": channel_values
            }
        
        return CheckpointTuple(
            config=checkpoint_tuple.config,
            checkpoint=filtered_checkpoint,
            metadata=checkpoint_tuple.metadata,
            parent_config=checkpoint_tuple.parent_config
        )

    def _filter_excluded_keys(self, checkpoint: Checkpoint) -> Checkpoint:
        """Remove excluded keys from checkpoint channel_values."""
        channel_values = checkpoint.get("channel_values", {})
        if not channel_values:
            return checkpoint
        
        filtered_values = {
            k: v for k, v in channel_values.items()
            if k not in self.exclude_keys
        }
        
        return {
            **checkpoint,
            "channel_values": filtered_values
        }

    def _merge_by_name(self, previous: List[Any], fresh: List[Any]) -> List[Any]:
        """Merge two lists of dicts, deduplicating by 'name' field."""
        seen = {}
        for item in previous + fresh:
            name = item.get("name") if isinstance(item, dict) else None
            if name:
                seen[name] = item
        return list(seen.values())

    async def aput(
        self,
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: ChannelVersions,
    ) -> RunnableConfig:
        return await self.base.aput(config, checkpoint, metadata, new_versions)

    async def alist(
        self,
        config: RunnableConfig,
        *,
        filter: Optional[Dict[str, Any]] = None,
        before: Optional[RunnableConfig] = None,
        limit: Optional[int] = None,
    ) -> AsyncIterator[CheckpointTuple]:
        async for checkpoint_tuple in self.base.alist(config, filter=filter, before=before, limit=limit):
            filtered_checkpoint = self._filter_excluded_keys(checkpoint_tuple.checkpoint)
            yield CheckpointTuple(
                config=checkpoint_tuple.config,
                checkpoint=filtered_checkpoint,
                metadata=checkpoint_tuple.metadata,
                parent_config=checkpoint_tuple.parent_config
            )

    async def aput_writes(
        self,
        config: RunnableConfig,
        writes: Sequence[Tuple[str, Any]],
        task_id: str,
    ) -> None:
        await self.base.aput_writes(config, writes, task_id)

    async def aget_next_version(
        self,
        current_version: Optional[str],
        channel_config: Dict[str, Any],
    ) -> Optional[str]:
        return await self.base.aget_next_version(current_version, channel_config)