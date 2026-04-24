import { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma.js';
import { z } from 'zod';

const directoryEntrySchema = z.object({
  name: z.string().min(2),
  position: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  cabinet: z.string().optional().nullable(),
  internalPhone: z.string().optional().nullable(),
  mobilePhone: z.string().optional().nullable(),
  telegram: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export default async function directoryRoutes(fastify: FastifyInstance) {
  
  // List all directory entries
  fastify.get('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const entries = await prisma.directoryEntry.findMany({
      orderBy: { name: 'asc' }
    });
    return entries;
  });

  // Get entry by ID
  fastify.get('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const entry = await prisma.directoryEntry.findUnique({
      where: { id }
    });

    if (!entry) {
      return reply.status(404).send({ message: 'Запись не найдена' });
    }
    return entry;
  });

  // Create new entry (Admin only)
  fastify.post('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const user = request.user as any;
    if (user.role !== 'admin') {
      return reply.status(403).send({ message: 'Недостаточно прав' });
    }

    try {
      const data = directoryEntrySchema.parse(request.body);
      const entry = await prisma.directoryEntry.create({
        data
      });
      return reply.status(201).send(entry);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Ошибка валидации', errors: error.errors });
      }
      return reply.status(500).send({ message: 'Ошибка сервера' });
    }
  });

  // Update entry (Admin only)
  fastify.patch('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const user = request.user as any;
    if (user.role !== 'admin' && user.role !== 'technician') {
      return reply.status(403).send({ message: 'Недостаточно прав' });
    }

    try {
      const { id } = request.params as { id: string };
      const data = directoryEntrySchema.partial().parse(request.body);
      
      const entry = await prisma.directoryEntry.update({
        where: { id },
        data
      });
      return entry;
    } catch (error: any) {
      fastify.log.error(error);
      if (error.code === 'P2025') {
        return reply.status(404).send({ message: 'Запись не найдена' });
      }
      return reply.status(500).send({ message: 'Ошибка при обновлении записи' });
    }
  });

  // Delete entry (Admin only)
  fastify.delete('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const user = request.user as any;
    if (user.role !== 'admin') {
      return reply.status(403).send({ message: 'Недостаточно прав' });
    }

    try {
      const { id } = request.params as { id: string };
      await prisma.directoryEntry.delete({
        where: { id }
      });
      return reply.status(204).send();
    } catch (error: any) {
      fastify.log.error(error);
      if (error.code === 'P2025') {
        return reply.status(404).send({ message: 'Запись не найдена' });
      }
      return reply.status(500).send({ message: 'Ошибка при удалении записи' });
    }
  });
}
