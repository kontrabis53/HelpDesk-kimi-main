import { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma.js';
import { z } from 'zod';

const roleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  color: z.string(),
  isSystem: z.boolean().optional(),
  permissions: z.array(z.object({
    moduleId: z.string(),
    canView: z.boolean(),
    canCreate: z.boolean(),
    canEdit: z.boolean(),
    canDelete: z.boolean(),
  })),
});

export default async function roleRoutes(fastify: FastifyInstance) {
  // Get all roles
  fastify.get('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const roles = await prisma.role.findMany();
      return roles;
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Ошибка при получении списка ролей' });
    }
  });

  // Create role
  fastify.post('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const currentUser = request.user as any;
      if (currentUser.role !== 'admin') {
        return reply.status(403).send({ message: 'Только администратор может создавать роли' });
      }

      const data = roleSchema.parse(request.body);
      const role = await prisma.role.create({
        data
      });
      return role;
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Ошибка при создании роли' });
    }
  });

  // Update role
  fastify.patch('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const currentUser = request.user as any;

      if (currentUser.role !== 'admin') {
        return reply.status(403).send({ message: 'Только администратор может редактировать роли' });
      }

      const data = roleSchema.partial().parse(request.body);
      const role = await prisma.role.update({
        where: { id },
        data
      });
      return role;
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Ошибка при обновлении роли' });
    }
  });

  // Delete role
  fastify.delete('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const currentUser = request.user as any;

      if (currentUser.role !== 'admin') {
        return reply.status(403).send({ message: 'Только администратор может удалять роли' });
      }

      const role = await prisma.role.findUnique({ where: { id } });
      if (role?.isSystem) {
        return reply.status(400).send({ message: 'Системные роли нельзя удалять' });
      }

      await prisma.role.delete({
        where: { id }
      });
      return { success: true };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Ошибка при удалении роли' });
    }
  });
}
