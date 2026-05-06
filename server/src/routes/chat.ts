import { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma.js';
import { z } from 'zod';
import { Server } from 'socket.io';

const chatMessageSchema = z.object({
  text: z.string().min(1).max(4096),
  receiverId: z.string().optional(),
});

export default async function chatRoutes(fastify: FastifyInstance, options: { io: Server }) {
  const { io } = options;
  
  // Get recent messages for current user
  fastify.get('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const user = request.user as any;
      const messages = await prisma.chatMessage.findMany({
        where: {
          OR: [
            { senderId: user.id },
            { receiverId: user.id },
            { receiverId: null } // Public messages
          ]
        },
        include: {
          sender: {
            select: { id: true, name: true, avatar: true, role: true }
          },
          receiver: {
            select: { id: true, name: true, avatar: true, role: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 200 // Increased limit to ensure we see more history
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

      // REAL-TIME: Emit message
      if (io) {
        const activeUsers = (fastify as any).activeUsers;
        
        if (receiverId) {
          const receiverSockets = activeUsers.getAll(receiverId);
          const senderSockets = activeUsers.getAll(user.id);
          
          // Use consistent chatId (sorted IDs)
          const consistentChatId = `chat_${[user.id, receiverId].sort().join('_')}`;
          
          const privateMessage = { 
            ...message, 
            chatId: consistentChatId 
          };

          console.log(`[Socket] Sending private message to ${receiverSockets.length} receiver sockets and ${senderSockets.length} sender sockets`);

          // Send to all receiver sockets
          receiverSockets.forEach((sId: string) => {
            io.to(sId).emit('chat:message', privateMessage);
          });
          
          // Send back to all sender sockets for synchronization
          senderSockets.forEach((sId: string) => {
            io.to(sId).emit('chat:message', privateMessage);
          });
        } else {
          // Public group chat - broadcast to everyone
          console.log('[Socket] Broadcasting public message');
          io.emit('chat:message', message);
        }
      }

      return reply.status(201).send(message);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Ошибка валидации', errors: error.errors });
      }
      return reply.status(500).send({ message: 'Ошибка сервера' });
    }
  });

  // Delete chat messages
  fastify.delete('/:chatId', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { chatId } = request.params as { chatId: string };
      const query = request.query as any;
      const otherParticipantId = query?.otherParticipantId;
      const user = request.user as any;

      console.log(`[Chat] DELETE START: chatId=${chatId}, otherId=${otherParticipantId}, currentUser=${user.id}`);

      let id1 = user.id;
      let id2 = otherParticipantId;

      // If otherParticipantId not provided, try to extract from chatId
      if (!id2 || id2 === 'undefined' || id2 === 'unknown') {
        if (chatId.startsWith('chat_')) {
          const parts = chatId.split('_');
          if (parts.length === 3) {
            id2 = parts[1] === user.id ? parts[2] : parts[1];
          }
        } else if (chatId.startsWith('chat-')) {
          const parts = chatId.split('-');
          // chat-UUID1-UUID2 has 11 parts (1 + 5 + 5)
          if (parts.length >= 11) {
            const uuid1 = parts.slice(1, 6).join('-');
            const uuid2 = parts.slice(6, 11).join('-');
            id2 = uuid1 === user.id ? uuid2 : uuid1;
          }
        }
      }

      if (id1 && id2 && id2 !== 'undefined') {
        const cleanId1 = id1.trim();
        const cleanId2 = id2.trim();

        console.log(`[Chat] PRISMA DELETE ATTEMPT: ${cleanId1} <-> ${cleanId2}`);

        const deleted = await prisma.chatMessage.deleteMany({
          where: {
            OR: [
              { senderId: cleanId1, receiverId: cleanId2 },
              { senderId: cleanId2, receiverId: cleanId1 }
            ]
          }
        });

        console.log(`[Chat] DELETE SUCCESS: ${deleted.count} messages removed`);

        if (io) {
          const consistentChatId = `chat_${[cleanId1, cleanId2].sort().join('_')}`;
          io.emit('chat:deleted', { chatId: consistentChatId }); // Broadcast to ensure all tabs update
        }

        return reply.status(200).send({ count: deleted.count, success: true });
      }

      console.log(`[Chat] DELETE FAILED: Could not resolve participant IDs`);
      return reply.status(200).send({ count: 0, success: true });
    } catch (error: any) {
      console.error('[Chat] Delete error:', error);
      return reply.status(200).send({ success: false, error: error.message });
    }
  });
}
