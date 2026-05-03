import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { z } from 'zod';

const userUpdateSchema = z.object({
  username: z.string().optional().nullable().or(z.literal('')),
  password: z.string().optional().nullable().or(z.literal('')),
  name: z.string().optional().nullable().or(z.literal('')),
  email: z.string().optional().nullable().or(z.literal('')),
  role: z.string().optional().nullable().or(z.literal('')),
  roleId: z.string().optional().nullable().or(z.literal('')),
  position: z.string().optional().nullable().or(z.literal('')),
  department: z.string().optional().nullable().or(z.literal('')),
  isActive: z.boolean().optional().nullable(),
  notificationsEnabled: z.boolean().optional().nullable(),
  aiEnabled: z.boolean().optional().nullable(),
  showGreeting: z.boolean().optional().nullable(),
  greetingText: z.string().optional().nullable().or(z.literal('')),
  avatar: z.string().optional().nullable().or(z.literal('')),
  avatarHistory: z.array(z.string()).optional(),
});

export default async function userRoutes(fastify: FastifyInstance) {
  // Get all users 
  fastify.get('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          role: true,
          roleId: true,
          position: true,
          department: true,
          avatar: true,
          avatarHistory: true,
          isActive: true,
          isOnline: true,
          notificationsEnabled: true,
          aiEnabled: true,
          showGreeting: true,
          greetingText: true,
          createdAt: true,
          lastLogin: true
        } as any
      });
      return users;
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Ошибка при получении списка пользователей' });
    }
  });

  // Update user
  fastify.patch('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { id: userId } = request.params as { id: string };
    try {
      const currentUser = request.user as any;

      // Check permissions: admin can update anyone, user can only update themselves
      if (currentUser.role !== 'admin' && currentUser.id !== userId) {
        return reply.status(403).send({ message: 'Вы можете редактировать только свой профиль' });
      }

      const validation = userUpdateSchema.safeParse(request.body);
      
      if (!validation.success) {
        fastify.log.error({ errors: validation.error.format() }, 'Validation error');
        return reply.status(400).send({ 
          message: 'Ошибка валидации данных', 
          errors: validation.error.format() 
        });
      }

      const body = validation.data;
      
      // Prevent non-admins from changing roles or status
      if (currentUser.role !== 'admin') {
        delete body.role;
        delete body.roleId;
        delete body.isActive;
      }

      const updateData: any = {};
      
      // Only include fields that are not empty, null or undefined
      Object.keys(body).forEach(key => {
        const value = (body as any)[key];
        // Special handling for password: only if it has length >= 6
        if (key === 'password') {
          if (typeof value === 'string' && value.length >= 6) {
            updateData[key] = value;
          }
        } else if (key === 'notificationsEnabled' || key === 'aiEnabled' || key === 'showGreeting' || key === 'isActive' || key === 'avatar' || key === 'avatarHistory') {
          // Boolean values and avatar should be included even if false or null
          if (value !== undefined) {
            updateData[key] = value;
          }
        } else if (value !== '' && value !== undefined && value !== null) {
          updateData[key] = value;
        }
      });

      fastify.log.info({ userId, updateData }, 'Updating user');
      
      // Separate check for password processing
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      if (Object.keys(updateData).length === 0) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            role: true,
            roleId: true,
            position: true,
            department: true,
            avatar: true,
            avatarHistory: true,
            isActive: true,
            isOnline: true,
            notificationsEnabled: true,
            aiEnabled: true,
            showGreeting: true,
            greetingText: true,
            createdAt: true,
            lastLogin: true
          } as any
        });
        return user;
      }
    
      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          role: true,
          roleId: true,
          position: true,
          department: true,
          avatar: true,
          avatarHistory: true,
          isActive: true,
          isOnline: true,
          notificationsEnabled: true,
          aiEnabled: true,
          showGreeting: true,
          greetingText: true,
          createdAt: true,
          lastLogin: true
        } as any
      });

      // Если пользователя деактивировали, уведомляем его через сокет
      if (updateData.isActive === false) {
        const io = (fastify as any).io;
        if (io) {
          io.emit('user_deactivated', { userId: userId });
        }
      }

      return user;
    } catch (error: any) {
      fastify.log.error({ userId, error }, 'Error updating user');
      
      // Обработка ошибок связанных данных (Foreign Key Constraint)
      if (error.code === 'P2003') {
        return reply.status(400).send({ 
          message: 'Невозможно удалить пользователя, так как за ним закреплены заявки или другие документы. Сначала удалите связанные данные или деактивируйте пользователя.',
          code: 'FOREIGN_KEY_VIOLATION'
        });
      }

      if (error.code === 'P2002') {
        return reply.status(400).send({ message: 'Этот логин или email уже заняты' });
      }
      if (error.code === 'P2025') {
        return reply.status(404).send({ message: 'Пользователь не найден' });
      }
      return reply.status(500).send({ 
        message: 'Ошибка при обновлении пользователя',
        error: error.message,
        code: error.code 
      });
    }
  });

  // Delete user
  fastify.delete('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { id: userId } = request.params as { id: string };
    try {
      const { masterPassword } = request.body as { masterPassword?: string };
      const currentUser = request.user as any;

      if (currentUser.role !== 'admin') {
        return reply.status(403).send({ message: 'Только администратор может удалять пользователей' });
      }

      // Проверка мастер-пароля
      const correctMasterPassword = process.env.MASTER_DELETE_PASSWORD || 'root';
      if (!masterPassword || masterPassword !== correctMasterPassword) {
        return reply.status(400).send({ 
          message: 'Неверный мастер-пароль на удаление',
          code: 'INVALID_MASTER_PASSWORD'
        });
      }

      await prisma.user.delete({
        where: { id: userId }
      });
      fastify.log.info({ userId }, 'User deleted successfully');
      return { success: true };
    } catch (error: any) {
      const errorCode = error.code;
      fastify.log.error({ userId, errorCode, errorMessage: error.message }, 'Error deleting user');

      // Обработка ошибок связанных данных (Foreign Key Constraint)
      if (errorCode === 'P2003') {
        fastify.log.warn({ userId }, 'User has linked data, sending FOREIGN_KEY_VIOLATION');
        return reply.status(400).send({ 
          message: 'Невозможно удалить пользователя, так как за ним закреплены заявки или другие документы.',
          code: 'FOREIGN_KEY_VIOLATION'
        });
      }

      return reply.status(500).send({ 
        message: 'Ошибка при удалении пользователя',
        error: error.message,
        code: errorCode 
      });
    }
  });
}
