import { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma.js';
import { z } from 'zod';
import { Server } from 'socket.io';

const chatMessageSchema = z.object({
  text: z.string().min(1).max(4096),
  receiverId: z.string().optional(),
  chatId: z.string().optional(),
  chatName: z.string().optional(),
  isSystem: z.boolean().optional(),
});

export default async function chatRoutes(fastify: FastifyInstance, options: { io: Server }) {
  const { io } = options;

  console.log('[ChatRoutes] Initializing chat routes version 1.3.0...');

  // 1. PURGE Chat (Using flat path to avoid parameter conflicts)
  fastify.post('/purge', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { chatId, otherParticipantId } = request.body as { chatId: string, otherParticipantId?: string };
      const user = request.user as any;

      console.log(`[Chat] PURGE REQUEST: chatId=${chatId}, user=${user.username}`);

      if (!chatId) {
        return reply.status(400).send({ message: 'chatId обязателен' });
      }

      // Case A: Group or Public chat deletion
      if (chatId.startsWith('group_') || chatId === 'public') {
        const deleted = await prisma.chatMessage.deleteMany({
          where: { chatId: chatId }
        });
        
        console.log(`[Chat] PURGE GROUP: ${deleted.count} messages removed`);
        
        if (io) {
          io.emit('chat:deleted', { 
            chatId, 
            deletedBy: user.name || user.username,
            deletedById: user.id
          });
        }
        
        return reply.status(200).send({ count: deleted.count, success: true });
      }

      // Case B: Direct chat deletion
      let id1 = user.id;
      let id2 = otherParticipantId;

      if (!id2 || id2 === 'undefined' || id2 === 'unknown') {
        if (chatId.startsWith('chat_')) {
          const parts = chatId.split('_');
          if (parts.length === 3) {
            id2 = parts[1] === user.id ? parts[2] : parts[1];
          }
        }
      }

      if (id1 && id2 && id2 !== 'undefined') {
        const deleted = await prisma.chatMessage.deleteMany({
          where: {
            OR: [
              { senderId: id1, receiverId: id2 },
              { senderId: id2, receiverId: id1 }
            ]
          }
        });

        console.log(`[Chat] PURGE DIRECT: ${deleted.count} messages removed`);

        if (io) {
          const consistentChatId = `chat_${[id1, id2].sort().join('_')}`;
          io.to(id1).to(id2).emit('chat:deleted', { 
            chatId: consistentChatId,
            deletedBy: user.name || user.username,
            deletedById: user.id
          });
        }

        return reply.status(200).send({ count: deleted.count, success: true });
      }

      return reply.status(200).send({ count: 0, success: true });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });
  
  // 2. Rename group chat
  fastify.patch('/rename/:chatId', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { chatId } = request.params as { chatId: string };
      const { newName } = request.body as { newName: string };
      const user = request.user as any;

      if (!chatId.startsWith('group_') && chatId !== 'public') {
        return reply.status(400).send({ message: 'Можно переименовывать только групповые или общие чаты' });
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true, username: true }
      });

      const systemMessage = await prisma.chatMessage.create({
        data: {
          text: `Группа переименована в "${newName}" пользователем ${dbUser?.name || dbUser?.username || 'Система'}`,
          senderId: user.id,
          chatId: chatId,
          isSystem: true
        },
        include: {
          sender: {
            select: { id: true, name: true, avatar: true, role: true }
          }
        }
      });

      if (io) {
        io.emit('chat:renamed', { chatId, newName });
        io.emit('chat:message', { ...systemMessage, chatName: newName });
      }

      return reply.status(200).send({ success: true, message: systemMessage });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Ошибка при переименовании чата' });
    }
  });

  // 3. Get recent messages
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
            { receiverId: null, chatId: 'public' },
            { chatId: { startsWith: 'group_' } }
          ]
        },
        include: {
          sender: { select: { id: true, name: true, avatar: true, role: true } },
          receiver: { select: { id: true, name: true, avatar: true, role: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 200 
      });
      return messages.reverse();
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Ошибка при загрузке сообщений' });
    }
  });

  // 4. Send message
  fastify.post('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { text, receiverId, chatId, chatName, isSystem } = chatMessageSchema.parse(request.body);
      const user = request.user as any;

      const message = await prisma.chatMessage.create({
        data: {
          text,
          senderId: user.id,
          receiverId,
          chatId: chatId || (receiverId ? `chat_${[user.id, receiverId].sort().join('_')}` : 'public'),
          isSystem: isSystem || false
        },
        include: {
          sender: { select: { id: true, name: true, avatar: true, role: true } }
        }
      });

      if (io) {
        const messageToEmit = { ...message, chatName };
        if (receiverId) {
          const consistentChatId = `chat_${[user.id, receiverId].sort().join('_')}`;
          io.to(receiverId).to(user.id).emit('chat:message', { ...messageToEmit, chatId: consistentChatId });
        } else if (chatId && chatId.startsWith('group_')) {
          io.emit('chat:message', messageToEmit);
        } else {
          io.emit('chat:message', { ...messageToEmit, chatId: 'public' });
        }
      }

      return reply.status(201).send(message);
    } catch (error: any) {
      if (error instanceof z.ZodError) return reply.status(400).send({ message: 'Ошибка валидации', errors: error.errors });
      return reply.status(500).send({ message: 'Ошибка сервера' });
    }
  });

  // 5. Notify Chat Creation (Special route to sync visibility without first message)
  fastify.post('/notify-creation', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { chatId, type, participants, name } = request.body as { 
        chatId: string, 
        type: 'direct' | 'group', 
        participants: string[], 
        name: string 
      };
      const user = request.user as any;

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true, username: true }
      });
      const creatorName = dbUser?.name || dbUser?.username || 'Пользователь';

      // Create a system message about chat creation
      const systemText = type === 'group' 
        ? `Пользователь ${creatorName} создал группу "${name}"`
        : `Пользователь ${creatorName} начал с вами чат`;

      const systemMessage = await prisma.chatMessage.create({
        data: {
          text: systemText,
          senderId: user.id,
          chatId: chatId,
          isSystem: true
        },
        include: {
          sender: { select: { id: true, name: true, avatar: true, role: true } }
        }
      });

      if (io) {
        // For groups, broadcast to everyone. For direct, broadcast to participants' rooms.
        if (type === 'group') {
          io.emit('chat:message', { ...systemMessage, chatName: name });
        } else {
          participants.forEach(pId => {
            io.to(pId).emit('chat:message', { ...systemMessage, chatName: name });
          });
        }
      }

      return reply.status(200).send({ success: true });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false });
    }
  });
}
