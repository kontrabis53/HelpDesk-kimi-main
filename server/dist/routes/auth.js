"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authRoutes;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_js_1 = __importDefault(require("../lib/prisma.js"));
const zod_1 = require("zod");
const loginSchema = zod_1.z.object({
    username: zod_1.z.string(),
    password: zod_1.z.string(),
});
const registerSchema = zod_1.z.object({
    username: zod_1.z.string().min(3),
    password: zod_1.z.string().min(6).optional(),
    name: zod_1.z.string(),
    email: zod_1.z.string().email(),
    role: zod_1.z.enum(['admin', 'technician', 'user']).optional(),
    roleId: zod_1.z.string().optional(),
    position: zod_1.z.string().optional(),
    department: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
    notificationsEnabled: zod_1.z.boolean().optional(),
    aiEnabled: zod_1.z.boolean().optional(),
    showGreeting: zod_1.z.boolean().optional(),
    greetingText: zod_1.z.string().optional(),
});
const registrationRequestSchema = zod_1.z.object({
    name: zod_1.z.string(),
    email: zod_1.z.string().email(),
    department: zod_1.z.string(),
    reason: zod_1.z.string(),
});
async function authRoutes(fastify) {
    fastify.get('/', async () => {
        return { message: 'Auth API root' };
    });
    // Login
    fastify.post('/login', async (request, reply) => {
        try {
            const { username, password } = loginSchema.parse(request.body);
            const normalizedUsername = username.toLowerCase().trim();
            const user = await prisma_js_1.default.user.findUnique({
                where: { username: normalizedUsername },
                include: { roleRelation: true }
            });
            if (!user) {
                return reply.status(401).send({ message: 'Неверное имя пользователя или пароль' });
            }
            if (!user.isActive) {
                return reply.status(403).send({ message: 'Аккаунт деактивирован' });
            }
            const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
            if (!isPasswordValid) {
                return reply.status(401).send({ message: 'Неверное имя пользователя или пароль' });
            }
            const token = fastify.jwt.sign({
                id: user.id,
                role: user.role,
                username: user.username
            });
            // Update last login
            await prisma_js_1.default.user.update({
                where: { id: user.id },
                data: { lastLogin: new Date() },
            });
            const { password: _, ...userWithoutPassword } = user;
            return { token, user: userWithoutPassword };
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({ message: 'Ошибка валидации', errors: error.errors });
            }
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Ошибка сервера' });
        }
    });
    // Register (Admin only or system use)
    fastify.post('/register', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        const currentUser = request.user;
        if (currentUser.role !== 'admin') {
            return reply.status(403).send({ message: 'Только администратор может регистрировать пользователей' });
        }
        try {
            const data = registerSchema.parse(request.body);
            const existingUser = await prisma_js_1.default.user.findFirst({
                where: {
                    OR: [
                        { username: data.username },
                        { email: data.email }
                    ]
                }
            });
            if (existingUser) {
                return reply.status(400).send({ message: 'Пользователь с таким именем или email уже существует' });
            }
            if (!data.password) {
                return reply.status(400).send({ message: 'Пароль обязателен для регистрации' });
            }
            const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
            // Sync role and roleId
            const userData = { ...data };
            if (userData.role && !userData.roleId) {
                userData.roleId = userData.role;
            }
            else if (userData.roleId && !userData.role) {
                userData.role = userData.roleId;
            }
            // Set default showGreeting based on role if not provided
            if (userData.showGreeting === undefined) {
                userData.showGreeting = (userData.role === 'admin' || userData.role === 'technician');
            }
            const user = await prisma_js_1.default.user.create({
                data: {
                    ...userData,
                    password: hashedPassword,
                },
            });
            const { password: _, ...userWithoutPassword } = user;
            return reply.status(201).send(userWithoutPassword);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({ message: 'Ошибка валидации', errors: error.errors });
            }
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Ошибка сервера' });
        }
    });
    // Request Registration
    fastify.post('/request-registration', async (request, reply) => {
        try {
            const data = registrationRequestSchema.parse(request.body);
            const existingRequest = await prisma_js_1.default.registrationRequest.findFirst({
                where: { email: data.email, status: 'pending' }
            });
            if (existingRequest) {
                return reply.status(400).send({ message: 'Заявка с таким email уже находится на рассмотрении' });
            }
            const registrationRequest = await prisma_js_1.default.registrationRequest.create({
                data
            });
            // Notify admins through socket
            if (fastify.io) {
                fastify.io.emit('new_registration_request', registrationRequest);
            }
            return reply.status(201).send(registrationRequest);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({ message: 'Ошибка валидации', errors: error.errors });
            }
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Ошибка сервера' });
        }
    });
    // Get Registration Requests (Admin only)
    fastify.get('/registration-requests', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        const user = request.user;
        if (user.role !== 'admin') {
            return reply.status(403).send({ message: 'Доступ запрещен' });
        }
        const requests = await prisma_js_1.default.registrationRequest.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return requests;
    });
    // Update Registration Request Status (Admin only)
    fastify.patch('/registration-requests/:id', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        const user = request.user;
        if (user.role !== 'admin') {
            return reply.status(403).send({ message: 'Доступ запрещен' });
        }
        try {
            const { id } = request.params;
            const { status } = request.body;
            if (!['approved', 'rejected', 'pending'].includes(status)) {
                return reply.status(400).send({ message: 'Неверный статус' });
            }
            const updated = await prisma_js_1.default.registrationRequest.update({
                where: { id },
                data: { status }
            });
            return updated;
        }
        catch (error) {
            fastify.log.error(error);
            if (error.code === 'P2025') {
                return reply.status(404).send({ message: 'Заявка не найдена' });
            }
            return reply.status(500).send({ message: 'Ошибка сервера' });
        }
    });
    // Delete Registration Request (Admin only)
    fastify.delete('/registration-requests/:id', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        const user = request.user;
        if (user.role !== 'admin') {
            return reply.status(403).send({ message: 'Доступ запрещен' });
        }
        try {
            const { id } = request.params;
            await prisma_js_1.default.registrationRequest.delete({
                where: { id }
            });
            return { success: true };
        }
        catch (error) {
            fastify.log.error(error);
            if (error.code === 'P2025') {
                return reply.status(404).send({ message: 'Заявка не найдена' });
            }
            return reply.status(500).send({ message: 'Ошибка сервера' });
        }
    });
    // Get current user profile
    fastify.get('/me', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        const decodedUser = request.user;
        const user = await prisma_js_1.default.user.findUnique({
            where: { id: request.user.id },
            include: { roleRelation: true }
        });
        if (!user) {
            return reply.status(404).send({ message: 'Пользователь не найден' });
        }
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    });
}
