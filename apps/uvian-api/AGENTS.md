# Uvian API - Agent Guidelines

This document provides specific guidelines for AI coding agents working on the **uvian-api** Fastify backend service.

## 🏗️ Application Overview

- **Technology**: Fastify 4.29, TypeScript, Socket.io
- **Architecture**: Plugin-based with service layer
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Socket.io with Redis adapter
- **Job Queue**: BullMQ with Redis
- **Port**: 3001 (development)

---

## 🚀 Development Commands

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

### **Testing Commands**

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

---

## 🏗️ Architecture Guidelines

### **Plugin-Based Architecture**

The API uses a modular plugin system with automatic registration:

#### **Plugin Directory Structure**

```
src/app/plugins/
├── auth.plugin.ts          # JWT authentication
├── supabase.plugin.ts      # Database integration
├── socket.plugin.ts        # WebSocket server
├── queue.plugin.ts         # Job queue management
├── redis.plugin.ts         # Redis client
└── sensible.plugin.ts      # Fastify configuration
```

#### **Service Layer Structure**

```
src/app/services/
├── chat.service.ts         # Chat business logic
├── profile.service.ts      # Profile management
├── space.service.ts        # Workspace operations
├── queue.service.ts        # Job queue operations
└── supabase.service.ts     # Database utilities
```

### **Critical Architecture Rules**

1. **Plugin Separation**: Each plugin should have a single responsibility
2. **Service Abstraction**: Business logic in services, not route handlers
3. **Type Safety**: Use TypeScript for all interfaces and types
4. **Error Handling**: Consistent error handling across all layers

---

## 💻 Code Style Guidelines

### **Fastify Patterns**

#### **Plugin Definition**

```typescript
// ✅ Correct plugin structure
import { FastifyInstance } from 'fastify';

export async function authPlugin(fastify: FastifyInstance) {
  // Plugin implementation
  fastify.decorate('authenticate', async (request, reply) => {
    // Authentication logic
  });

  // Register plugin
  fastify.register(async function (fastify) {
    // Plugin routes
  });
}

export default authPlugin;
```

#### **Route Handler Pattern**

```typescript
// ✅ Proper route structure
fastify.post('/api/conversations', {
  onRequest: [fastify.authenticate],
  schema: {
    body: CreateConversationSchema,
    response: {
      201: ConversationResponseSchema,
      400: ErrorSchema,
    },
  },
  handler: async (request, reply) => {
    try {
      const conversation = await chatService.createConversation(
        request.user.id,
        request.body
      );
      reply.code(201).send(conversation);
    } catch (error) {
      reply.code(400).send({
        error: error.message,
      });
    }
  },
});
```

### **TypeScript Guidelines**

#### **Interface Definitions**

```typescript
// ✅ API interfaces
interface CreateConversationRequest {
  name: string;
  type: 'direct' | 'group';
  spaceId?: string;
  memberIds: string[];
}

interface ConversationResponse {
  id: string;
  name: string;
  type: 'direct' | 'group';
  createdAt: string;
  updatedAt: string;
}

// ✅ Database types
interface Conversation {
  id: string;
  name: string | null;
  type: string;
  space_id: string | null;
  created_at: string;
  updated_at: string;
}
```

#### **Error Handling**

```typescript
// ✅ Consistent error handling
export class ChatServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ChatServiceError';
  }
}

// ✅ Error responses
fastify.setErrorHandler((error, request, reply) => {
  if (error.validation) {
    reply.code(400).send({
      error: 'Validation failed',
      details: error.validation,
    });
    return;
  }

  if (error.statusCode) {
    reply.code(error.statusCode).send({
      error: error.message,
    });
    return;
  }

  reply.code(500).send({
    error: 'Internal server error',
  });
});
```

---

## 🗄️ Database Integration

### **Supabase Client Usage**

#### **Client Decoration**

```typescript
// ✅ Proper client setup
fastify.decorate(
  'supabase',
  createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  )
);

// Type augmentation
declare module 'fastify' {
  interface FastifyInstance {
    supabase: ReturnType<typeof createClient<Database>>;
    authenticate: FastifyRequestHandler;
  }
}
```

#### **Database Operations**

```typescript
// ✅ Service layer pattern
export class ChatService {
  constructor(private fastify: FastifyInstance) {}

  async createConversation(userId: string, data: CreateConversationRequest) {
    const { data: conversation, error } = await this.fastify.supabase
      .from('conversations')
      .insert({
        name: data.name,
        type: data.type,
        space_id: data.spaceId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new ChatServiceError(
        `Failed to create conversation: ${error.message}`,
        'CONVERSATION_CREATE_FAILED',
        400
      );
    }

    // Add members
    await this.addConversationMembers(conversation.id, [
      userId,
      ...data.memberIds,
    ]);

    return conversation;
  }

  async addConversationMembers(conversationId: string, userIds: string[]) {
    const members = userIds.map((userId) => ({
      conversation_id: conversationId,
      user_id: userId,
      role: 'member',
      joined_at: new Date().toISOString(),
    }));

    const { error } = await this.fastify.supabase
      .from('conversation_members')
      .insert(members);

    if (error) {
      throw new ChatServiceError(
        `Failed to add members: ${error.message}`,
        'MEMBER_ADD_FAILED',
        400
      );
    }
  }
}
```

### **Authentication Patterns**

#### **JWT Middleware**

```typescript
// ✅ Authentication decorator
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
      reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid or missing authentication token',
      });
    }
  }
);

// ✅ Type augmentation for request user
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email?: string;
      role?: string;
    };
  }
}
```

#### **Route Protection**

```typescript
// ✅ Protected route example
fastify.get('/api/profiles/me', {
  onRequest: [fastify.authenticate],
  handler: async (request, reply) => {
    const { data, error } = await fastify.supabase
      .from('profiles')
      .select('*')
      .eq('id', request.user!.id)
      .single();

    if (error) {
      reply.code(404).send({ error: 'Profile not found' });
      return;
    }

    reply.send(data);
  },
});
```

---

## 🔌 Real-time Features

### **Socket.io Integration**

#### **Server Setup**

```typescript
// ✅ Socket.io plugin setup
import { Server as SocketIOServer } from 'socket.io';

export async function socketPlugin(fastify: FastifyInstance) {
  const io = new SocketIOServer(fastify.server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    adapter: createRedisAdapter(redisClient),
  });

  fastify.decorate('io', io);

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const {
        data: { user },
      } = await fastify.supabase.auth.getUser(token);

      if (!user) {
        throw new Error('Authentication failed');
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  // Connection handling
  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);

    socket.on('join_conversation', async (conversationId: string) => {
      // Verify access
      const hasAccess = await verifyConversationAccess(
        socket.userId,
        conversationId
      );
      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      socket.join(`conversation:${conversationId}`);
      socket.to(`conversation:${conversationId}`).emit('user_joined', {
        userId: socket.userId,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('send_message', async (data) => {
      // Process message
      const message = await processMessage(socket.userId, data);

      // Broadcast to room
      io.to(`conversation:${data.conversationId}`).emit('new_message', message);

      // Store in database
      await fastify.supabase.from('messages').insert(message);
    });

    socket.on('disconnect', (reason) => {
      console.log(`User ${socket.userId} disconnected: ${reason}`);
    });
  });
}
```

#### **Event Types**

```typescript
// ✅ Type-safe event definitions
interface ServerToClientEvents {
  new_message: (message: Message) => void;
  message_status_update: (data: { messageId: string; status: string }) => void;
  user_joined: (data: { userId: string; timestamp: string }) => void;
  user_left: (data: { userId: string; timestamp: string }) => void;
  user_typing: (data: { conversationId: string; userId: string }) => void;
  user_stopped_typing: (data: {
    conversationId: string;
    userId: string;
  }) => void;
  error: (data: { message: string }) => void;
}

interface ClientToServerEvents {
  join_conversation: (conversationId: string) => void;
  leave_conversation: (conversationId: string) => void;
  send_message: (data: {
    conversationId: string;
    content: string;
    type?: string;
  }) => void;
  typing_start: (conversationId: string) => void;
  typing_stop: (conversationId: string) => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  userId: string;
  user: any;
}
```

---

## ⚙️ Job Queue Management

### **BullMQ Integration**

#### **Queue Setup**

```typescript
// ✅ Queue configuration
import { Queue, Worker, QueueEvents, Job } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
};

const mainQueue = new Queue('main-queue', { connection });

export async function queuePlugin(fastify: FastifyInstance) {
  fastify.decorate('mainQueue', mainQueue);
  fastify.decorate('addJob', addJob);
}

async function addJob(type: string, data: any, options?: any) {
  const jobId = generateUUID();

  // Store job in database
  await supabase.from('jobs').insert({
    id: jobId,
    type,
    status: 'queued',
    input: data,
    created_at: new Date().toISOString(),
  });

  // Add to queue
  await mainQueue.add(
    type,
    { jobId, ...data },
    {
      jobId,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 10,
      removeOnFail: 50,
      ...options,
    }
  );

  return jobId;
}
```

#### **Job Creation Patterns**

```typescript
// ✅ AI chat job creation
export async function createAIChatJob(
  fastify: FastifyInstance,
  input: {
    conversationId: string;
    message: string;
    userId: string;
    replyToId?: string;
  }
) {
  const jobId = await fastify.addJob('ai-chat', input, {
    priority: 1,
  });

  // Store message in database
  const message = await fastify.supabase
    .from('messages')
    .insert({
      conversation_id: input.conversationId,
      content: input.message,
      sender_id: input.userId,
      type: 'user',
      reply_to_id: input.replyToId,
    })
    .select()
    .single();

  if (message.error) {
    throw new Error(`Failed to store message: ${message.error.message}`);
  }

  // Broadcast to room
  fastify.io
    .to(`conversation:${input.conversationId}`)
    .emit('new_message', message.data);

  return { jobId, message: message.data };
}
```

---

## 🧪 Testing Guidelines

### **Fastify Testing Patterns**

#### **Route Testing**

```typescript
// ✅ Basic route test
import { test, expect } from '@jest/globals';
import Fastify from 'fastify';
import { app } from '../app';

describe('Chat Routes', () => {
  let server: Fastify;

  beforeEach(async () => {
    server = Fastify();
    await server.register(app);
  });

  afterEach(async () => {
    await server.close();
  });

  test('POST /api/conversations creates conversation', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/conversations',
      headers: {
        authorization: 'Bearer test-token',
        'content-type': 'application/json',
      },
      payload: {
        name: 'Test Conversation',
        type: 'group',
        memberIds: ['user1', 'user2'],
      },
    });

    expect(response.statusCode).toBe(201);
    const data = response.json();
    expect(data).toMatchObject({
      name: 'Test Conversation',
      type: 'group',
    });
  });
});
```

#### **Service Testing**

```typescript
// ✅ Service unit test
import { ChatService } from '../chat.service';

describe('ChatService', () => {
  let chatService: ChatService;
  let mockFastify: any;

  beforeEach(() => {
    mockFastify = {
      supabase: {
        from: jest.fn(() => ({
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => ({
                data: { id: 'conv1', name: 'Test' },
                error: null,
              })),
            })),
          })),
        })),
      },
    };
    chatService = new ChatService(mockFastify);
  });

  test('creates conversation successfully', async () => {
    const conversation = await chatService.createConversation('user1', {
      name: 'Test Conversation',
      type: 'group',
      memberIds: ['user2', 'user3'],
    });

    expect(conversation).toMatchObject({
      id: 'conv1',
      name: 'Test Conversation',
      type: 'group',
    });
  });
});
```

### **WebSocket Testing**

```typescript
// ✅ WebSocket event testing
import { io } from 'socket.io-client';

describe('Socket.io Events', () => {
  let clientSocket: any;

  beforeEach((done) => {
    clientSocket = io('http://localhost:3001', {
      auth: {
        token: 'test-token',
      },
    });

    clientSocket.on('connect', done);
  });

  afterEach(() => {
    clientSocket.close();
  });

  test('joins conversation room', (done) => {
    clientSocket.emit('join_conversation', 'conv1');

    clientSocket.on('user_joined', (data) => {
      expect(data).toHaveProperty('userId');
      expect(data).toHaveProperty('timestamp');
      done();
    });
  });

  test('sends message', (done) => {
    clientSocket.emit('send_message', {
      conversationId: 'conv1',
      content: 'Hello World',
    });

    clientSocket.on('new_message', (message) => {
      expect(message.content).toBe('Hello World');
      done();
    });
  });
});
```

---

## 🔧 Configuration Management

### **Environment Variables**

```env
# Server Configuration
PORT=3001
NODE_ENV=development
LOG_LEVEL=info

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your_jwt_secret

# CORS
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

### **Fastify Configuration**

```typescript
// ✅ Fastify server configuration
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
            },
          }
        : undefined,
  },
  trustProxy: true,
  connectionTimeout: 0,
  keepAliveTimeout: 60000,
  maxParamLength: 100,
  caseSensitive: true,
  ignoreTrailingSlash: false,
});
```

---

## 🚨 Common Issues & Solutions

### **Development Issues**

#### **Plugin Loading Errors**

```typescript
// Check plugin registration
console.log('Registered plugins:', fastify.printPlugins());

// Verify plugin dependencies
fastify.addHook('onReady', async () => {
  console.log('All plugins loaded successfully');
});
```

#### **Database Connection Issues**

```typescript
// Test Supabase connection
fastify.addHook('onReady', async () => {
  try {
    const { error } = await fastify.supabase
      .from('profiles')
      .select('count')
      .limit(1);
    if (error) throw error;
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
});
```

#### **WebSocket Connection Issues**

```typescript
// Debug WebSocket events
fastify.io.on('connection_error', (err) => {
  console.log('WebSocket connection error:', err);
});

// Monitor room joins
fastify.io.on('join_room', (room) => {
  console.log(`Socket joined room: ${room}`);
});
```

### **Production Issues**

#### **Memory Leaks**

- Monitor WebSocket connection cleanup
- Check Redis connection pool size
- Review database query result size

#### **Performance Issues**

- Enable Fastify compression
- Use connection pooling for database
- Implement Redis caching for frequent queries
- Monitor BullMQ queue processing time

#### **Scaling Issues**

- Configure Socket.io Redis adapter for multiple instances
- Use Redis cluster for high availability
- Implement API rate limiting
- Enable database read replicas

---

## 📚 Resources

- **Main Application README**: [`../README.md`](../README.md)
- **Root Project README**: [`../../README.md`](../../README.md)
- **Fastify Documentation**: [https://fastify.dev](https://fastify.dev)
- **Socket.io Documentation**: [https://socket.io/docs](https://socket.io/docs)
- **BullMQ Documentation**: [https://docs.bullmq.io](https://docs.bullmq.io)
- **Supabase Documentation**: [https://supabase.com/docs](https://supabase.com/docs)

---

**Remember**: Always use TypeScript types, follow the plugin architecture, and maintain proper error handling throughout the application.
