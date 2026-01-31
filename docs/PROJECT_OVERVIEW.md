# Project Overview

**Repository:** `c:/Users/vbenc/Summit_Projects/uvian`

This repository is an **Nx monorepo** that hosts three applications and a shared UI library:

| Application | Language / Framework | Description |
|-------------|----------------------|-------------|
| `apps/uvian-api` | TypeScript / Fastify | HTTP API server. Registers Fastify plugins and routes. Currently provides a simple health‑check at `/`. Designed to enqueue background jobs into a BullMQ queue. |
| `apps/uvian-web` | TypeScript / Next.js | Front‑end UI. Renders a welcome page using components from the shared UI library. Intended to interact with the API and display streamed LLM responses. |
| `apps/uvian-worker` | Python / asyncio | Background worker that consumes jobs from the BullMQ queue, calls RunPod LLM endpoints, and streams token results via Redis Pub/Sub. |
| `packages/ui` | TypeScript / React | Re‑usable UI component library (e.g., `Button`). Exported for consumption by the web app. |

## Core Components

### API (`apps/uvian-api`)
- **Entry point:** `src/main.ts` creates a Fastify server, registers the `app` plugin, and starts listening on `HOST:PORT` (default `localhost:3000`).
- **Application plugin:** `src/app/app.ts` auto‑loads all plugins and routes from `src/app/plugins` and `src/app/routes`.
- **Root route:** `src/app/routes/root.ts` returns `{ "message": "Hello API" }`. Additional routes can be added under `src/app/routes/*`.

### Web UI (`apps/uvian-web`)
- **Root page:** `src/app/page.tsx` displays a welcome screen with a button from the UI library.
- **Layout:** `src/app/layout.tsx` provides the HTML skeleton for all pages.
- **Styling:** Tailwind CSS is configured (`tailwind.config.js`) and global styles are imported via `global.css`.

### Worker (`apps/uvian-worker`)
#### Job Processor (`worker.py`)
- **BullMQ worker:** Instantiated with concurrency = 50, listening on the `"main-queue"` Redis queue.
- **Job handler (`process_job`):** Determines job type (`chat`, `embedding`, or default `completion`), calls the appropriate async generator from `runpod_client.py`, streams each token to Redis Pub/Sub channel `"conversation:hi:messages"`, and publishes a final "finished" message.
- **Redis connection:** Created in `main()` using environment variables `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`.

#### RunPod Client (`runpod_client.py`)
- **Configuration:** Reads `RUNPOD_API_KEY` and `RUNPOD_ENDPOINT_ID` from the environment.
- **System prompt:** A predefined prompt (giantess‑fetish role‑play) is automatically prepended to every chat request.
- **Streaming logic:** Uses a background thread to run the synchronous RunPod stream, pushes chunks onto an `asyncio.Queue`, and yields tokens via an async generator.
- **Generators:**
  - `chat_completion` – builds a messages payload, forces `stream: true`, yields tokens.
  - `text_completion` – similar for plain prompts.
  - `embedding` – runs a non‑streaming request and yields the embedding result.

### Shared UI Library (`packages/ui`)
- Contains a simple `Button` component (`src/lib/button.tsx`) and utility helpers (`src/lib/utils.ts`).
- Exported via `src/index.ts` for consumption by the web app.

## Data Flow Diagram

```mermaid
flowchart TD
    subgraph API
        A1[Fastify Server] --> A2[Routes]
        A2 -->|POST /jobs| Q[BullMQ Queue (Redis)]
    end

    subgraph Worker
        Q -->|BullMQ Worker| W1[process_job]
        W1 -->|calls| RC[RunPod Client]
        RC -->|LLM tokens| W1
        W1 -->|publish tokens| R[Redis Pub/Sub]
    end

    subgraph Frontend
        B[Next.js UI] -->|WebSocket / SSE| R
        R -->|tokens| UI[Display streaming response]
    end

    style API fill:#f9f,stroke:#333,stroke-width:2px
    style Worker fill:#bbf,stroke:#333,stroke-width:2px
    style Frontend fill:#bfb,stroke:#333,stroke-width:2px
```

1. **Client** (browser) interacts with the Next.js UI.
2. UI sends a request (e.g., via `fetch`) to the **API** to enqueue a job.
3. The API pushes a job onto the **BullMQ** queue stored in Redis.
4. The **Python worker** (concurrency = 50) picks up jobs, calls **RunPod** to generate LLM output, and streams each token back to Redis.
5. The UI subscribes to the Redis channel (`conversation:hi:messages`) and renders the tokens in real time.

## Key Technologies

| Category | Tools |
|----------|-------|
| Monorepo / Build | Nx, `nx.json`, `project.json` |
| Backend | Fastify (Node / TS), BullMQ, Redis (`redis.asyncio`) |
| Worker | Python 3.11, `asyncio`, RunPod SDK |
| Frontend | Next.js (React), Tailwind CSS, shared UI library (`packages/ui`) |
| LLM Provider | RunPod (vLLM/TGI compatible) |
| Testing | Jest (TS & Python), `jest.config.*` |
| Linting / Formatting | ESLint, Prettier |

## Current Functionality

- **API:** Minimal health endpoint (`GET /`). Ready for additional routes such as `POST /jobs` to enqueue background work.
- **Web:** Placeholder welcome page with a button; scaffold for building a UI that can interact with the API and display streamed LLM responses.
- **Worker:** Continuously runs, waiting for jobs. When a job arrives, it calls RunPod to generate either chat completions, plain text completions, or embeddings, then streams the result token‑by‑token to a Redis channel. The system prompt enforces a specific role‑play scenario, which influences all generated content.

## Suggested Next Steps

1. **Add job‑submission endpoint** to the API (e.g., `POST /jobs`) that validates input and pushes a job onto the BullMQ queue.
2. **Implement a WebSocket or Server‑Sent Events client** in the Next.js app to listen to the Redis Pub/Sub channel and render streaming tokens.
3. **Expand the UI library** with additional components (forms, loading spinners, etc.) to improve the front‑end experience.
4. **Write tests** for API routes, worker logic, and UI components.
5. **Document architecture** in the Memory Bank (`.kilocode/rules/memory-bank/architecture.md`) for future reference.

---

*This document provides a high‑level overview of the project structure, core components, data flow, and technologies used. For deeper technical details, refer to the source files in each application directory.*