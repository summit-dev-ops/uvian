import json
from typing import Any, AsyncIterator, Dict, Optional, Sequence, Tuple
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.base import (
    BaseCheckpointSaver,
    Checkpoint,
    CheckpointMetadata,
    CheckpointTuple,
    ChannelVersions,
)
from repositories.checkpoints import checkpoint_repository
from langgraph.checkpoint.serde.jsonplus import JsonPlusSerializer


def decode_supabase_bytea(value: Any) -> bytes:
    """Converts Supabase PostgREST bytea value back to bytes."""
    if isinstance(value, bytes):
        return value
    if isinstance(value, str):
        if value.startswith(r"\x"):
            return bytes.fromhex(value[2:])
        return value.encode("utf-8")
    return b""


class PostgresAsyncCheckpointer(BaseCheckpointSaver):
    """
    A LangGraph Checkpointer implementation for PostgreSQL (Supabase) 
    that respects the BaseCheckpointSaver contract.
    """
    def __init__(self):
        super().__init__()
        # 1. Serializer: Converts LangChain objects (Messages, etc.) -> JSON Compatible Bytes
        self.serde = JsonPlusSerializer()


    async def aget_tuple(self, config: RunnableConfig) -> Optional[CheckpointTuple]:
        thread_id = config["configurable"]["thread_id"]
        checkpoint_id = config["configurable"].get("checkpoint_id")

        # 1. Fetch from DB
        try:
            row = await checkpoint_repository.get_checkpoint(thread_id, checkpoint_id)
        except Exception as e:
            print(f"[checkpointer] get_tuple failed for thread_id={thread_id}: {e}")
            return None
        
        if not row:
            return None

        # 2. Decode the hex string back into bytes
        checkpoint_bytes = decode_supabase_bytea(row["checkpoint_data"])
        metadata_bytes = decode_supabase_bytea(row["metadata"])

        # 3. Deserialize using loads_typed
        checkpoint = self.serde.loads_typed(("json", checkpoint_bytes))
        metadata = self.serde.loads_typed(("json", metadata_bytes))
        
        # 4. Determine Parent Config
        parent_config = None
        if row.get("parent_id"):
            parent_config = {
                "configurable": {
                    "thread_id": thread_id,
                    "checkpoint_id": row["parent_id"],
                }
            }

        return CheckpointTuple(
            config={
                "configurable": {
                    "thread_id": thread_id,
                    "checkpoint_id": row["checkpoint_id"],
                }
            },
            checkpoint=checkpoint,
            metadata=metadata,
            parent_config=parent_config,
        )

    async def aput(
        self,
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: ChannelVersions,
    ) -> RunnableConfig:
        thread_id = config["configurable"]["thread_id"]
        parent_id = config["configurable"].get("checkpoint_id")
        
        # 1. Serialize using dumps_typed (returns type_, bytes)
        type_, checkpoint_bytes = self.serde.dumps_typed(checkpoint)
        _, metadata_bytes = self.serde.dumps_typed(metadata)

        # 2. Convert raw Python bytes to PostgREST hex string format
        checkpoint_hex = f"\\x{checkpoint_bytes.hex()}"
        metadata_hex = f"\\x{metadata_bytes.hex()}"

        # 3. Save to Repo
        try:
            await checkpoint_repository.insert_checkpoint({
                "thread_id": thread_id,
                "checkpoint_id": checkpoint["id"],
                "checkpoint_data": checkpoint_hex,  # Pass the hex string directly
                "metadata": metadata_hex,           # Pass the hex string directly
                "parent_id": parent_id
            })
        except Exception as e:
            print(f"[checkpointer] aput failed for thread_id={thread_id}: {e}")

        return {
            "configurable": {
                "thread_id": thread_id,
                "checkpoint_id": checkpoint["id"],
            }
        }

    async def alist(
        self,
        config: RunnableConfig,
        *,
        filter: Optional[Dict[str, Any]] = None,
        before: Optional[RunnableConfig] = None,
        limit: Optional[int] = None,
    ) -> AsyncIterator[CheckpointTuple]:
        
        thread_id = config["configurable"]["thread_id"]
        before_id = before["configurable"].get("checkpoint_id") if before else None

        try:
            rows = await checkpoint_repository.list_checkpoints(
                thread_id, 
                limit=limit or 10,
                before_checkpoint_id=before_id 
            )
        except Exception as e:
            print(f"[checkpointer] alist failed for thread_id={thread_id}: {e}")
            rows = []

        for row in rows:
            # Decode the hex strings
            checkpoint_bytes = decode_supabase_bytea(row["checkpoint_data"])
            metadata_bytes = decode_supabase_bytea(row["metadata"])
            
            yield CheckpointTuple(
                config={
                    "configurable": {
                        "thread_id": thread_id,
                        "checkpoint_id": row["checkpoint_id"],
                    }
                },
                checkpoint=self.serde.loads_typed(("json", checkpoint_bytes)),
                metadata=self.serde.loads_typed(("json", metadata_bytes)),
                parent_config={
                    "configurable": {
                        "thread_id": thread_id,
                        "checkpoint_id": row["parent_id"],
                    }
                } if row.get("parent_id") else None,
            )

    async def aput_writes(
        self,
        config: RunnableConfig,
        writes: Sequence[Tuple[str, Any]],
        task_id: str,
    ) -> None:
        """
        Required stub for storing pending writes (intermediate states in parallel nodes).
        If you are not using map-reduce/parallelism, this can be a pass.
        If you do use parallelism, you need a separate table 'agent_checkpoint_writes'.
        """
        pass