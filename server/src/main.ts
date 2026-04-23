import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import { Server } from 'socket.io';
import * as dotenv from 'dotenv';
import fastifyJwt from '@fastify/jwt';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';

import authRoutes from './routes/auth.js';
import ticketRoutes from './routes/tickets.js';
import inventoryRoutes from './routes/inventory.js';
import directoryRoutes from './routes/directory.js';
import documentRoutes from './routes/documents.js';
import knowledgeRoutes from './routes/knowledge.js';
import chatRoutes from './routes/chat.js';

dotenv.config();

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// 1. SECURITY: Helmet (Sets various HTTP headers)
fastify.register(fastifyHelmet, {
  contentSecurityPolicy: false, // Disable CSP for easier dashboard development, enable in full prod
});

// 2. SECURITY: CORS (Restrict access to the API)
fastify.register(fastifyCors, {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'capacitor://localhost',      // iOS
        'http://localhost',            // Android
        'ms-appx-web://localhost',     // Windows (WebView2)
        'app://localhost'              // Electron
      ] 
    : true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

// 3. SECURITY: Rate Limiting (Prevent Brute-force/DDoS)
fastify.register(fastifyRateLimit, {
  max: 100, // 100 requests per window
  timeWindow: '1 minute',
});

// 4. SECURITY: Register JWT
fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'super-secret-key-change-me',
  sign: {
    expiresIn: '7d', // Token valid for 7 days
  },
});

// Authenticate decorator
fastify.decorate("authenticate", async function(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ message: 'Ошибка авторизации: токен недействителен или отсутствует' });
  }
});

// Extend FastifyInstance type for the decorator
declare module 'fastify' {
  export interface FastifyInstance {
    authenticate: any;
  }
}

// Global hook to broadcast ALL server logs to dashboard
fastify.addHook('onResponse', async (request, reply) => {
  const message = `${request.method} ${request.url} - ${reply.statusCode} (${Math.round(reply.elapsedTime)}ms)`;
  const type = reply.statusCode >= 400 ? 'error' : 'info';
  
  io.emit('log', {
    timestamp: new Date().toISOString(),
    type,
    message,
  });
});

// Global Error Handler (SECURITY: Don't leak internals)
fastify.setErrorHandler((error: any, _request, reply) => {
  const statusCode = error.statusCode || 500;
  
  // Log the full error internally
  fastify.log.error(error);

  // Emit to dashboard
  io.emit('log', {
    timestamp: new Date().toISOString(),
    type: 'error',
    message: `ERROR: ${error.message}`,
  });

  // Send generic message to client in production
  if (process.env.NODE_ENV === 'production') {
    if (statusCode >= 500) {
      return reply.status(500).send({ message: 'Внутренняя ошибка сервера' });
    }
  }

  reply.status(statusCode).send({ 
    message: error.message,
    statusCode
  });
});

// Register Routes
fastify.get('/api', async () => {
  return { 
    message: 'HelpDesk CRM API Server', 
    version: '1.1.1',
    status: 'running' 
  };
});

fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(ticketRoutes, { prefix: '/api/tickets' });
fastify.register(inventoryRoutes, { prefix: '/api/inventory' });
fastify.register(directoryRoutes, { prefix: '/api/directory' });
fastify.register(documentRoutes, { prefix: '/api/documents' });
fastify.register(knowledgeRoutes, { prefix: '/api/knowledge' });

// Health check endpoint
fastify.get('/health', async (_request, _reply) => {
  return { status: 'ok', uptime: process.uptime() };
});

// Basic Dashboard Route (Web UI for logs)
fastify.get('/dashboard', async (_request, reply) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>HelpDesk Admin Dashboard</title>
        <script src="https://cdn.socket.io/4.8.0/socket.io.min.js"></script>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          .log-entry { font-family: 'Fira Code', monospace; }
        </style>
      </head>
      <body class="bg-slate-900 text-slate-100 p-8">
        <div class="max-w-6xl mx-auto">
          <header class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-bold text-blue-400">HelpDesk CRM Server</h1>
            <div id="status" class="px-4 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/50">
              Online
            </div>
          </header>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 class="text-slate-400 text-sm uppercase mb-1">Uptime</h3>
              <p id="uptime" class="text-2xl font-mono">00:00:00</p>
            </div>
            <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 class="text-slate-400 text-sm uppercase mb-1">Active Clients</h3>
              <p id="clients" class="text-2xl font-mono">0</p>
            </div>
            <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 class="text-slate-400 text-sm uppercase mb-1">Memory Usage</h3>
              <p id="memory" class="text-2xl font-mono">0 MB</p>
            </div>
          </div>

          <div class="bg-black rounded-xl p-4 border border-slate-700 shadow-2xl h-[500px] flex flex-col">
            <div class="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
              <span class="text-xs text-slate-500 uppercase font-bold tracking-widest">Live Server Logs</span>
              <button onclick="clearLogs()" class="text-xs text-blue-400 hover:text-blue-300">Clear</button>
            </div>
            <div id="logs" class="overflow-y-auto flex-grow text-sm space-y-1"></div>
          </div>
        </div>

        <script>
          const socket = io();
          const logsContainer = document.getElementById('logs');
          const clientsCount = document.getElementById('clients');
          const uptimeDisplay = document.getElementById('uptime');
          const memoryDisplay = document.getElementById('memory');

          function addLog(log) {
            const el = document.createElement('div');
            el.className = 'log-entry py-1 border-b border-slate-900 last:border-0';
            const color = log.type === 'error' ? 'text-red-400' : (log.type === 'warn' ? 'text-yellow-400' : 'text-blue-400');
            const time = log.timestamp.split('T')[1].split('.')[0];
            el.innerHTML = '<span class="text-slate-500">[' + time + ']</span> <span class="' + color + '">[' + log.type.toUpperCase() + ']</span> ' + log.message;
            logsContainer.appendChild(el);
            logsContainer.scrollTop = logsContainer.scrollHeight;
          }

          function clearLogs() { logsContainer.innerHTML = ''; }

          socket.on('log', addLog);
          socket.on('stats', (stats) => {
            clientsCount.innerText = stats.clients;
            uptimeDisplay.innerText = stats.uptime;
            memoryDisplay.innerText = stats.memory + ' MB';
          });

          // Initial log
          addLog({ timestamp: new Date().toISOString(), type: 'info', message: 'Dashboard connected to live stream' });
        </script>
      </body>
    </html>
  `;
  return reply.type('text/html').send(html);
});

// Initialize Socket.io immediately
const io = new Server(fastify.server, {
  cors: {
    origin: '*',
  },
});

fastify.register(chatRoutes, { prefix: '/api/chat', io });

// Periodic stats broadcast
let clientCount = 0;
io.on('connection', (socket) => {
  clientCount++;
  socket.on('disconnect', () => { clientCount--; });
});

setInterval(() => {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  const uptimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  io.emit('stats', {
    clients: clientCount,
    uptime: uptimeStr,
    memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
  });
}, 1000);

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000');
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server started`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
