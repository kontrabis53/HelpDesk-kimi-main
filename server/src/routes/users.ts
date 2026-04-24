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
          isActive: true,
          createdAt: true,
          lastLogin: true
        }
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
    try {
      const { id } = request.params as { id: string };
      const currentUser = request.user as any;

      // Check permissions: admin can update anyone, user can only update themselves
      if (currentUser.role !== 'admin' && currentUser.id !== id) {
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
        } else if (value !== '' && value !== undefined && value !== null) {
          updateData[key] = value;
        }
      });

      fastify.log.info({ id, updateData }, 'Updating user');
      
      if (Object.keys(updateData).length === 0) {
        const user = await prisma.user.findUnique({
          where: { id },
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
            isActive: true,
            createdAt: true,
            lastLogin: true
          }
        });
        return user;
      }
      
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }
      
      const user = await prisma.user.update({
        where: { id },
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
          isActive: true,
          createdAt: true,
          lastLogin: true
        }
      });
      return user;
    } catch (error: any) {
      fastify.log.error(error);
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
    try {
      const { id } = request.params as { id: string };
      const currentUser = request.user as any;

      if (currentUser.role !== 'admin') {
        return reply.status(403).send({ message: 'Только администратор может удалять пользователей' });
      }

      await prisma.user.delete({
        where: { id }
      });
      return { success: true };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Ошибка при удалении пользователя' });
    }
  });
}
