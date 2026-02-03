# Future Chat Persistence Architecture

Currently, the system uses a mock in-memory store in the API for chat messages. Streamed messages from the worker are emitted via Redis Pub/Sub and persisted back to this mock store by the API.

## Proposed Future Flow

In the production environment, we will transition to using **Supabase** for persistent storage. The responsibility for persistence will shift as follows:

### 1. Message Creation (API)

- User sends a message via POST `/api/conversations/:id/messages`.
- **API** inserts the "user" message into Supabase.
- **API** triggers a BullMQ job for the AI assistant.

### 2. Streamed Updates (Worker)

- **Worker** processes the job and streams tokens via Redis Pub/Sub for real-time UI updates (via API Socket.IO).
- **Worker** maintains the partial response in its state.

### 3. Final Persistence (Worker)

- Once the AI response is complete, the **Worker** inserts the "assistant" message directly into the Supabase `messages` table.
- The **Worker** updates the `jobs` table status to `completed`.

### 4. Cache Synchronization (Front-end)

- The front-end receives the `isComplete: true` flag via Socket.IO.
- The front-end may perform a final refetch or transition the message from "streaming" to "synced" state locally.

## Benefits

- **Source of Truth**: Supabase becomes the single source of truth.
- **Offloading API**: The API doesn't need to listen to all Redis traffic just to save messages; the worker (which already has the data) handles it.
- **Reliability**: Jobs are tracked in Supabase, allowing for easy retries and debugging.
