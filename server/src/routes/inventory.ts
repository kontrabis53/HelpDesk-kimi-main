import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import prisma from '../lib/prisma.js';
import { z } from 'zod';

const inventoryItemSchema = z.object({
  sku: z.string().min(3),
  name: z.string().min(2),
  category: z.string(),
  description: z.string().optional(),
  quantity: z.number().int().nonnegative(),
  minQuantity: z.number().int().nonnegative().optional(),
  unit: z.string().default('pcs'),
  location: z.string().optional(),
  supplier: z.string().optional(),
  price: z.number().nonnegative().optional(),
});

export default async function inventoryRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  // List all inventory items
  fastify.get('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { name: 'asc' }
    });
    return items;
  });

  // Get item by SKU or ID
  fastify.get('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = await prisma.inventoryItem.findFirst({
      where: {
        OR: [
          { id },
          { sku: id }
        ]
      }
    });

    if (!item) {
      return reply.status(404).send({ message: 'Товар не найден' });
    }
    return item;
  });

  // Create new inventory item (Admin/Technician)
  fastify.post('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const user = request.user as any;
    if (user.role === 'user') {
      return reply.status(403).send({ message: 'Недостаточно прав' });
    }

    try {
      const data = inventoryItemSchema.parse(request.body);
      const item = await prisma.inventoryItem.create({
        data
      });
      return reply.status(201).send(item);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Ошибка валидации', errors: error.errors });
      }
      return reply.status(500).send({ message: 'Ошибка сервера' });
    }
  });

  // Update item quantity or details
  fastify.patch('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const user = request.user as any;
    if (user.role === 'user') {
      return reply.status(403).send({ message: 'Недостаточно прав' });
    }

    try {
      const { id } = request.params as { id: string };
      const data = inventoryItemSchema.partial().parse(request.body);
      
      const item = await prisma.inventoryItem.update({
        where: { id },
        data
      });
      return item;
    } catch (error: any) {
      return reply.status(500).send({ message: 'Ошибка при обновлении товара' });
    }
  });
}
