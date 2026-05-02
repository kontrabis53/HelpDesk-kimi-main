import { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma.js';
import { z } from 'zod';

// Фильтр Zalgo-символов, эмодзи и подозрительных спецсимволов
const noZalgoOrEmoji = (val: string) => {
  if (!val) return true;
  // Более строгий regex для Zalgo и комбинируемых символов
  const zalgoRegex = /[\u0300-\u036F\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F\u0483-\u0489\u20D0-\u20F0]/;
  // Эмодзи
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3297}\u{3299}]/u;
  
  if (zalgoRegex.test(val) || emojiRegex.test(val)) return false;

  // Разрешаем только буквы, цифры, пробелы и базовую пунктуацию
  const cleanTextRegex = /^[a-zA-Z0-9а-яА-ЯёЁ\s\-\.\,\(\)\/\"\'\№\!\?\+\=\:\;\[\]\{\}\<\>\@\#\$\%\^\&\*\_\\|]*$/;
  return cleanTextRegex.test(val);
};

const inventoryItemSchema = z.object({
  sku: z.string().min(1),
  name: z.string()
    .min(2)
    .max(100)
    .refine(noZalgoOrEmoji, { message: 'Название содержит недопустимые символы (Zalgo или эмодзи)' }),
  category: z.string(),
  description: z.string()
    .max(500)
    .refine(noZalgoOrEmoji, { message: 'Описание содержит недопустимые символы (Zalgo или эмодзи)' })
    .optional(),
  quantity: z.number().int().min(-5000).max(25000),
  minQuantity: z.number().int().min(0).max(25000).optional(),
  unit: z.string().default('pcs'),
  location: z.string().optional(),
  supplier: z.string().optional(),
  price: z.number().min(0).max(1000000).optional(),
});

export default async function inventoryRoutes(fastify: FastifyInstance) {
  
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

      // Check for low stock on creation
      if (item.minQuantity !== null && item.quantity <= item.minQuantity) {
         (fastify as any).io.emit('inventory_low_stock', {
           id: item.id,
           sku: item.sku,
           name: item.name,
           quantity: item.quantity,
           minQuantity: item.minQuantity,
           unit: item.unit
         });
       }

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

      // Check for low stock and notify if necessary
      if (item.minQuantity !== null && item.quantity <= item.minQuantity) {
         (fastify as any).io.emit('inventory_low_stock', {
           id: item.id,
           sku: item.sku,
           name: item.name,
           quantity: item.quantity,
           minQuantity: item.minQuantity,
           unit: item.unit
         });
       }

      return item;
    } catch (error: any) {
      fastify.log.error(error);
      if (error.code === 'P2025') {
        return reply.status(404).send({ message: 'Товар не найден' });
      }
      return reply.status(500).send({ message: 'Ошибка при обновлении товара' });
    }
  });

  // Delete item
  fastify.delete('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const user = request.user as any;
    if (user.role !== 'admin') {
      return reply.status(403).send({ message: 'Только администратор может удалять позиции инвентаря' });
    }

    try {
      const { id } = request.params as { id: string };
      await prisma.inventoryItem.delete({
        where: { id }
      });
      return { success: true };
    } catch (error: any) {
      fastify.log.error(error);
      if (error.code === 'P2025') {
        return reply.status(404).send({ message: 'Товар не найден' });
      }
      return reply.status(500).send({ message: 'Ошибка при удалении товара' });
    }
  });
}
