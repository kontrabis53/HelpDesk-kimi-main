"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = chatRoutes;
const prisma_js_1 = __importDefault(require("../lib/prisma.js"));
const zod_1 = require("zod");
const chatMessageSchema = zod_1.z.object({
    text: zod_1.z.string().min(1).max(4096),
    receiverId: zod_1.z.string().optional(),
    chatId: zod_1.z.string().optional(),
    chatName: zod_1.z.string().optional(),
    isSystem: zod_1.z.boolean().optional(),
});
async function chatRoutes(fastify, options) {
    const { io } = options;
    console.log('[ChatRoutes] Initializing chat routes version 1.3.0...');
    // 1. PURGE Chat (Using flat path to avoid parameter conflicts)
    fastify.post('/purge', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { chatId, otherParticipantId } = request.body;
            const user = request.user;
            console.log(`[Chat] PURGE REQUEST: chatId=${chatId}, user=${user.username}`);
            if (!chatId) {
                return reply.status(400).send({ message: 'chatId обязателен' });
            }
            // Case A: Group or Public chat deletion
            if (chatId.startsWith('group_') || chatId === 'public') {
                const deleted = await prisma_js_1.default.chatMessage.deleteMany({
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
                const deleted = await prisma_js_1.default.chatMessage.deleteMany({
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
        }
        catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ success: false, error: error.message });
        }
    });
    // 2. Rename group chat
    fastify.patch('/rename/:chatId', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { chatId } = request.params;
            const { newName } = request.body;
            const user = request.user;
            if (!chatId.startsWith('group_') && chatId !== 'public') {
                return reply.status(400).send({ message: 'Можно переименовывать только групповые или общие чаты' });
            }
            const dbUser = await prisma_js_1.default.user.findUnique({
                where: { id: user.id },
                select: { name: true, username: true }
            });
            const systemMessage = await prisma_js_1.default.chatMessage.create({
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
        }
        catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Ошибка при переименовании чата' });
        }
    });
    // 3. Get recent messages
    fastify.get('/', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const user = request.user;
            const messages = await prisma_js_1.default.chatMessage.findMany({
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
        }
        catch (error) {
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
            const user = request.user;
            const message = await prisma_js_1.default.chatMessage.create({
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
                }
                else if (chatId && chatId.startsWith('group_')) {
                    io.emit('chat:message', messageToEmit);
                }
                else {
                    io.emit('chat:message', { ...messageToEmit, chatId: 'public' });
                }
            }
            return reply.status(201).send(message);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError)
                return reply.status(400).send({ message: 'Ошибка валидации', errors: error.errors });
            return reply.status(500).send({ message: 'Ошибка сервера' });
        }
    });
    // 5. Notify Chat Creation (Special route to sync visibility without first message)
    fastify.post('/notify-creation', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { chatId, type, participants, name } = request.body;
            const user = request.user;
            const dbUser = await prisma_js_1.default.user.findUnique({
                where: { id: user.id },
                select: { name: true, username: true }
            });
            const creatorName = dbUser?.name || dbUser?.username || 'Пользователь';
            // Create a system message about chat creation
            const systemText = type === 'group'
                ? `[GROUP_CREATED]|${name}|${participants.join(',')}|${creatorName}`
                : `[DIRECT_CREATED]|${creatorName}`;
            const systemMessage = await prisma_js_1.default.chatMessage.create({
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
                const messageToEmit = {
                    ...systemMessage,
                    chatName: name,
                    participants: participants // ВАЖНО: передаем полный список ID участников
                };
                // For groups, broadcast to everyone. For direct, broadcast to participants' rooms.
                if (type === 'group') {
                    io.emit('chat:message', messageToEmit);
                }
                else {
                    participants.forEach(pId => {
                        io.to(pId).emit('chat:message', messageToEmit);
                    });
                }
            }
            return reply.status(200).send({ success: true });
        }
        catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ success: false });
        }
    });
    // 6. Update Chat Avatar
    fastify.patch('/avatar/:chatId', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { chatId } = request.params;
            const { avatar } = request.body;
            const user = request.user;
            if (!chatId.startsWith('group_') && chatId !== 'public') {
                return reply.status(400).send({ message: 'Можно менять аватар только групповых или общих чатов' });
            }
            const dbUser = await prisma_js_1.default.user.findUnique({
                where: { id: user.id },
                select: { name: true, username: true }
            });
            const systemMessage = await prisma_js_1.default.chatMessage.create({
                data: {
                    text: `[GROUP_AVATAR_CHANGED]|${avatar}`,
                    senderId: user.id,
                    chatId: chatId,
                    isSystem: true
                },
                include: {
                    sender: { select: { id: true, name: true, avatar: true, role: true } }
                }
            });
            if (io) {
                io.emit('chat:avatar_updated', { chatId, avatar });
                // Also send a human-readable system message for the chat history
                const humanReadableSystemMessage = await prisma_js_1.default.chatMessage.create({
                    data: {
                        text: `Аватар группы изменен пользователем ${dbUser?.name || dbUser?.username || 'Система'}`,
                        senderId: user.id,
                        chatId: chatId,
                        isSystem: true
                    },
                    include: {
                        sender: { select: { id: true, name: true, avatar: true, role: true } }
                    }
                });
                io.emit('chat:message', humanReadableSystemMessage);
            }
            return reply.status(200).send({ success: true });
        }
        catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Ошибка при обновлении аватара чата' });
        }
    });
}
