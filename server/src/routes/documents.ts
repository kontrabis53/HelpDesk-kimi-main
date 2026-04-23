import { FastifyInstance, FastifyPluginOptions } from 'fastify';
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
});

export default async function documentRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
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
  });
}
