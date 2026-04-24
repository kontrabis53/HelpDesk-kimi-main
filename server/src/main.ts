import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import { Server } from 'socket.io';
import * as dotenv from 'dotenv';
import fastifyJwt from '@fastify/jwt';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import os from 'os';

import prisma from './lib/prisma.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
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

// Initialize Socket.io immediately
const io = new Server(fastify.server, {
  cors: {
    origin: '*',
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
  let user = 'Anonymous';
  try {
    const token = request.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded: any = fastify.jwt.decode(token);
      if (decoded && decoded.username) {
        user = decoded.username;
      }
    }
  } catch (err) {
    // Ignore JWT decode errors for logs
  }

  // Filter sensitive data from body for logging
  let bodyInfo = '';
  let filteredBody = null;
  if (request.body && typeof request.body === 'object') {
    filteredBody = { ...(request.body as any) };
    if (filteredBody.password) filteredBody.password = '********';
    bodyInfo = ` | BODY: ${JSON.stringify(filteredBody)}`;
  }

  const queryInfo = Object.keys(request.query as any).length > 0 
    ? ` | QUERY: ${JSON.stringify(request.query)}` 
    : '';

  const message = `${request.method} ${request.url}${queryInfo}${bodyInfo} - ${reply.statusCode} (${Math.round(reply.elapsedTime)}ms)`;
  const type = reply.statusCode >= 400 ? 'error' : 'info';
  
  const logData = {
    timestamp: new Date().toISOString(),
    type,
    user,
    message,
  };

  io.emit('log', logData);

  // Save to DB for persistence
  try {
    await prisma.systemLog.create({
      data: {
        type,
        message,
        user,
        details: filteredBody || {},
      }
    });
  } catch (err) {
    fastify.log.error('Failed to save log to DB:', err);
  }
});

// Global Error Handler (SECURITY: Don't leak internals)
fastify.setErrorHandler(async (error: any, _request, reply) => {
  const statusCode = error.statusCode || 500;
  
  // Log the full error internally
  fastify.log.error(error);

  const logData = {
    timestamp: new Date().toISOString(),
    type: 'error',
    message: `ERROR: ${error.message}`,
    user: 'System'
  };

  // Emit to dashboard
  io.emit('log', logData);

  // Save error to DB
  try {
    await prisma.systemLog.create({
      data: {
        type: 'error',
        message: `ERROR: ${error.message}`,
        user: 'System',
        details: { stack: error.stack, statusCode }
      }
    });
  } catch (err) {
    fastify.log.error('Failed to save error log to DB:', err);
  }

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
fastify.register(userRoutes, { prefix: '/api/users' });
fastify.register(ticketRoutes, { prefix: '/api/tickets' });
fastify.register(inventoryRoutes, { prefix: '/api/inventory' });
fastify.register(directoryRoutes, { prefix: '/api/directory' });
fastify.register(documentRoutes, { prefix: '/api/documents' });
fastify.register(knowledgeRoutes, { prefix: '/api/knowledge' });

// Health check endpoint
fastify.get('/health', async (_request, _reply) => {
  return { status: 'ok', uptime: process.uptime() };
});

// API for logs (Dashboard history)
fastify.get('/api/system-logs', {
  onRequest: [fastify.authenticate]
}, async (request, reply) => {
  const user = request.user as any;
  if (user.role !== 'admin') {
    return reply.status(403).send({ message: 'Доступ запрещен' });
  }

  const { type, user: filterUser, startDate, endDate } = request.query as any;

  const where: any = {};
  if (type) where.type = type;
  if (filterUser) where.user = { contains: filterUser, mode: 'insensitive' };
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = new Date(startDate);
    if (endDate) where.timestamp.lte = new Date(endDate);
  }

  const logs = await prisma.systemLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: 500
  });

  return logs;
});

// Basic Dashboard Route (Web UI for logs)
fastify.get('/dashboard', async (_request, reply) => {
  const html = `
    <!DOCTYPE html>
    <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HelpDesk Admin Dashboard</title>
        <script src="https://cdn.socket.io/4.8.0/socket.io.min.js"></script>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&display=swap');
          .log-entry { font-family: 'Fira Code', monospace; }
          ::-webkit-scrollbar { width: 8px; }
          ::-webkit-scrollbar-track { background: #1e293b; }
          ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: #475569; }
        </style>
      </head>
      <body class="bg-slate-950 text-slate-100 p-4 md:p-8 min-h-screen">
        <div class="max-w-7xl mx-auto">
          <header class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 tracking-tight">
                HelpDesk CRM
              </h1>
              <p class="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1">Admin Control Center</p>
            </div>
            <div class="flex items-center gap-4">
              <div id="status" class="flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/30 text-sm font-bold">
                <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                SERVER ONLINE
              </div>
              <div class="text-slate-500 text-xs font-mono" id="node-version"></div>
            </div>
          </header>

          <!-- Real-time Stats Grid -->
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <div class="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg">
              <h3 class="text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-wider">Uptime</h3>
              <p id="uptime" class="text-xl font-mono text-blue-400">00:00:00</p>
            </div>
            <div class="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg">
              <h3 class="text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-wider">Active Clients</h3>
              <p id="clients" class="text-xl font-mono text-indigo-400">0</p>
            </div>
            <div class="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg">
              <h3 class="text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-wider">Memory</h3>
              <p id="memory" class="text-xl font-mono text-purple-400">0 MB</p>
            </div>
            <div class="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg">
              <h3 class="text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-wider">CPU Load</h3>
              <p id="cpu" class="text-xl font-mono text-pink-400">0%</p>
            </div>
            <div class="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg">
              <h3 class="text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-wider">OS</h3>
              <p id="os-info" class="text-sm font-medium text-slate-300 mt-1 truncate">-</p>
            </div>
            <div class="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg">
              <h3 class="text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-wider">Database</h3>
              <p id="db-status" class="text-xs font-mono text-emerald-400 truncate">Connected</p>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div class="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/50 flex flex-col items-center justify-center text-center">
                <span class="text-3xl mb-2">&#127915;</span>
                <p id="stat-tickets" class="text-3xl font-black text-white">0</p>
                <p class="text-slate-500 text-xs uppercase font-bold">Total Tickets</p>
              </div>
              <div class="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/50 flex flex-col items-center justify-center text-center">
                <span class="text-3xl mb-2">&#128101;</span>
                <p id="stat-users" class="text-3xl font-black text-white">0</p>
                <p class="text-slate-500 text-xs uppercase font-bold">Users</p>
              </div>
              <div class="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/50 flex flex-col items-center justify-center text-center">
                <span class="text-3xl mb-2">&#128230;</span>
                <p id="stat-inventory" class="text-3xl font-black text-white">0</p>
                <p class="text-slate-500 text-xs uppercase font-bold">Inventory</p>
              </div>
              <div class="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/50 flex flex-col items-center justify-center text-center">
                <span class="text-3xl mb-2">&#128196;</span>
                <p id="stat-docs" class="text-3xl font-black text-white">0</p>
                <p class="text-slate-500 text-xs uppercase font-bold">Documents</p>
              </div>
            </div>
            
            <div class="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg h-full">
              <h3 class="text-slate-400 text-xs uppercase font-bold mb-4 tracking-widest">Ticket Distribution</h3>
              <canvas id="ticketChart" class="max-h-[150px]"></canvas>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Logs Panel -->
            <div class="lg:col-span-2 bg-black rounded-3xl p-6 border border-slate-800 shadow-2xl h-[650px] flex flex-col relative overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none"></div>
              
              <!-- Logs Header & Filters -->
              <div class="mb-4 pb-4 border-b border-slate-800 relative z-10 space-y-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <span class="text-xs text-slate-400 uppercase font-black tracking-[0.2em]">Live Stream Console</span>
                  </div>
                  <div class="flex gap-2">
                     <button onclick="clearLogsUI()" class="px-3 py-1 text-[10px] font-bold text-slate-400 hover:text-white border border-slate-700 rounded-lg transition-colors">CLEAR UI</button>
                     <button onclick="loadHistory()" class="px-3 py-1 text-[10px] font-bold text-blue-400 hover:text-blue-300 border border-blue-900/50 rounded-lg transition-colors bg-blue-500/5">LOAD 24H HISTORY</button>
                  </div>
                </div>

                <!-- Filters -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <select id="filter-type" onchange="applyFilters()" class="bg-slate-900 border border-slate-800 text-[10px] rounded px-2 py-1 text-slate-300 outline-none focus:border-blue-500">
                    <option value="">All Types</option>
                    <option value="info">Info</option>
                    <option value="error">Error</option>
                    <option value="warn">Warning</option>
                    <option value="request">Request</option>
                  </select>
                  <input id="filter-user" type="text" oninput="applyFilters()" placeholder="User..." class="bg-slate-900 border border-slate-800 text-[10px] rounded px-2 py-1 text-slate-300 outline-none focus:border-blue-500">
                  <input id="filter-search" type="text" oninput="applyFilters()" placeholder="Search message..." class="bg-slate-900 border border-slate-800 text-[10px] rounded px-2 py-1 text-slate-300 outline-none focus:border-blue-500">
                  <div class="flex items-center gap-1">
                    <span id="log-count" class="text-[10px] text-slate-500 font-mono ml-auto">0 logs</span>
                  </div>
                </div>
              </div>

              <div id="logs" class="overflow-y-auto flex-grow text-xs space-y-1 relative z-10 scroll-smooth"></div>
            </div>

            <!-- Right Sidebar Panel -->
            <div class="flex flex-col gap-6">
              <!-- Registration Requests -->
              <div class="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-lg h-[250px] flex flex-col">
                 <h3 class="text-slate-400 text-xs uppercase font-bold mb-4 tracking-widest flex justify-between">
                   <span>Pending Requests</span>
                   <span id="request-count" class="text-blue-500">0</span>
                 </h3>
                 <div id="requests" class="space-y-3 overflow-y-auto pr-2">
                    <p class="text-slate-600 text-sm italic text-center py-4">No pending requests</p>
                 </div>
              </div>

              <!-- Active Users/Sessions -->
              <div class="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-lg h-[225px] flex flex-col">
                 <h3 class="text-slate-400 text-xs uppercase font-bold mb-4 tracking-widest">Active Sessions</h3>
                 <div id="active-users" class="space-y-2 overflow-y-auto pr-2">
                    <p class="text-slate-600 text-sm italic text-center py-4">Waiting for activity...</p>
                 </div>
              </div>
            </div>
          </div>
        </div>

        <script>
          const socket = io();
          const logsContainer = document.getElementById('logs');
          const clientsCount = document.getElementById('clients');
          const uptimeDisplay = document.getElementById('uptime');
          const memoryDisplay = document.getElementById('memory');
          const cpuDisplay = document.getElementById('cpu');
          const osDisplay = document.getElementById('os-info');
          const nodeDisplay = document.getElementById('node-version');
          const requestsContainer = document.getElementById('requests');
          const requestCount = document.getElementById('request-count');
          const activeUsersContainer = document.getElementById('active-users');

          // Business stats
          const ticketsStat = document.getElementById('stat-tickets');
          const usersStat = document.getElementById('stat-users');
          const inventoryStat = document.getElementById('stat-inventory');
          const docsStat = document.getElementById('stat-docs');

          let ticketChart;
          let activeSessions = new Map();
          let allLogs = []; // Buffer for logs to allow filtering

          function initChart(data) {
            const ctx = document.getElementById('ticketChart').getContext('2d');
            ticketChart = new Chart(ctx, {
              type: 'doughnut',
              data: {
                labels: Object.keys(data),
                datasets: [{
                  data: Object.values(data),
                  backgroundColor: ['#60a5fa', '#818cf8', '#fbbf24', '#f87171', '#34d399'],
                  borderWidth: 0,
                  spacing: 4
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                    labels: { color: '#94a3b8', font: { size: 10, weight: 'bold' }, usePointStyle: true }
                  }
                },
                cutout: '70%'
              }
            });
          }

          function addLog(log, isHistory = false) {
            if (!isHistory) {
              allLogs.unshift(log);
              if (allLogs.length > 1000) allLogs.pop();
            }
            renderLogs();
          }

          function renderLogs() {
            const typeFilter = document.getElementById('filter-type').value;
            const userFilter = document.getElementById('filter-user').value.toLowerCase();
            const searchFilter = document.getElementById('filter-search').value.toLowerCase();

            const filtered = allLogs.filter(log => {
              const matchesType = !typeFilter || log.type === typeFilter;
              const matchesUser = !userFilter || log.user.toLowerCase().includes(userFilter);
              const matchesSearch = !searchFilter || log.message.toLowerCase().includes(searchFilter);
              return matchesType && matchesUser && matchesSearch;
            });

            document.getElementById('log-count').innerText = filtered.length + ' logs';

            logsContainer.innerHTML = filtered.map(log => {
              const color = log.type === 'error' ? 'text-red-400' : (log.type === 'warn' ? 'text-yellow-400' : 'text-blue-400');
              const time = log.timestamp.includes('T') ? log.timestamp.split('T')[1].split('.')[0] : log.timestamp;
              const userBadge = log.user && log.user !== 'Anonymous' 
                ? '<span class="bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded text-[10px] font-bold mr-2 uppercase tracking-tighter">' + log.user + '</span>'
                : '<span class="bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-bold mr-2 uppercase tracking-tighter">SYS</span>';
              
              return \`
                <div class="log-entry py-1.5 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors px-2 rounded">
                  <div class="flex items-start gap-2">
                    <span class="text-slate-600 font-medium min-w-[65px] flex-shrink-0">[\${time}]</span>
                    \${userBadge}
                    <span class="\${color} font-bold min-w-[50px] flex-shrink-0">[\${log.type.toUpperCase()}]</span>
                    <span class="text-slate-300 break-all">\${log.message}</span>
                  </div>
                </div>
              \`;
            }).join('');
          }

          function applyFilters() { renderLogs(); }
          function clearLogsUI() { allLogs = []; renderLogs(); }

          async function loadHistory() {
            const token = localStorage.getItem('token'); // This dashboard doesn't have login, let's assume we can fetch if authorized or provide a prompt
            // For simplicity in this dashboard, let's use a prompt for token if needed, 
            // but usually this dashboard is for admins who have a token in their main app.
            // If this is a standalone page, we might need a different auth strategy.
            // Let's try to fetch it and see.
            try {
              const res = await fetch('/api/system-logs', {
                headers: { 'Authorization': 'Bearer ' + token }
              });
              if (res.ok) {
                const history = await res.json();
                allLogs = history;
                renderLogs();
              } else {
                alert('Authorization failed. Please login to the main app first or provide a token.');
              }
            } catch (err) {
              console.error('History load failed:', err);
            }
          }

          socket.on('log', (log) => {
            addLog(log);
            // Update active sessions based on logs
            if (log.user && log.user !== 'Anonymous') {
              activeSessions.set(log.user, {
                lastAction: log.message.split(' - ')[0],
                timestamp: new Date()
              });
              updateActiveUsersUI();
            }
          });

          function updateActiveUsersUI() {
            if (activeSessions.size === 0) return;
            
            const sortedUsers = Array.from(activeSessions.entries())
              .sort((a, b) => b[1].timestamp - a[1].timestamp)
              .slice(0, 5);

            activeUsersContainer.innerHTML = sortedUsers.map(([username, data]) => \`
              <div class="flex items-center justify-between bg-slate-800/30 p-2 rounded-lg border border-slate-700/30">
                <div class="flex items-center gap-2 overflow-hidden">
                  <div class="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                  <div class="truncate">
                    <p class="text-[11px] font-bold text-slate-200 truncate">\${username}</p>
                    <p class="text-[9px] text-slate-500 truncate">\${data.lastAction}</p>
                  </div>
                </div>
                <span class="text-[9px] text-slate-600 font-mono flex-shrink-0">\${data.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            \`).join('');
          }

          socket.on('stats', (stats) => {
            clientsCount.innerText = stats.clients;
            uptimeDisplay.innerText = stats.uptime;
            memoryDisplay.innerText = stats.memory + ' MB';
            cpuDisplay.innerText = stats.cpu + '%';
            osDisplay.innerText = stats.os;
            nodeDisplay.innerText = 'Node ' + stats.nodeVersion;

            // Business stats
            ticketsStat.innerText = stats.db.tickets;
            usersStat.innerText = stats.db.users;
            inventoryStat.innerText = stats.db.inventory;
            docsStat.innerText = stats.db.documents;

            // Update chart
            if (!ticketChart) {
              initChart(stats.db.ticketStatus);
            } else {
              ticketChart.data.labels = Object.keys(stats.db.ticketStatus);
              ticketChart.data.datasets[0].data = Object.values(stats.db.ticketStatus);
              ticketChart.update();
            }

            // Update requests
            if (stats.db.pendingRequests && stats.db.pendingRequests.length > 0) {
              requestCount.innerText = stats.db.pendingRequests.length;
              requestsContainer.innerHTML = stats.db.pendingRequests.map(r => \`
                <div class="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                  <div class="flex justify-between items-start mb-1">
                    <p class="text-sm font-bold text-white">\${r.name}</p>
                    <span class="text-[10px] text-blue-400 font-mono">\${new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p class="text-xs text-slate-400 mb-1">\${r.email} • \${r.department}</p>
                  <p class="text-[10px] text-slate-500 italic">\${r.reason}</p>
                </div>
              \`).join('');
            } else {
              requestsContainer.innerHTML = '<p class="text-slate-600 text-sm italic text-center py-4">No pending requests</p>';
            }
          });

          // Initial log
          addLog({ timestamp: new Date().toISOString(), type: 'info', message: 'Dashboard connected to live stream' });
        </script>
      </body>
    </html>
  `;
  return reply.type('text/html; charset=utf-8').send(html);
});

fastify.register(chatRoutes, { prefix: '/api/chat', io });

// Periodic stats broadcast
let clientCount = 0;
io.on('connection', (socket) => {
  clientCount++;
  socket.on('disconnect', () => { clientCount--; });
});

interface DashboardStats {
  tickets: number;
  users: number;
  inventory: number;
  documents: number;
  ticketStatus: Record<string, number>;
  pendingRequests: any[];
}

async function getDbStats(): Promise<DashboardStats> {
  try {
    const [tickets, users, inventory, documents, ticketStatus, pendingRequests] = await Promise.all([
      prisma.ticket.count(),
      prisma.user.count(),
      prisma.inventoryItem.count(),
      prisma.document.count(),
      prisma.ticket.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.registrationRequest.findMany({
        where: { status: 'pending' },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    (ticketStatus as any[]).forEach((s) => {
      statusMap[s.status] = s._count;
    });

    return {
      tickets,
      users,
      inventory,
      documents,
      ticketStatus: statusMap,
      pendingRequests,
    };
  } catch (err) {
    console.error('Error fetching DB stats:', err);
    return {
      tickets: 0,
      users: 0,
      inventory: 0,
      documents: 0,
      ticketStatus: {},
      pendingRequests: [],
    };
  }
}

let cachedDbStats: DashboardStats = {
  tickets: 0,
  users: 0,
  inventory: 0,
  documents: 0,
  ticketStatus: {},
  pendingRequests: [],
};

// Update DB stats every 10 seconds
setInterval(async () => {
  cachedDbStats = await getDbStats();
}, 10000);

// Initial fetch
getDbStats().then(stats => cachedDbStats = stats);

setInterval(() => {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  const uptimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  const cpus = os.cpus();
  const cpuLoad = Math.round(os.loadavg()[0] * 100 / cpus.length);

  io.emit('stats', {
    clients: clientCount,
    uptime: uptimeStr,
    memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    cpu: cpuLoad,
    os: `${os.type()} ${os.release()}`,
    nodeVersion: process.version,
    db: cachedDbStats,
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
