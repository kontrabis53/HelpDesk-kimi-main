import { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma.js';
import { z } from 'zod';

const documentSchema = z.object({
  title: z.string().min(3),
  type: z.enum(['act', 'repair', 'maintenance', 'inventory']),
  description: z.string().optional(),
  equipmentName: z.string().optional(),
  equipmentLocation: z.string().optional(),
  repairDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  repairCost: z.number().nonnegative().optional(),
  partsUsed: z.array(z.string()).optional(),
  files: z.array(z.object({
    name: z.string(),
    url: z.string(),
    size: z.number().optional(),
  })).optional(),
});

export default async function documentRoutes(fastify: FastifyInstance) {
  
  // List all documents
  fastify.get('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const documents = await prisma.document.findMany({
      include: {
        author: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return documents;
  });

  // Get document by ID
  fastify.get('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, position: true }
        }
      }
    });

    if (!document) {
      return reply.status(404).send({ message: 'Документ не найден' });
    }
    return document;
  });

  // Create new document (Technician/Admin)
  fastify.post('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const user = request.user as any;
    if (user.role === 'user') {
      return reply.status(403).send({ message: 'Недостаточно прав' });
    }

    try {
      const data = documentSchema.parse(request.body);
      
      // Generate document number based on type and year
      const year = new Date().getFullYear();
      const typePrefix = data.type.toUpperCase().substring(0, 3);
      const count = await prisma.document.count({
        where: { type: data.type }
      });
      const number = `${typePrefix}-${year}-${(count + 1).toString().padStart(3, '0')}`;

      const document = await prisma.document.create({
        data: {
          ...data,
          number,
          authorId: user.id,
          status: 'active'
        }
      });
      return reply.status(201).send(document);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Ошибка валидации', errors: error.errors });
      }
      return reply.status(500).send({ message: 'Ошибка сервера' });
    }
  });

  // Archive document
  fastify.patch('/:id/archive', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const user = request.user as any;
      if (user.role !== 'admin') {
        return reply.status(403).send({ message: 'Только администратор может архивировать документы' });
      }

      const { id } = request.params as { id: string };
      const document = await prisma.document.update({
        where: { id },
        data: { status: 'archived' }
      });
      return document;
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.status(404).send({ message: 'Документ не найден' });
      }
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Ошибка сервера' });
    }
  });

  // Update document
  fastify.patch('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const user = request.user as any;
      const { id } = request.params as { id: string };

      const existingDoc = await prisma.document.findUnique({ where: { id } });
      if (!existingDoc) {
        return reply.status(404).send({ message: 'Документ не найден' });
      }

      if (user.role !== 'admin' && existingDoc.authorId !== user.id) {
        return reply.status(403).send({ message: 'Вы можете редактировать только свои документы' });
      }

      const data = documentSchema.partial().parse(request.body);
      const updated = await prisma.document.update({
        where: { id },
        data
      });
      return updated;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Ошибка валидации', errors: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Ошибка сервера' });
    }
  });

  // Delete document
  fastify.delete('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const user = request.user as any;
      if (user.role !== 'admin') {
        return reply.status(403).send({ message: 'Только администратор может удалять документы' });
      }

      const { id } = request.params as { id: string };
      await prisma.document.delete({ where: { id } });
      return { success: true };
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.status(404).send({ message: 'Документ не найден' });
      }
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Ошибка сервера' });
    }
  });
}
