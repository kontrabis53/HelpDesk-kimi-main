"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = roleRoutes;
const prisma_js_1 = __importDefault(require("../lib/prisma.js"));
const zod_1 = require("zod");
const roleSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    color: zod_1.z.string(),
    isSystem: zod_1.z.boolean().optional(),
    permissions: zod_1.z.array(zod_1.z.object({
        moduleId: zod_1.z.string(),
        canView: zod_1.z.boolean(),
        canCreate: zod_1.z.boolean(),
        canEdit: zod_1.z.boolean(),
        canDelete: zod_1.z.boolean(),
    })),
});
async function roleRoutes(fastify) {
    // Get all roles
    fastify.get('/', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const roles = await prisma_js_1.default.role.findMany();
            return roles;
        }
        catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Ошибка при получении списка ролей' });
        }
    });
    // Create role
    fastify.post('/', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const currentUser = request.user;
            if (currentUser.role !== 'admin') {
                return reply.status(403).send({ message: 'Только администратор может создавать роли' });
            }
            const data = roleSchema.parse(request.body);
            const role = await prisma_js_1.default.role.create({
                data
            });
            return role;
        }
        catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Ошибка при создании роли' });
        }
    });
    // Update role
    fastify.patch('/:id', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const currentUser = request.user;
            if (currentUser.role !== 'admin') {
                return reply.status(403).send({ message: 'Только администратор может редактировать роли' });
            }
            const data = roleSchema.partial().parse(request.body);
            const role = await prisma_js_1.default.role.update({
                where: { id },
                data
            });
            return role;
        }
        catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Ошибка при обновлении роли' });
        }
    });
    // Delete role
    fastify.delete('/:id', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const currentUser = request.user;
            if (currentUser.role !== 'admin') {
                return reply.status(403).send({ message: 'Только администратор может удалять роли' });
            }
            const role = await prisma_js_1.default.role.findUnique({
                where: { id },
                include: { _count: { select: { users: true } } }
            });
            if (!role) {
                return reply.status(404).send({ message: 'Роль не найдена' });
            }
            if (role.isSystem) {
                return reply.status(400).send({ message: 'Системные роли нельзя удалять' });
            }
            if (role._count.users > 0) {
                return reply.status(400).send({ message: `Нельзя удалить роль, так как она назначена пользователям (${role._count.users})` });
            }
            await prisma_js_1.default.role.delete({
                where: { id }
            });
            return { success: true };
        }
        catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Ошибка при удалении роли' });
        }
    });
}
