"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = directoryRoutes;
const prisma_js_1 = __importDefault(require("../lib/prisma.js"));
const zod_1 = require("zod");
const directoryEntrySchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    position: zod_1.z.string().optional().nullable(),
    department: zod_1.z.string().optional().nullable(),
    cabinet: zod_1.z.string().optional().nullable(),
    internalPhone: zod_1.z.string().optional().nullable(),
    mobilePhone: zod_1.z.string().optional().nullable(),
    telegram: zod_1.z.string().optional().nullable(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
});
async function directoryRoutes(fastify) {
    // List all directory entries
    fastify.get('/', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        const entries = await prisma_js_1.default.directoryEntry.findMany({
            orderBy: { name: 'asc' }
        });
        return entries;
    });
    // Get entry by ID
    fastify.get('/:id', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        const { id } = request.params;
        const entry = await prisma_js_1.default.directoryEntry.findUnique({
            where: { id }
        });
        if (!entry) {
            return reply.status(404).send({ message: 'Запись не найдена' });
        }
        return entry;
    });
    // Create new entry (Admin only)
    fastify.post('/', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        const user = request.user;
        if (user.role !== 'admin') {
            return reply.status(403).send({ message: 'Недостаточно прав' });
        }
        try {
            const data = directoryEntrySchema.parse(request.body);
            const entry = await prisma_js_1.default.directoryEntry.create({
                data
            });
            return reply.status(201).send(entry);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({ message: 'Ошибка валидации', errors: error.errors });
            }
            return reply.status(500).send({ message: 'Ошибка сервера' });
        }
    });
    // Update entry (Admin only)
    fastify.patch('/:id', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        const user = request.user;
        if (user.role !== 'admin' && user.role !== 'technician') {
            return reply.status(403).send({ message: 'Недостаточно прав' });
        }
        try {
            const { id } = request.params;
            const data = directoryEntrySchema.partial().parse(request.body);
            const entry = await prisma_js_1.default.directoryEntry.update({
                where: { id },
                data
            });
            return entry;
        }
        catch (error) {
            fastify.log.error(error);
            if (error.code === 'P2025') {
                return reply.status(404).send({ message: 'Запись не найдена' });
            }
            return reply.status(500).send({ message: 'Ошибка при обновлении записи' });
        }
    });
    // Delete entry (Admin only)
    fastify.delete('/:id', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        const user = request.user;
        if (user.role !== 'admin') {
            return reply.status(403).send({ message: 'Недостаточно прав' });
        }
        try {
            const { id } = request.params;
            await prisma_js_1.default.directoryEntry.delete({
                where: { id }
            });
            return reply.status(204).send();
        }
        catch (error) {
            fastify.log.error(error);
            if (error.code === 'P2025') {
                return reply.status(404).send({ message: 'Запись не найдена' });
            }
            return reply.status(500).send({ message: 'Ошибка при удалении записи' });
        }
    });
}
