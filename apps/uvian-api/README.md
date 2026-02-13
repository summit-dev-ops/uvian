# Uvian API - Fastify Backend Service

[![Fastify](https://img.shields.io/badge/Fastify-202020?logo=fastify&logoColor=white)](https://www.fastify.io/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![BullMQ](https://img.shields.io/badge/BullMQ-FF6C37?logo=bull&logoColor=white)](https://optimalbits.github.io/bull/)

**Uvian API** is the backend service of the platform, built with Fastify and TypeScript. It provides RESTful API endpoints, WebSocket real-time communication, job queue management, and integrates with Supabase for database operations.

---

## 🏗️ Architecture Overview

### **Technology Stack**

| Technology     | Version | Purpose                                      |
| -------------- | ------- | -------------------------------------------- |
| **Fastify**    | 4.29+   | High-performance web framework               |
| **TypeScript** | 5.9+    | Type safety and developer experience         |
| **Socket.io**  | Latest  | WebSocket server for real-time communication |
| **BullMQ**     | 5.67+   | Redis-based job queue system                 |
| **Redis**      | 6+      | Caching, pub/sub, and job queue backend      |
| **Supabase**   | Latest  | PostgreSQL database and authentication       |
| **ESBuild**    | 0.19+   | Fast JavaScript bundler                      |
| **SWC**        | 1.5+    | Rust-based compiler for TypeScript           |

### **Plugin-Based Architecture**

The API uses a modular plugin architecture with automatic registration:

---

## 🔧 Configuration

### **Environment Variables**

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Authentication
JWT_SECRET=your_jwt_secret

# Job Queue
REDIS_URL=redis://localhost:6379
```

### **Configuration Files**

| File                | Purpose                                     |
| ------------------- | ------------------------------------------- |
| `package.json`      | Nx project configuration with build targets |
| `tsconfig.json`     | TypeScript compilation configuration        |
| `eslint.config.mjs` | ESLint rules for code quality               |
| `jest.config.ts`    | Jest testing configuration                  |

### **Build Configuration**

```json
// package.json build target
{
  "targets": {
    "build": {
      "executor": "@nx/esbuild:esbuild",
      "options": {
        "platform": "node",
        "outputPath": "dist/apps/uvian-api",
        "bundle": true,
        "main": "dist/apps/uvian-api/src/main.js",
        "tsConfig": "apps/uvian-api/tsconfig.app.json",
        "assets": ["apps/uvian-api/src/assets"]
      }
    }
  }
}
```
---

## 📚 Additional Resources

- **Main Project README**: [`../../README.md`](../../README.md)
- **Architecture Guidelines**: [`.agents/rules/architecture.md`](../../.agents/rules/architecture.md)
- **Agent Guidelines**: [`../AGENTS.md`](../AGENTS.md)
- **Fastify Documentation**: [https://fastify.dev](https://fastify.dev)
- **Socket.io Documentation**: [https://socket.io/docs](https://socket.io/docs)
- **BullMQ Documentation**: [https://docs.bullmq.io](https://docs.bullmq.io)
- **Supabase Documentation**: [https://supabase.com/docs](https://supabase.com/docs)

---

**Built with ❤️ using Fastify, TypeScript, and modern backend technologies.**
