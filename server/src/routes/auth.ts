import { FastifyInstance, FastifyPluginOptions } from 'fastify';
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
});

export default async function authRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  fastify.get('/', async () => {
    return { message: 'Auth API root' };
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    try {
      const { username, password } = loginSchema.parse(request.body);
      
      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        return reply.status(401).send({ message: 'Неверное имя пользователя или пароль' });
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

  // Register
  fastify.post('/register', async (request, reply) => {
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
      
      const user = await prisma.user.create({
        data: {
          ...data,
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

  // Get current user (Me)
  fastify.get('/me', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: (request.user as any).id },
    });

    if (!user) {
      return reply.status(404).send({ message: 'Пользователь не найден' });
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
}
