# Uvian - Real-time Chat Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-202020?logo=fastify&logoColor=white)](https://www.fastify.io/)
[![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Nx](https://img.shields.io/badge/Nx-143055?logo=nx&logoColor=white)](https://nx.dev/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

**Uvian** is a creative collaboration platform with a ingrained AI solutions. It aims to provide a comprehnsive ecosystem of tools that cater to a varied user base of creators, artists, community organisers. 

---

## 🚀 Quick Start

### Prerequisites

As a polygot repository we are using ASDF for managing the different environemnts we use. Please use a modern version of asdf and use the .tool-versions file so that you are using the correct node and python versions.

## Redis

You will also need a running redis instance.

### Step-by-Step Installation

#### 1. Clone Repository

```bash
git clone <repository-url>
cd uvian
```

#### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
cd apps/uvian-worker
poetry install --with dev
cd ../../
```

#### 3. Environment Setup

Each app needs its own env files.

#### 4. Start Development

```bash
# Start all applications
npx nx run-many -t serve -p=uvian-api,uvian-web,uvian-worker

# Or start individual services
npx nx serve uvian-web    # Frontend on http://localhost:3000
npx nx serve uvian-api    # API on http://localhost:8000
npx nx serve uvian-worker # Worker (no web interface)
```

---

### Monorepo Structure

```
📁 apps/                    # 3 applications
  ├── uvian-api/           # Fastify API server (Node.js)
  ├── uvian-web/           # Next.js web application (React)
  └── uvian-worker/        # Python background worker

📁 packages/               # Shared libraries
  └── ui/                  # shadcn/ui component library

📁 .agents/                # AI agent configuration and rules
📁 analysis/               # Analysis tools
📁 reports/                # Build and test reports
```

## 🛠️ Development Commands

### Starting Applications

```bash
# Start all applications
npx nx run-many -t serve -p=uvian-api,uvian-web,uvian-worker

# Or start individual services
npx nx serve uvian-web    # Frontend on http://localhost:3000
npx nx serve uvian-api    # API on http://localhost:8000
npx nx serve uvian-worker # Worker (no web interface)
```


### Building & Testing

```bash
# Build all applications
npx nx run-many -t build -p=uvian-api,uvian-web,uvian-worker

# Build specific application
npx nx build uvian-web
npx nx build uvian-api
npx nx build uvian-worker

# Run tests
npx nx test uvian-web        # All tests for web
npx nx test uvian-api        # All tests for API
npx nx test uvian-worker     # All tests for worker

# Run specific test file
npx nx test uvian-api --testPathPattern=app.spec.ts

# Type checking
npx nx run-many -t typecheck -p=uvian-api,uvian-web,uvian-worker

# Linting
npx nx lint uvian-web        # Lint web app
npx nx lint uvian-api        # Lint API
npx nx lint                  # Lint all projects
```

### Worker-Specific Commands

```bash
# Install Python dependencies
npx nx install uvian-worker

# Run Python tests with Poetry
cd apps/uvian-worker && poetry run pytest

# Run with coverage
poetry run pytest --cov=apps.uvian_worker

# Poetry shell for development
poetry shell
```