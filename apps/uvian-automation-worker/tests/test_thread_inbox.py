import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from repositories.thread_inbox import ThreadInboxRepository


@pytest.mark.asyncio
async def test_fetch_pending_messages():
    repo = ThreadInboxRepository()

    mock_result = MagicMock()
    mock_result.data = [
        {"id": "msg-1", "event_type": "message.created", "payload": {"content": "Hello"}},
        {"id": "msg-2", "event_type": "message.created", "payload": {"content": "World"}},
    ]

    mock_chain = MagicMock()
    mock_chain.order.return_value.execute.return_value = mock_result
    mock_chain.eq.return_value = mock_chain
    mock_chain.from_.return_value.select.return_value = mock_chain
    mock_chain.schema.return_value.from_ = mock_chain.from_

    with patch.object(repo, 'client', mock_chain):
        messages = await repo.fetch_pending_messages("thread-123")

        assert len(messages) == 2
        assert messages[0]["id"] == "msg-1"


@pytest.mark.asyncio
async def test_fetch_pending_messages_empty():
    repo = ThreadInboxRepository()

    mock_result = MagicMock()
    mock_result.data = []

    mock_chain = MagicMock()
    mock_chain.order.return_value.execute.return_value = mock_result
    mock_chain.eq.return_value = mock_chain
    mock_chain.from_.return_value.select.return_value = mock_chain
    mock_chain.schema.return_value.from_ = mock_chain.from_

    with patch.object(repo, 'client', mock_chain):
        messages = await repo.fetch_pending_messages("thread-123")

        assert messages == []


@pytest.mark.asyncio
async def test_mark_processed():
    repo = ThreadInboxRepository()

    mock_chain = MagicMock()
    mock_chain.execute.return_value = MagicMock()
    mock_chain.in_.return_value = mock_chain
    mock_chain.from_.return_value.update.return_value = mock_chain
    mock_chain.schema.return_value.from_ = mock_chain.from_

    with patch.object(repo, 'client', mock_chain):
        result = await repo.mark_processed(["msg-1", "msg-2"])

        assert result is True


@pytest.mark.asyncio
async def test_mark_processed_empty_ids():
    repo = ThreadInboxRepository()

    result = await repo.mark_processed([])

    assert result is True
