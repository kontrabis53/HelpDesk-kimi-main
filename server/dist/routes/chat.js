"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = chatRoutes;
const prisma_js_1 = __importDefault(require("../lib/prisma.js"));
const zod_1 = require("zod");
const chatCrypto_js_1 = require("../lib/chatCrypto.js");
const chatMessageSchema = zod_1.z.object({
    text: zod_1.z.string().min(1).max(4096),
    receiverId: zod_1.z.string().optional(),
    chatId: zod_1.z.string().optional(),
    chatName: zod_1.z.string().optional(),
    isSystem: zod_1.z.boolean().optional(),
});
/** chat_<idA>_<idB> — два id без '_' внутри (как у личных чатов в клиенте) */
function parseDirectParticipantIds(sourceChatId) {
    if (!sourceChatId.startsWith('chat_'))
        return null;
    const rest = sourceChatId.slice('chat_'.length);
    const sep = rest.indexOf('_');
    if (sep === -1)
        return null;
    const id1 = rest.slice(0, sep);
    const id2 = rest.slice(sep + 1);
    if (!id1 || !id2)
        return null;
    return [id1, id2];
}
const upgradeDirectSchema = zod_1.z.object({
    sourceChatId: zod_1.z.string().min(1),
    additionalParticipantIds: zod_1.z.array(zod_1.z.string().min(1)).min(1),
    groupName: zod_1.z.string().optional(),
});
async function chatRoutes(fastify, options) {
    const { io } = options;
    console.log('[ChatRoutes] Initializing chat routes version 1.3.0...');
    // Helper to get current participants of a group chat
    async function getGroupParticipants(chatId) {
        if (chatId === 'public') {
            const allUsers = await prisma_js_1.default.user.findMany({ select: { id: true } });
            return allUsers.map(u => u.id);
        }
        // Find all system messages related to participants for this chat
        const systemMessages = await prisma_js_1.default.chatMessage.findMany({
            where: {
                chatId: chatId,
                isSystem: true,
                OR: [
                    { text: { startsWith: '[GROUP_CREATED]|' } },
                    { text: { startsWith: '[GROUP_UPDATED]|' } },
                    { text: { startsWith: '[USER_LEFT_GROUP]|' } }
                ]
            },
            orderBy: { createdAt: 'asc' }
        });
        let participants = [];
        for (const msg of systemMessages) {
            if (msg.text.startsWith('[GROUP_CREATED]|') || msg.text.startsWith('[GROUP_UPDATED]|')) {
                const parts = msg.text.split('|');
                if (parts.length >= 3) {
                    participants = parts[2].split(',');
                }
            }
            else if (msg.text.startsWith('[USER_LEFT_GROUP]|')) {
                // If a user left, remove them from the list
                // Note: msg.senderId is the ID of the user who left
                if (msg.senderId) {
                    participants = participants.filter(id => id !== msg.senderId);
                }
            }
        }
        return Array.from(new Set(participants));
    }
    async function getGroupCreatorId(chatId) {
        const creationMessage = await prisma_js_1.default.chatMessage.findFirst({
            where: {
                chatId: chatId,
                isSystem: true,
                text: { startsWith: '[GROUP_CREATED]|' }
            },
            orderBy: { createdAt: 'asc' }
        });
        return creationMessage?.senderId || null;
    }
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
                const { masterPassword } = request.body;
                // Get group creator ID
                const groupCreatorId = await getGroupCreatorId(chatId);
                const isCreator = user.id === groupCreatorId;
                if (!isCreator) {
                    console.log(`[Chat] Master password provided: ${masterPassword}`);
                    if (!masterPassword || masterPassword !== 'root') { // Master password check
                        return reply.status(403).send({ message: 'Недостаточно прав. Для удаления группы необходим мастер-пароль.' });
                    }
                }
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
                    // Send ONLY to current group members
                    const members = await getGroupParticipants(chatId);
                    members.forEach(mId => {
                        io.to(mId).emit('chat:message', messageToEmit);
                    });
                }
                else {
                    // Public chat - broadcast to everyone
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
            const { chatId, type, participants, name, isUpdate } = request.body;
            const user = request.user;
            const dbUser = await prisma_js_1.default.user.findUnique({
                where: { id: user.id },
                select: { name: true, username: true }
            });
            const creatorName = dbUser?.name || dbUser?.username || 'Пользователь';
            // For direct chats, set receiverId to the other participant so both users receive the row in GET /chat
            const otherDirectParticipantId = type === 'direct' && Array.isArray(participants)
                ? participants.find((pid) => pid && pid !== user.id)
                : undefined;
            // Smart check: if chat already has messages OR was already created, it's an update
            const existingMessagesCount = await prisma_js_1.default.chatMessage.count({
                where: { chatId: chatId }
            });
            const isExistingGroup = await prisma_js_1.default.chatMessage.findFirst({
                where: {
                    chatId: chatId,
                    isSystem: true,
                    text: { startsWith: '[GROUP_CREATED]' }
                }
            });
            const effectiveIsUpdate = isUpdate || existingMessagesCount > 0 || !!isExistingGroup || (chatId === 'public');
            let systemText = '';
            if (type === 'group') {
                if (effectiveIsUpdate) {
                    systemText = `[GROUP_UPDATED]|${name}|${participants.join(',')}|${creatorName}`;
                }
                else {
                    systemText = `[GROUP_CREATED]|${name}|${participants.join(',')}|${creatorName}`;
                }
            }
            else {
                systemText = `[DIRECT_CREATED]|${creatorName}`;
            }
            const systemMessage = await prisma_js_1.default.chatMessage.create({
                data: {
                    text: systemText,
                    senderId: user.id,
                    receiverId: otherDirectParticipantId ?? undefined,
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
                // For groups, broadcast only to current participants. For direct, broadcast to participants' rooms.
                if (type === 'group') {
                    participants.forEach(pId => {
                        io.to(pId).emit('chat:message', messageToEmit);
                    });
                }
                else {
                    participants.forEach(pId => {
                        io.to(pId).emit('chat:message', messageToEmit);
                    });
                }
            }
            // Только для групп: пустой список участников → очистка. Для личных чатов getGroupParticipants всегда пустой — нельзя вызывать.
            if (type === 'group' && chatId.startsWith('group_')) {
                const remainingParticipants = await getGroupParticipants(chatId);
                if (remainingParticipants.length === 0) {
                    console.log(`[Chat] Group ${chatId} is empty. Deleting all messages.`);
                    await prisma_js_1.default.chatMessage.deleteMany({
                        where: { chatId: chatId }
                    });
                    if (io) {
                        io.emit('chat:deleted', {
                            chatId,
                            deletedBy: 'Система',
                            deletedById: 'system'
                        });
                    }
                }
            }
            return reply.status(200).send({ success: true });
        }
        catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ success: false });
        }
    });
    // 6. Личный чат → группа: миграция сообщений и перешифрование под новый chatId
    fastify.post('/upgrade-direct', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const body = upgradeDirectSchema.parse(request.body);
            const user = request.user;
            const pair = parseDirectParticipantIds(body.sourceChatId);
            if (!pair) {
                return reply.status(400).send({ message: 'Неверный id личного чата' });
            }
            const [a, b] = pair;
            if (user.id !== a && user.id !== b) {
                return reply.status(403).send({ message: 'Вы не участник этого чата' });
            }
            const uniqueAdds = [...new Set(body.additionalParticipantIds)];
            for (const id of uniqueAdds) {
                const exists = await prisma_js_1.default.user.findUnique({ where: { id }, select: { id: true } });
                if (!exists) {
                    return reply.status(400).send({ message: `Пользователь не найден: ${id}` });
                }
            }
            if (uniqueAdds.some(id => id === a || id === b)) {
                return reply.status(400).send({ message: 'Участники чата уже в переписке' });
            }
            const allParticipants = Array.from(new Set([a, b, ...uniqueAdds]));
            const newGroupId = `group_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
            const dbUser = await prisma_js_1.default.user.findUnique({
                where: { id: user.id },
                select: { name: true, username: true }
            });
            const creatorName = dbUser?.name || dbUser?.username || 'Пользователь';
            let finalName = (body.groupName || '').trim();
            if (!finalName) {
                const usersRows = await prisma_js_1.default.user.findMany({
                    where: { id: { in: allParticipants } },
                    select: { id: true, name: true, username: true }
                });
                const nameById = new Map(usersRows.map(u => [u.id, u.name || u.username || '?']));
                finalName = allParticipants
                    .map(id => (nameById.get(id) || '?').split(' ')[0])
                    .filter(Boolean)
                    .join(', ');
                if (!finalName)
                    finalName = 'Групповой чат';
            }
            const systemText = `[GROUP_CREATED]|${finalName}|${allParticipants.join(',')}|${creatorName}`;
            const systemMessage = await prisma_js_1.default.$transaction(async (tx) => {
                await tx.chatMessage.deleteMany({
                    where: {
                        chatId: body.sourceChatId,
                        isSystem: true,
                        text: { startsWith: '[DIRECT_CREATED]' }
                    }
                });
                const remaining = await tx.chatMessage.findMany({
                    where: { chatId: body.sourceChatId }
                });
                for (const m of remaining) {
                    const newText = (0, chatCrypto_js_1.transcryptMessage)(m.text, body.sourceChatId, newGroupId);
                    await tx.chatMessage.update({
                        where: { id: m.id },
                        data: {
                            chatId: newGroupId,
                            receiverId: null,
                            text: newText
                        }
                    });
                }
                return tx.chatMessage.create({
                    data: {
                        text: systemText,
                        senderId: user.id,
                        chatId: newGroupId,
                        isSystem: true
                    },
                    include: {
                        sender: { select: { id: true, name: true, avatar: true, role: true } }
                    }
                });
            });
            if (io && systemMessage) {
                const messageToEmit = {
                    ...systemMessage,
                    chatName: finalName,
                    participants: allParticipants,
                    creatorId: user.id
                };
                for (const pId of allParticipants) {
                    io.to(pId).emit('chat:message', messageToEmit);
                    io.to(pId).emit('chat:direct_upgraded', {
                        sourceChatId: body.sourceChatId,
                        newGroupId,
                        name: finalName,
                        participants: allParticipants,
                        upgradeByUserId: user.id
                    });
                }
            }
            return reply.status(200).send({
                success: true,
                newGroupId,
                name: finalName,
                participants: allParticipants
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({ message: 'Ошибка валидации', errors: error.errors });
            }
            fastify.log.error(error);
            return reply.status(500).send({ success: false, message: error.message });
        }
    });
    // 7. Leave Group
    fastify.post('/leave/:chatId', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { chatId } = request.params;
            const user = request.user;
            if (!chatId.startsWith('group_') && chatId !== 'public') {
                return reply.status(400).send({ message: 'Можно покинуть только групповой чат' });
            }
            const dbUser = await prisma_js_1.default.user.findUnique({
                where: { id: user.id },
                select: { name: true, username: true }
            });
            // Создаем системное сообщение о выходе пользователя
            const systemMessage = await prisma_js_1.default.chatMessage.create({
                data: {
                    text: `[USER_LEFT_GROUP]|${dbUser?.name || dbUser?.username || 'Пользователь'}`,
                    senderId: user.id,
                    chatId: chatId,
                    isSystem: true
                },
                include: {
                    sender: { select: { id: true, name: true, avatar: true, role: true } }
                }
            });
            if (io) {
                const members = await getGroupParticipants(chatId);
                // Include the user who just left in the notification so they see the system message before it disappears
                const notifyList = Array.from(new Set([...members, user.id]));
                notifyList.forEach(mId => {
                    io.to(mId).emit('chat:message', systemMessage);
                });
                // Также можно отправить специальное событие для обновления списка участников у других
                members.forEach(mId => {
                    io.to(mId).emit('chat:participant_left', { chatId, userId: user.id });
                });
            }
            return reply.status(200).send({ success: true });
        }
        catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Ошибка при выходе из группы' });
        }
    });
    // 7. Update Chat Avatar
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
    // 8. Remove Participant from Group
    fastify.post('/remove-participant/:chatId', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { chatId } = request.params;
            const { userIdToRemove, masterPassword } = request.body;
            const user = request.user; // The user making the request
            if (!chatId.startsWith('group_')) {
                return reply.status(400).send({ message: 'Можно удалять участников только из группового чата' });
            }
            // Get current participants and group creator
            const currentParticipants = await getGroupParticipants(chatId);
            const groupCreatorId = await getGroupCreatorId(chatId);
            // Authorization check
            const isCreator = user.id === groupCreatorId;
            const isMasterPasswordCorrect = masterPassword === 'root'; // Simplified for now, should be from env
            if (!isCreator && !isMasterPasswordCorrect) {
                return reply.status(403).send({ message: 'Недостаточно прав. Только владелец группы или мастер-пароль могут исключать участников.' });
            }
            if (!currentParticipants.includes(userIdToRemove)) {
                return reply.status(400).send({ message: 'Указанный пользователь не является участником этого чата.' });
            }
            if (userIdToRemove === groupCreatorId && !isMasterPasswordCorrect) {
                return reply.status(403).send({ message: 'Владелец группы может быть исключен только с мастер-паролем.' });
            }
            const updatedParticipants = currentParticipants.filter(p => p !== userIdToRemove);
            // If no participants left, delete the group
            if (updatedParticipants.length === 0) {
                console.log(`[Chat] Group ${chatId} is empty after removing ${userIdToRemove}. Deleting all messages.`);
                await prisma_js_1.default.chatMessage.deleteMany({
                    where: { chatId: chatId }
                });
                if (io) {
                    io.emit('chat:deleted', {
                        chatId,
                        deletedBy: user.name || user.username,
                        deletedById: user.id
                    });
                }
                return reply.status(200).send({ success: true, message: 'Группа удалена, так как не осталось участников.' });
            }
            // Get group name for system message
            const latestGroupCreatedMessage = await prisma_js_1.default.chatMessage.findFirst({
                where: {
                    chatId: chatId,
                    isSystem: true,
                    text: { startsWith: '[GROUP_CREATED]' }
                },
                orderBy: { createdAt: 'desc' }
            });
            const groupName = latestGroupCreatedMessage?.text.split('|')[1] || 'Неизвестная группа';
            // Create system message for participant removal
            const dbUserRemoved = await prisma_js_1.default.user.findUnique({
                where: { id: userIdToRemove },
                select: { name: true, username: true }
            });
            const removedUserName = dbUserRemoved?.name || dbUserRemoved?.username || 'Неизвестный пользователь';
            const dbUserRemover = await prisma_js_1.default.user.findUnique({
                where: { id: user.id },
                select: { name: true, username: true }
            });
            const removerUserName = dbUserRemover?.name || dbUserRemover?.username || 'Система';
            // Create the system message that updates the participants list
            const updateSystemMessage = await prisma_js_1.default.chatMessage.create({
                data: {
                    text: `[GROUP_UPDATED]|${groupName}|${updatedParticipants.join(',')}|${removerUserName}`,
                    senderId: user.id,
                    chatId: chatId,
                    isSystem: true
                },
                include: {
                    sender: { select: { id: true, name: true, avatar: true, role: true } }
                }
            });
            // Create a human-readable system message for chat history
            const humanReadableSystemMessage = await prisma_js_1.default.chatMessage.create({
                data: {
                    text: `Пользователь ${removedUserName} был исключен из группы пользователем ${removerUserName}.`,
                    senderId: user.id,
                    chatId: chatId,
                    isSystem: true
                },
                include: {
                    sender: { select: { id: true, name: true, avatar: true, role: true } }
                }
            });
            if (io) {
                // Notify remaining participants about the participant list update
                updatedParticipants.forEach(pId => {
                    io.to(pId).emit('chat:message', { ...updateSystemMessage, chatName: groupName });
                    io.to(pId).emit('chat:participant_removed', { chatId, userId: userIdToRemove }); // Custom event for UI update
                });
                // Notify the removed user that they've been removed (optional, or just let their client update based on new participant list)
                io.to(userIdToRemove).emit('chat:participant_removed', { chatId, userId: userIdToRemove });
                io.to(userIdToRemove).emit('chat:message', { ...humanReadableSystemMessage, chatName: groupName }); // Send them the notification
                // Broadcast human-readable message to everyone who was in the group (including removed user if we notify them)
                io.to(chatId).emit('chat:message', { ...humanReadableSystemMessage, chatName: groupName }); // Send to the room, so everyone gets it.
            }
            return reply.status(200).send({ success: true, message: 'Участник успешно исключен.' });
        }
        catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ success: false, error: error.message });
        }
    });
}
