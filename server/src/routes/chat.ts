import { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma.js';
import { z } from 'zod';
import { Server } from 'socket.io';

const chatMessageSchema = z.object({
  text: z.string().min(1),
  receiverId: z.string().optional(),
});

export default async function chatRoutes(fastify: FastifyInstance, options: { io: Server }) {
  const { io } = options;
  
  // Get recent messages
  fastify.get('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const messages = await prisma.chatMessage.findMany({
        include: {
          sender: {
            select: { id: true, name: true, avatar: true, role: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      return messages.reverse();
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Ошибка при загрузке сообщений' });
    }
  });

  // Send message
  fastify.post('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { text, receiverId } = chatMessageSchema.parse(request.body);
      const user = request.user as any;

      const message = await prisma.chatMessage.create({
        data: {
          text,
          senderId: user.id,
          receiverId
        },
        include: {
          sender: {
            select: { id: true, name: true, avatar: true, role: true }
          }
        }
      });

      // REAL-TIME: Emit message to all connected clients
      if (io) {
        io.emit('chat:message', message);
      }

      return reply.status(201).send(message);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Ошибка валидации', errors: error.errors });
      }
      return reply.status(500).send({ message: 'Ошибка сервера' });
    }
  });
}
