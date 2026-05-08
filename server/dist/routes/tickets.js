"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ticketRoutes;
const prisma_js_1 = __importDefault(require("../lib/prisma.js"));
const zod_1 = require("zod");
const ticketSchema = zod_1.z.object({
    title: zod_1.z.string().min(5),
    description: zod_1.z.string(),
    category: zod_1.z.string(),
    priority: zod_1.z.enum(['low', 'medium', 'high', 'critical']),
    assigneeId: zod_1.z.string().optional().nullable(),
});
const updateTicketSchema = zod_1.z.object({
    status: zod_1.z.enum(['new', 'in_progress', 'waiting', 'resolved', 'closed']).optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high', 'critical']).optional(),
    assigneeId: zod_1.z.string().optional().nullable(),
});
const commentSchema = zod_1.z.object({
    text: zod_1.z.string().min(1),
});
async function ticketRoutes(fastify) {
    // List all tickets
    fastify.get('/', {
        onRequest: [fastify.authenticate]
    }, async (request) => {
        const { archived } = request.query;
        const isArchived = archived === 'true';
        const tickets = await prisma_js_1.default.ticket.findMany({
            where: {
                isArchived: isArchived
            },
            include: {
                author: {
                    select: { id: true, name: true, role: true, avatar: true }
                },
                assignee: {
                    select: { id: true, name: true, role: true, avatar: true }
                },
                _count: {
                    select: { comments: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return tickets;
    });
    // Get ticket by ID
    fastify.get('/:id', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        const { id } = request.params;
        const ticket = await prisma_js_1.default.ticket.findUnique({
            where: { id },
            include: {
                author: {
                    select: { id: true, name: true, role: true, avatar: true, position: true, department: true }
                },
                assignee: {
                    select: { id: true, name: true, role: true, avatar: true, position: true, department: true }
                },
                comments: {
                    include: {
                        author: {
                            select: { id: true, name: true, avatar: true, role: true }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        if (!ticket) {
            return reply.status(404).send({ message: 'Заявка не найдена' });
        }
        return ticket;
    });
    // Create new ticket
    fastify.post('/', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const data = ticketSchema.parse(request.body);
            const user = request.user;
            // Generate a simple ticket number
            const count = await prisma_js_1.default.ticket.count();
            const number = `#${1000 + count + 1}`;
            const ticket = await prisma_js_1.default.ticket.create({
                data: {
                    ...data,
                    number,
                    authorId: user.id,
                    status: 'new'
                },
                include: {
                    author: {
                        select: { id: true, name: true }
                    }
                }
            });
            return reply.status(201).send(ticket);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({ message: 'Ошибка валидации', errors: error.errors });
            }
            return reply.status(500).send({ message: 'Ошибка сервера' });
        }
    });
    // Update ticket
    fastify.patch('/:id', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const user = request.user;
            const data = updateTicketSchema.parse(request.body);
            // Check if ticket exists and get author
            const existingTicket = await prisma_js_1.default.ticket.findUnique({ where: { id } });
            if (!existingTicket) {
                return reply.status(404).send({ message: 'Заявка не найдена' });
            }
            // Permission check: only admin, technician, or the author (if only changing status to closed) can update
            if (user.role === 'user' && existingTicket.authorId !== user.id) {
                return reply.status(403).send({ message: 'Нет прав на редактирование этой заявки' });
            }
            const ticket = await prisma_js_1.default.ticket.update({
                where: { id },
                data,
                include: {
                    author: {
                        select: { id: true, name: true, role: true, avatar: true, position: true, department: true }
                    },
                    assignee: {
                        select: { id: true, name: true, role: true, avatar: true, position: true, department: true }
                    },
                    comments: {
                        include: {
                            author: {
                                select: { id: true, name: true, avatar: true, role: true }
                            }
                        },
                        orderBy: { createdAt: 'asc' }
                    }
                }
            });
            // Notify through socket
            if (fastify.io) {
                fastify.io.emit('ticket_updated', ticket);
            }
            return ticket;
        }
        catch (error) {
            return reply.status(500).send({ message: 'Ошибка при обновлении заявки' });
        }
    });
    // Add comment
    fastify.post('/:id/comments', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { id: ticketId } = request.params;
            const { text } = commentSchema.parse(request.body);
            const user = request.user;
            const comment = await prisma_js_1.default.comment.create({
                data: {
                    text,
                    ticketId,
                    authorId: user.id
                },
                include: {
                    author: {
                        select: { id: true, name: true, avatar: true }
                    }
                }
            });
            // Notify through socket
            if (fastify.io) {
                fastify.io.emit('new_comment', { ticketId, comment });
            }
            return reply.status(201).send(comment);
        }
        catch (error) {
            return reply.status(500).send({ message: 'Ошибка при добавлении комментария' });
        }
    });
    // Delete ticket
    fastify.delete('/:id', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const user = request.user;
            const existingTicket = await prisma_js_1.default.ticket.findUnique({ where: { id } });
            if (!existingTicket) {
                return reply.status(404).send({ message: 'Заявка не найдена' });
            }
            // Only admin can delete tickets, or author if status is 'new'
            const canDelete = user.role === 'admin' || (user.id === existingTicket.authorId && existingTicket.status === 'new');
            if (!canDelete) {
                return reply.status(403).send({ message: 'Нет прав на удаление этой заявки' });
            }
            // Delete comments first
            await prisma_js_1.default.comment.deleteMany({ where: { ticketId: id } });
            // Delete the ticket
            await prisma_js_1.default.ticket.delete({ where: { id } });
            return { success: true };
        }
        catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Ошибка при удалении заявки' });
        }
    });
    // Archive ticket
    fastify.post('/:id/archive', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const user = request.user;
            const existingTicket = await prisma_js_1.default.ticket.findUnique({ where: { id } });
            if (!existingTicket) {
                return reply.status(404).send({ message: 'Заявка не найдена' });
            }
            // Only admin or technician can archive resolved/closed tickets
            // Or author if ticket is closed
            const canArchive = user.role === 'admin' ||
                user.role === 'technician' ||
                (user.id === existingTicket.authorId && (existingTicket.status === 'closed' || existingTicket.status === 'resolved'));
            if (!canArchive) {
                return reply.status(403).send({ message: 'Нет прав на архивацию этой заявки' });
            }
            const ticket = await prisma_js_1.default.ticket.update({
                where: { id },
                data: { isArchived: true },
            });
            return ticket;
        }
        catch (error) {
            return reply.status(500).send({ message: 'Ошибка при архивации заявки' });
        }
    });
    // Unarchive ticket
    fastify.post('/:id/unarchive', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const user = request.user;
            if (user.role !== 'admin' && user.role !== 'technician') {
                return reply.status(403).send({ message: 'Нет прав на восстановление заявок из архива' });
            }
            const ticket = await prisma_js_1.default.ticket.update({
                where: { id },
                data: { isArchived: false },
            });
            return ticket;
        }
        catch (error) {
            return reply.status(500).send({ message: 'Ошибка при восстановлении заявки' });
        }
    });
}
