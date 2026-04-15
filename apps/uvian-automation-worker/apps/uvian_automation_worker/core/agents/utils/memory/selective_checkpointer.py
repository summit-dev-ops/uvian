from typing import Any, AsyncIterator, Dict, Optional, Sequence, Tuple
from dataclasses import replace
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
    """

    def __init__(self, base_checkpointer: BaseCheckpointSaver, exclude_keys: list[str]):
        self.base = base_checkpointer
        self.exclude_keys = set(exclude_keys)
        self.serde = base_checkpointer.serde

    async def aget_tuple(self, config: RunnableConfig) -> Optional[CheckpointTuple]:
        checkpoint_tuple = await self.base.aget_tuple(config)
        if checkpoint_tuple is None:
            return None

        filtered_checkpoint = self._filter_excluded_keys(checkpoint_tuple.checkpoint)
        return replace(checkpoint_tuple, checkpoint=filtered_checkpoint)

    def _filter_excluded_keys(self, checkpoint: Checkpoint) -> Checkpoint:
        """Remove excluded keys from checkpoint channels."""
        if not checkpoint.channels:
            return checkpoint

        filtered_channels = {}
        for key, value in checkpoint.channels.items():
            if key in self.exclude_keys:
                continue
            filtered_channels[key] = value

        return replace(checkpoint, channels=filtered_channels)

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
            yield replace(checkpoint_tuple, checkpoint=filtered_checkpoint)

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