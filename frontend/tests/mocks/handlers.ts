/**
 * MSW (Mock Service Worker) API Mocks for DeerFlow
 * 
 * These mocks enable isolated unit testing of frontend components
 * without requiring a running backend server.
 */

import { http, HttpResponse, delay } from 'msw';
import { setupServer } from 'msw/node';

// Mock data
const mockThreads = [
  {
    id: 'thread-1',
    title: 'Test Conversation',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'thread-2',
    title: 'Another Thread',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

const mockMessages = [
  {
    id: 'msg-1',
    thread_id: 'thread-1',
    role: 'user',
    content: 'Hello!',
    created_at: new Date().toISOString(),
  },
  {
    id: 'msg-2',
    thread_id: 'thread-1',
    role: 'assistant',
    content: 'Hi there! How can I help you today?',
    created_at: new Date().toISOString(),
  },
];

// API handlers
export const handlers = [
  // Get all threads
  http.get('/api/threads', async () => {
    await delay(100); // Simulate network latency
    return HttpResponse.json(mockThreads);
  }),

  // Get single thread
  http.get('/api/threads/:threadId', async ({ params }) => {
    await delay(100);
    const { threadId } = params;
    const thread = mockThreads.find(t => t.id === threadId);
    
    if (!thread) {
      return HttpResponse.json(
        { error: 'not_found', message: 'Thread not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(thread);
  }),

  // Create new thread
  http.post('/api/threads', async ({ request }) => {
    await delay(200);
    const body = await request.json();
    
    const newThread = {
      id: `thread-${Date.now()}`,
      title: body?.title || 'New Thread',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    mockThreads.unshift(newThread);
    return HttpResponse.json(newThread, { status: 201 });
  }),

  // Delete thread
  http.delete('/api/threads/:threadId', async ({ params }) => {
    await delay(100);
    const { threadId } = params;
    const index = mockThreads.findIndex(t => t.id === threadId);
    
    if (index === -1) {
      return HttpResponse.json(
        { error: 'not_found', message: 'Thread not found' },
        { status: 404 }
      );
    }
    
    mockThreads.splice(index, 1);
    return HttpResponse.json({ success: true });
  }),

  // Get thread messages
  http.get('/api/threads/:threadId/messages', async ({ params }) => {
    await delay(150);
    const { threadId } = params;
    const messages = mockMessages.filter(m => m.thread_id === threadId);
    
    return HttpResponse.json(messages);
  }),

  // Send message
  http.post('/api/threads/:threadId/messages', async ({ params, request }) => {
    await delay(300);
    const { threadId } = params;
    const body = await request.json();
    
    // Validate thread exists
    const thread = mockThreads.find(t => t.id === threadId);
    if (!thread) {
      return HttpResponse.json(
        { error: 'not_found', message: 'Thread not found' },
        { status: 404 }
      );
    }
    
    // Validate content
    if (!body?.content || typeof body.content !== 'string') {
      return HttpResponse.json(
        { error: 'validation_error', message: 'Content is required' },
        { status: 400 }
      );
    }
    
    const newUserMessage = {
      id: `msg-${Date.now()}-user`,
      thread_id: threadId,
      role: 'user',
      content: body.content,
      created_at: new Date().toISOString(),
    };
    
    mockMessages.push(newUserMessage);
    
    // Simulate assistant response after delay
    setTimeout(() => {
      mockMessages.push({
        id: `msg-${Date.now()}-assistant`,
        thread_id: threadId,
        role: 'assistant',
        content: `This is a simulated response to: "${body.content}"`,
        created_at: new Date().toISOString(),
      });
    }, 1000);
    
    return HttpResponse.json(newUserMessage, { status: 201 });
  }),

  // Health check
  http.get('/health', () => {
    return HttpResponse.json({ status: 'healthy', timestamp: new Date().toISOString() });
  }),

  // Error scenarios
  http.get('/api/error/test', () => {
    return HttpResponse.json(
      { error: 'internal_error', message: 'Simulated server error' },
      { status: 500 }
    );
  }),
];

// Setup MSW server for Node.js tests
export const server = setupServer(...handlers);

// Helper to setup MSW in browser tests
export function setupBrowserMocks() {
  if (typeof window !== 'undefined') {
    const { setupWorker } = require('msw/browser');
    const worker = setupWorker(...handlers);
    return worker.start();
  }
}
