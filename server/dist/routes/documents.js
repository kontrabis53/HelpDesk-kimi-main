"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = documentRoutes;
const prisma_js_1 = __importDefault(require("../lib/prisma.js"));
const zod_1 = require("zod");
const documentSchema = zod_1.z.object({
    title: zod_1.z.string().min(3),
    type: zod_1.z.enum(['act', 'repair', 'maintenance', 'inventory']),
    description: zod_1.z.string().optional(),
    equipmentName: zod_1.z.string().optional(),
    equipmentLocation: zod_1.z.string().optional(),
    repairDate: zod_1.z.string().optional().transform(val => val ? new Date(val) : undefined),
    repairCost: zod_1.z.number().nonnegative().optional(),
    partsUsed: zod_1.z.array(zod_1.z.string()).optional(),
    files: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        url: zod_1.z.string(),
        size: zod_1.z.number().optional(),
    })).optional(),
});
async function documentRoutes(fastify) {
    // List all documents
    fastify.get('/', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        const documents = await prisma_js_1.default.document.findMany({
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
        const { id } = request.params;
        const document = await prisma_js_1.default.document.findUnique({
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
        const user = request.user;
        if (user.role === 'user') {
            return reply.status(403).send({ message: 'Недостаточно прав' });
        }
        try {
            const data = documentSchema.parse(request.body);
            // Generate document number based on type and year
            const year = new Date().getFullYear();
            const typePrefix = data.type.toUpperCase().substring(0, 3);
            const count = await prisma_js_1.default.document.count({
                where: { type: data.type }
            });
            const number = `${typePrefix}-${year}-${(count + 1).toString().padStart(3, '0')}`;
            const document = await prisma_js_1.default.document.create({
                data: {
                    ...data,
                    number,
                    authorId: user.id,
                    status: 'active'
                }
            });
            return reply.status(201).send(document);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({ message: 'Ошибка валидации', errors: error.errors });
            }
            return reply.status(500).send({ message: 'Ошибка сервера' });
        }
    });
    // Archive document
    fastify.patch('/:id/archive', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const user = request.user;
            if (user.role !== 'admin') {
                return reply.status(403).send({ message: 'Только администратор может архивировать документы' });
            }
            const { id } = request.params;
            const document = await prisma_js_1.default.document.update({
                where: { id },
                data: { status: 'archived' }
            });
            return document;
        }
        catch (error) {
            if (error.code === 'P2025') {
                return reply.status(404).send({ message: 'Документ не найден' });
            }
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Ошибка сервера' });
        }
    });
    // Update document
    fastify.patch('/:id', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const user = request.user;
            const { id } = request.params;
            const existingDoc = await prisma_js_1.default.document.findUnique({ where: { id } });
            if (!existingDoc) {
                return reply.status(404).send({ message: 'Документ не найден' });
            }
            if (user.role !== 'admin' && existingDoc.authorId !== user.id) {
                return reply.status(403).send({ message: 'Вы можете редактировать только свои документы' });
            }
            const data = documentSchema.partial().parse(request.body);
            const updated = await prisma_js_1.default.document.update({
                where: { id },
                data
            });
            return updated;
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({ message: 'Ошибка валидации', errors: error.errors });
            }
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Ошибка сервера' });
        }
    });
    // Delete document
    fastify.delete('/:id', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const user = request.user;
            if (user.role !== 'admin') {
                return reply.status(403).send({ message: 'Только администратор может удалять документы' });
            }
            const { id } = request.params;
            await prisma_js_1.default.document.delete({ where: { id } });
            return { success: true };
        }
        catch (error) {
            if (error.code === 'P2025') {
                return reply.status(404).send({ message: 'Документ не найден' });
            }
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Ошибка сервера' });
        }
    });
}
