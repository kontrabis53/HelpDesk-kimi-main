import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6).optional(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'technician', 'user']).optional(),
  roleId: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  isActive: z.boolean().optional(),
  showGreeting: z.boolean().optional(),
  greetingText: z.string().optional(),
});

const registrationRequestSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  department: z.string(),
  reason: z.string(),
});

export default async function authRoutes(fastify: FastifyInstance) {
  
  fastify.get('/', async () => {
    return { message: 'Auth API root' };
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    try {
      const { username, password } = loginSchema.parse(request.body);
      const normalizedUsername = username.toLowerCase().trim();

      const user = await prisma.user.findUnique({
        where: { username: normalizedUsername },
        include: { roleRelation: true }
      });

      if (!user) {
        return reply.status(401).send({ message: 'Неверное имя пользователя или пароль' });
      }

      if (!user.isActive) {
        return reply.status(403).send({ message: 'Аккаунт деактивирован' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return reply.status(401).send({ message: 'Неверное имя пользователя или пароль' });
      }

      const token = fastify.jwt.sign({ 
        id: user.id, 
        role: user.role,
        username: user.username 
      });

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      const { password: _, ...userWithoutPassword } = user;
      return { token, user: userWithoutPassword };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Ошибка валидации', errors: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Ошибка сервера' });
    }
  });

  // Register (Admin only or system use)
  fastify.post('/register', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const currentUser = request.user as any;
    if (currentUser.role !== 'admin') {
      return reply.status(403).send({ message: 'Только администратор может регистрировать пользователей' });
    }

    try {
      const data = registerSchema.parse(request.body);
      
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: data.username },
            { email: data.email }
          ]
        }
      });

      if (existingUser) {
        return reply.status(400).send({ message: 'Пользователь с таким именем или email уже существует' });
      }

      if (!data.password) {
        return reply.status(400).send({ message: 'Пароль обязателен для регистрации' });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      // Sync role and roleId
      const userData = { ...data };
      if (userData.role && !userData.roleId) {
        userData.roleId = userData.role;
      } else if (userData.roleId && !userData.role) {
        userData.role = userData.roleId as any;
      }

      // Set default showGreeting based on role if not provided
      if (userData.showGreeting === undefined) {
        userData.showGreeting = (userData.role === 'admin' || userData.role === 'technician');
      }

      const user = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
        },
      });

      const { password: _, ...userWithoutPassword } = user;
      return reply.status(201).send(userWithoutPassword);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Ошибка валидации', errors: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Ошибка сервера' });
    }
  });

  // Request Registration
  fastify.post('/request-registration', async (request, reply) => {
    try {
      const data = registrationRequestSchema.parse(request.body);
      
      const existingRequest = await prisma.registrationRequest.findFirst({
        where: { email: data.email, status: 'pending' }
      });

      if (existingRequest) {
        return reply.status(400).send({ message: 'Заявка с таким email уже находится на рассмотрении' });
      }

      const registrationRequest = await prisma.registrationRequest.create({
        data
      });

      // Notify admins through socket
      if ((fastify as any).io) {
        (fastify as any).io.emit('new_registration_request', registrationRequest);
      }

      return reply.status(201).send(registrationRequest);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Ошибка валидации', errors: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Ошибка сервера' });
    }
  });

  // Get Registration Requests (Admin only)
  fastify.get('/registration-requests', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const user = request.user as any;
    if (user.role !== 'admin') {
      return reply.status(403).send({ message: 'Доступ запрещен' });
    }

    const requests = await prisma.registrationRequest.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return requests;
  });

  // Update Registration Request Status (Admin only)
  fastify.patch('/registration-requests/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const user = request.user as any;
    if (user.role !== 'admin') {
      return reply.status(403).send({ message: 'Доступ запрещен' });
    }

    try {
      const { id } = request.params as { id: string };
      const { status } = request.body as { status: string };

      if (!['approved', 'rejected', 'pending'].includes(status)) {
        return reply.status(400).send({ message: 'Неверный статус' });
      }

      const updated = await prisma.registrationRequest.update({
        where: { id },
        data: { status }
      });

      return updated;
    } catch (error: any) {
      fastify.log.error(error);
      if (error.code === 'P2025') {
        return reply.status(404).send({ message: 'Заявка не найдена' });
      }
      return reply.status(500).send({ message: 'Ошибка сервера' });
    }
  });

  // Delete Registration Request (Admin only)
  fastify.delete('/registration-requests/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const user = request.user as any;
    if (user.role !== 'admin') {
      return reply.status(403).send({ message: 'Доступ запрещен' });
    }

    try {
      const { id } = request.params as { id: string };
      await prisma.registrationRequest.delete({
        where: { id }
      });
      return { success: true };
    } catch (error: any) {
      fastify.log.error(error);
      if (error.code === 'P2025') {
        return reply.status(404).send({ message: 'Заявка не найдена' });
      }
      return reply.status(500).send({ message: 'Ошибка сервера' });
    }
  });

  // Get current user profile
  fastify.get('/me', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const decodedUser = request.user as any;
    const user = await prisma.user.findUnique({
      where: { id: (request.user as any).id },
      include: { roleRelation: true } 
    });
    
    if (!user) {
      return reply.status(404).send({ message: 'Пользователь не найден' });
    }

    const { password: _, ...userWithoutPassword } = user;
    
    return userWithoutPassword;
  });
}
