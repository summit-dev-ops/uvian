# Uvian API - Fastify Backend Service

[![Fastify](https://img.shields.io/badge/Fastify-202020?logo=fastify&logoColor=white)](https://www.fastify.io/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![BullMQ](https://img.shields.io/badge/BullMQ-FF6C37?logo=bull&logoColor=white)](https://optimalbits.github.io/bull/)

**Uvian API** is the backend service of the Uvian real-time chat platform, built with Fastify and TypeScript. It provides RESTful API endpoints, WebSocket real-time communication, job queue management, and integrates with Supabase for database operations.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Redis server (for job queues and real-time scaling)
- Supabase project setup
- Running `uvian-web` frontend (port 3000)

### Installation & Development

```bash
# From the workspace root
nx serve uvian-api

# Or navigate to app directory
cd apps/uvian-api
npm run dev

# Access the API
open http://localhost:3001
```

### Health Check

```bash
# API health endpoint
curl http://localhost:3001/

# Expected response
{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z","service":"uvian-api"}
```

### Building for Production

```bash
# Build the application
nx build uvian-api

# Start production build
npm start
```

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

### **Application Structure**

```
src/
├── app/
│   ├── app.ts              # Main application with plugin registration
│   ├── clients/            # External service clients
│   ├── plugins/            # Fastify plugins
│   │   ├── auth.plugin.ts  # Authentication middleware
│   │   ├── supabase.plugin.ts # Database integration
│   │   ├── socket.plugin.ts # WebSocket server
│   │   ├── queue.plugin.ts  # Job queue management
│   │   └── redis.plugin.ts  # Redis client
│   ├── routes/             # API route handlers
│   │   ├── root.ts         # Health check and info endpoints
│   │   ├── chat.ts         # Chat and conversation endpoints
│   │   ├── profiles.ts     # User profile endpoints
│   │   ├── spaces.ts       # Workspace management endpoints
│   │   └── jobs.ts         # Job queue endpoints
│   ├── services/           # Business logic services
│   │   ├── chat.service.ts # Chat business logic
│   │   ├── profile.service.ts # Profile management
│   │   ├── space.service.ts # Workspace operations
│   │   └── queue.service.ts # Job queue operations
│   └── types/              # TypeScript type definitions
├── assets/                 # Static assets
└── main.ts                 # Application entry point
```

### **Plugin-Based Architecture**

The API uses a modular plugin architecture with automatic registration:

#### **Core Plugins**

- **AuthPlugin**: JWT authentication middleware
- **SupabasePlugin**: Database client with TypeScript types
- **SocketioPlugin**: WebSocket server with Redis adapter
- **BullMQPlugin**: Job queue management
- **RedisPlugin**: Redis client for caching and pub/sub
- **SensiblePlugin**: Fastify configuration and error handling

#### **Plugin Registration**

```typescript
// Automatic plugin loading via @fastify/autoload
await fastify.register(AutoLoad, {
  dir: path.join(__dirname, 'plugins'),
  options: {
    // Plugin-specific options
  },
});
```

---

## 🛣️ API Endpoints

### **Health & Info**

#### **GET / - Root Endpoint**

```typescript
// Response
{
  "message": "Hello API",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}

// Health check
{
  "status": "ok",
  "service": "uvian-api",
  "uptime": 1234,
  "version": "1.0.0"
}
```

### **Chat Endpoints** (`/chat`)

#### **POST /api/conversations** - Create Conversation

```typescript
// Request
{
  "name": "Team Discussion",
  "type": "group",
  "spaceId": "space_123",
  "memberIds": ["user1", "user2", "user3"]
}

// Response
{
  "id": "conv_456",
  "name": "Team Discussion",
  "type": "group",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### **GET /api/conversations** - List User Conversations

```typescript
// Query Parameters
?page=1&limit=20&spaceId=space_123

// Response
{
  "conversations": [
    {
      "id": "conv_456",
      "name": "Team Discussion",
      "type": "group",
      "lastMessage": {
        "id": "msg_789",
        "content": "Hello team!",
        "senderId": "user1",
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      "unreadCount": 3,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "hasMore": false
  }
}
```

#### **GET /api/conversations/:id** - Get Conversation Details

```typescript
// Response
{
  "id": "conv_456",
  "name": "Team Discussion",
  "type": "group",
  "spaceId": "space_123",
  "members": [
    {
      "id": "user1",
      "username": "john_doe",
      "role": "admin"
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### **POST /api/conversations/:id/messages** - Send Message

```typescript
// Request
{
  "content": "Hello team!",
  "type": "text",
  "replyToId": "msg_123" // Optional: reply to existing message
}

// Response
{
  "id": "msg_789",
  "conversationId": "conv_456",
  "content": "Hello team!",
  "senderId": "user1",
  "type": "text",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### **Profile Endpoints** (`/profiles`)

#### **GET /api/profiles/me** - Get Current User Profile

```typescript
// Response
{
  "id": "user1",
  "username": "john_doe",
  "fullName": "John Doe",
  "avatarUrl": "https://example.com/avatar.jpg",
  "type": "human",
  "settings": {
    "theme": "dark",
    "notifications": true
  },
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### **PUT /api/profiles/me** - Update Current User Profile

```typescript
// Request
{
  "fullName": "John Smith",
  "settings": {
    "theme": "light",
    "notifications": false
  }
}

// Response
{
  "id": "user1",
  "username": "john_doe",
  "fullName": "John Smith",
  "avatarUrl": "https://example.com/avatar.jpg",
  "type": "human",
  "settings": {
    "theme": "light",
    "notifications": false
  },
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### **Spaces Endpoints** (`/spaces`)

#### **GET /api/spaces** - List User Spaces

```typescript
// Response
{
  "spaces": [
    {
      "id": "space_123",
      "name": "Engineering Team",
      "description": "Development and engineering discussions",
      "type": "team",
      "memberCount": 12,
      "role": "admin",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### **POST /api/spaces** - Create New Space

```typescript
// Request
{
  "name": "Marketing Team",
  "description": "Marketing and content discussions",
  "type": "team"
}

// Response
{
  "id": "space_456",
  "name": "Marketing Team",
  "description": "Marketing and content discussions",
  "type": "team",
  "creatorId": "user1",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### **Job Queue Endpoints** (`/jobs`)

#### **POST /api/jobs** - Submit Background Job

```typescript
// Request
{
  "type": "ai-chat",
  "input": {
    "conversationId": "conv_456",
    "message": "What are the project deadlines?",
    "userId": "user1"
  },
  "priority": "normal",
  "delay": 0
}

// Response
{
  "jobId": "job_789",
  "status": "queued",
  "type": "ai-chat",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### **GET /api/jobs/:id** - Get Job Status

```typescript
// Response
{
  "jobId": "job_789",
  "status": "completed",
  "type": "ai-chat",
  "input": {
    "conversationId": "conv_456",
    "message": "What are the project deadlines?"
  },
  "output": {
    "response": "The project deadlines are...",
    "model": "gpt-4"
  },
  "startedAt": "2024-01-01T00:00:01.000Z",
  "completedAt": "2024-01-01T00:00:03.000Z"
}
```

---

## 🔌 Real-time Features

### **WebSocket Server**

#### **Socket.io Integration**

```typescript
// WebSocket event types
interface SocketEvents {
  // Connection events
  connect: () => void;
  disconnect: () => void;

  // Chat events
  join_conversation: (conversationId: string) => void;
  leave_conversation: (conversationId: string) => void;
  send_message: (data: MessageData) => void;
  new_message: (message: Message) => void;
  message_status_update: (data: { messageId: string; status: string }) => void;

  // Presence events
  user_typing: (data: { conversationId: string; userId: string }) => void;
  user_stopped_typing: (data: {
    conversationId: string;
    userId: string;
  }) => void;
  user_online: (userId: string) => void;
  user_offline: (userId: string) => void;
}
```

#### **Authentication for WebSocket**

```typescript
// Socket authentication middleware
fastify.io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      throw new Error('No authentication token provided');
    }

    // Verify JWT token
    const decoded = await verifyJWT(token);
    socket.userId = decoded.userId;
    socket.userRole = decoded.role;

    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});
```

#### **Room Management**

```typescript
// Join conversation room
socket.on('join_conversation', (conversationId: string) => {
  // Verify user has access to conversation
  if (!hasConversationAccess(socket.userId, conversationId)) {
    socket.emit('error', { message: 'Access denied' });
    return;
  }

  socket.join(`conversation:${conversationId}`);
  socket.to(`conversation:${conversationId}`).emit('user_joined', {
    userId: socket.userId,
    timestamp: new Date().toISOString(),
  });
});

// Leave conversation room
socket.on('leave_conversation', (conversationId: string) => {
  socket.leave(`conversation:${conversationId}`);
  socket.to(`conversation:${conversationId}`).emit('user_left', {
    userId: socket.userId,
    timestamp: new Date().toISOString(),
  });
});
```

### **Redis Pub/Sub Integration**

#### **Publishing Events**

```typescript
// Publish message to Redis for worker communication
await redis.publish(
  'conversation:messages',
  JSON.stringify({
    conversationId: 'conv_456',
    messageId: 'msg_789',
    type: 'message_created',
    data: message,
  })
);

// Publish real-time updates
await redis.publish(
  `user:${userId}:notifications`,
  JSON.stringify({
    type: 'notification',
    title: 'New Message',
    body: 'You have a new message',
  })
);
```

#### **Subscribing to Events**

```typescript
// Subscribe to worker events
redis.subscribe('worker:job-completed', (channel, message) => {
  const { jobId, conversationId, result } = JSON.parse(message);

  // Broadcast to conversation room
  fastify.io.to(`conversation:${conversationId}`).emit('ai_response', {
    messageId: result.messageId,
    content: result.content,
    timestamp: result.createdAt,
  });
});

// Subscribe to user notifications
redis.subscribe(`user:${userId}:notifications`, (channel, message) => {
  const notification = JSON.parse(message);
  fastify.io.emit('notification', notification);
});
```

---

## ⚙️ Job Queue Management

### **BullMQ Integration**

#### **Queue Configuration**

```typescript
// Queue setup with Redis
const queues = {
  main: new Queue('main-queue', {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
    },
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
  }),
};

// Job types and processors
const jobTypes = {
  'ai-chat': processAIChatJob,
  'message-notification': processNotificationJob,
  'user-analytics': processAnalyticsJob,
};
```

#### **Job Creation**

```typescript
// Create AI chat job
export async function createAIChatJob(input: {
  conversationId: string;
  message: string;
  userId: string;
}) {
  const jobId = generateUUID();

  // Store job in database first
  await supabase.from('jobs').insert({
    id: jobId,
    type: 'ai-chat',
    status: 'queued',
    input,
    createdAt: new Date().toISOString(),
  });

  // Add to queue
  await queues.main.add(
    'ai-chat',
    { jobId, input },
    {
      priority: 1,
      delay: 0,
      attempts: 3,
    }
  );

  return jobId;
}
```

#### **Job Processing Flow**

```typescript
// API creates job and stores in database
1. User sends message → API validates → Stores message in Supabase
2. API creates BullMQ job → Stores job record in Supabase jobs table
3. Worker fetches job from queue → Reads full job details from Supabase
4. Worker processes job (calls AI) → Updates job status and results
5. Worker publishes result via Redis → API broadcasts to WebSocket clients
```

---

## 🗄️ Database Integration

### **Supabase Client Configuration**

#### **Client Setup**

```typescript
// supabase.plugin.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
);

fastify.decorate('supabase', supabase);

// TypeScript database types
interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: NewProfile;
        Update: Partial<Profile>;
      };
      conversations: {
        Row: Conversation;
        Insert: NewConversation;
        Update: Partial<Conversation>;
      };
      messages: {
        Row: Message;
        Insert: NewMessage;
        Update: Partial<Message>;
      };
      spaces: {
        Row: Space;
        Insert: NewSpace;
        Update: Partial<Space>;
      };
      jobs: {
        Row: Job;
        Insert: NewJob;
        Update: Partial<Job>;
      };
    };
  };
}
```

#### **Database Operations**

```typescript
// Chat service example
export class ChatService {
  async createConversation(data: NewConversation) {
    const { data: conversation, error } = await fastify.supabase
      .from('conversations')
      .insert(data)
      .select()
      .single();

    if (error)
      throw new Error(`Failed to create conversation: ${error.message}`);
    return conversation;
  }

  async getUserConversations(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { data, error } = await fastify.supabase
      .from('conversation_members')
      .select(
        `
        *,
        conversations (*),
        profiles:profiles!conversation_members_user_id_fkey (*)
      `
      )
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error)
      throw new Error(`Failed to fetch conversations: ${error.message}`);
    return data;
  }

  async addMessage(data: NewMessage) {
    const { data: message, error } = await fastify.supabase
      .from('messages')
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(`Failed to add message: ${error.message}`);
    return message;
  }
}
```

### **Authentication Integration**

#### **JWT Middleware**

```typescript
// auth.plugin.ts
export async function authPlugin(fastify: FastifyInstance) {
  // JWT authentication middleware
  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const token = request.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          throw new Error('No token provided');
        }

        const {
          data: { user },
          error,
        } = await fastify.supabase.auth.getUser(token);
        if (error || !user) {
          throw new Error('Invalid token');
        }

        request.user = user;
      } catch (error) {
        reply.code(401).send({ error: 'Unauthorized' });
      }
    }
  );

  // Optional authentication (for some public endpoints)
  fastify.decorate('optionalAuth', async (request: FastifyRequest) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      if (token) {
        const {
          data: { user },
        } = await fastify.supabase.auth.getUser(token);
        request.user = user;
      }
    } catch (error) {
      // Silently fail for optional auth
    }
  });
}
```

#### **Route Protection**

```typescript
// Protected route example
fastify.get('/api/profiles/me', {
  onRequest: [fastify.authenticate],
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user?.id;
    const { data, error } = await fastify.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      reply.code(404).send({ error: 'Profile not found' });
      return;
    }

    reply.send(data);
  },
});

// Optional auth example
fastify.get('/api/spaces/public', {
  onRequest: [fastify.optionalAuth],
  handler: async (request: FastifyRequest) => {
    // Handle both authenticated and anonymous requests
    const userId = request.user?.id;
    // ... implementation
  },
});
```

---

## 🛠️ Development Commands

### **Core Commands**

```bash
# Start development server
nx serve uvian-api

# Build for production
nx build uvian-api

# Start production server
npm start

# Run tests
nx test uvian-api

# Type checking
nx typecheck uvian-api

# Linting
nx lint uvian-api
```

### **Testing**

```bash
# Run all tests
nx test uvian-api

# Run specific test file
nx test uvian-api --testPathPattern=app.spec.ts

# Run with coverage
nx test uvian-api --coverage

# Run in watch mode
nx test uvian-api --watch
```

### **API Testing with Fastify Injection**

```bash
# Test specific endpoint
curl -X GET http://localhost:3001/

# Test with authentication
curl -X GET http://localhost:3001/api/profiles/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test job submission
curl -X POST http://localhost:3001/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "type": "ai-chat",
    "input": {
      "conversationId": "conv_123",
      "message": "Hello AI!"
    }
  }'
```

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

## 🚀 Deployment

### **Build Process**

```bash
# Production build
nx build uvian-api

# Output
dist/apps/uvian-api/
├── src/
│   ├── main.js              # Main entry point
│   └── assets/              # Static assets
└── package.json             # Dependencies
```

### **Deployment Platforms**

#### **Railway**

```bash
# Deploy to Railway
railway login
railway link
railway up

# Environment variables in Railway dashboard
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=
```

#### **Render**

```bash
# Deploy to Render
render deploy

# Environment variables in Render dashboard
PORT=10000
SUPABASE_URL=
REDIS_HOST=
REDIS_PASSWORD=
```

#### **Docker Deployment**

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist/apps/uvian-api ./

EXPOSE 3001
CMD ["node", "src/main.js"]
```

### **Production Configuration**

#### **Performance Optimizations**

- **Connection Pooling**: Supabase connection pooling
- **Redis Clustering**: Redis cluster for high availability
- **Caching**: Redis caching for frequently accessed data
- **Rate Limiting**: API rate limiting to prevent abuse

#### **Monitoring**

- **Health Checks**: `/health` endpoint for monitoring
- **Metrics**: Custom metrics for request timing and error rates
- **Logging**: Structured logging with correlation IDs
- **Error Tracking**: Error reporting and alerting

---

## 🧪 Testing Strategy

### **Test Framework**

- **Jest**: Unit and integration testing
- **Fastify Inject**: HTTP testing without network calls
- **TypeScript**: Full type safety in tests
- **SWC**: Fast test compilation

### **Test Examples**

#### **Route Testing**

```typescript
// app.spec.ts
import { test, expect } from '@jest/globals';
import Fastify from 'fastify';
import { app } from './app';

describe('uvian-api', () => {
  let server: Fastify;

  beforeEach(() => {
    server = Fastify();
    server.register(app);
  });

  afterEach(async () => {
    await server.close();
  });

  test('GET / should return message', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      message: 'Hello API',
    });
  });
});
```

#### **Service Testing**

```typescript
// chat.service.spec.ts
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let chatService: ChatService;

  beforeEach(() => {
    chatService = new ChatService(fastifyInstance);
  });

  test('should create conversation', async () => {
    const conversationData = {
      name: 'Test Conversation',
      type: 'group',
      spaceId: 'space_123',
      memberIds: ['user1', 'user2'],
    };

    const conversation = await chatService.createConversation(conversationData);

    expect(conversation).toMatchObject({
      name: 'Test Conversation',
      type: 'group',
      spaceId: 'space_123',
    });
  });
});
```

---

## 🔍 Troubleshooting

### **Common Issues**

#### **Database Connection Issues**

```typescript
// Check Supabase connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) throw error;
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
};
```

#### **Redis Connection Issues**

```typescript
// Check Redis connection
const testRedisConnection = async () => {
  try {
    await redis.ping();
    console.log('Redis connection successful');
  } catch (error) {
    console.error('Redis connection failed:', error);
  }
};
```

#### **WebSocket Issues**

```typescript
// Debug WebSocket connections
fastify.io.on('connection', (socket) => {
  console.log('Client connected:', socket.id, 'User:', socket.userId);

  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', socket.id, 'Reason:', reason);
  });
});
```

### **Performance Issues**

#### **High CPU Usage**

- Check for infinite loops in routes
- Monitor Redis connection pool
- Review BullMQ job processing time

#### **Memory Leaks**

- Monitor WebSocket connection cleanup
- Check database query results size
- Review Redis memory usage

#### **Slow API Responses**

- Check database query performance
- Monitor Redis latency
- Review BullMQ queue length

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
