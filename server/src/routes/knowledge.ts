import { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma.js';

// Кэш для предотвращения повторных инкрементов (userId + articleId)
const viewCache = new Map<string, number>();
const CACHE_TTL = 30 * 60 * 1000; // 30 минут

export default async function knowledgeRoutes(fastify: FastifyInstance) {

  // Очистка кэша раз в час
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of viewCache.entries()) {
      if (now - timestamp > CACHE_TTL) viewCache.delete(key);
    }
  }, 60 * 60 * 1000);
  
  // List all articles
  fastify.get('', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const articles = await prisma.kBArticle.findMany({
      include: {
        author: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return articles;
  });

  // Get article by ID
  fastify.get('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const user = request.user as any;
      const cacheKey = `${user.id}:${id}`;
      const now = Date.now();

      // Проверяем, был ли инкремент недавно
      const lastView = viewCache.get(cacheKey);
      
      if (!lastView || (now - lastView > CACHE_TTL)) {
        // Делаем инкремент ТОЛЬКО ТУТ и только если нет в кэше
        viewCache.set(cacheKey, now);
        fastify.log.info(`[KB] Real increment for ${cacheKey}`);
        
        const article = await prisma.kBArticle.update({
          where: { id },
          data: { views: { increment: 1 } },
          include: {
            author: {
              select: { id: true, name: true, position: true }
            }
          }
        });

        if (!article) {
          return reply.status(404).send({ message: 'Статья не найдена' });
        }

        return article;
      }

      // Если в кэше есть — просто отдаем данные без инкремента
      fastify.log.info(`[KB] Suppressed double increment for ${cacheKey}`);
      const article = await prisma.kBArticle.findUnique({
        where: { id },
        include: {
          author: {
            select: { id: true, name: true, position: true }
          }
        }
      });

      if (!article) {
        return reply.status(404).send({ message: 'Статья не найдена' });
      }

      return article;
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Ошибка сервера' });
    }
  });

  // Create article (Admin/Technician)
  fastify.post('', {
    onRequest: [fastify.authenticate],
    preHandler: async (request, reply) => {
      fastify.log.info({ body: request.body }, 'Knowledge POST preHandler');
    }
  }, async (request, reply) => {
    const user = request.user as any;
    if (user.role === 'user') {
      return reply.status(403).send({ message: 'Недостаточно прав для создания инструкций' });
    }

    try {
      const body = request.body as any;
      fastify.log.info({ kbBody: body }, 'Attempting to create KB article');
      
      const article = await prisma.kBArticle.create({
        data: {
          title: String(body.title || 'Без заголовка'),
          description: String(body.description || ''),
          content: String(body.description || body.title || ''),
          category: String(body.category || 'common'),
          tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
          steps: Array.isArray(body.steps) ? body.steps : [],
          authorId: user.id
        }
      });
      return reply.status(201).send(article);
    } catch (error: any) {
      fastify.log.error(error, 'Knowledge creation error');
      return reply.status(500).send({ message: 'Ошибка сервера при создании статьи', error: error.message });
    }
  });

  // Update article
  fastify.patch('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const user = request.user as any;
    const { id } = request.params as { id: string };

    try {
      const article = await prisma.kBArticle.findUnique({ where: { id } });
      if (!article) return reply.status(404).send({ message: 'Статья не найдена' });

      if (user.role !== 'admin' && article.authorId !== user.id) {
        return reply.status(403).send({ message: 'Вы можете редактировать только свои статьи' });
      }

      const body = request.body as any;
      const updateData: any = {};
      
      if (body.title !== undefined) updateData.title = String(body.title);
      if (body.description !== undefined) {
        updateData.description = String(body.description);
        updateData.content = String(body.description);
      }
      if (body.category !== undefined) updateData.category = String(body.category);
      if (body.tags !== undefined) updateData.tags = Array.isArray(body.tags) ? body.tags.map(String) : [];
      if (body.steps !== undefined) updateData.steps = Array.isArray(body.steps) ? body.steps : [];

      if (Object.keys(updateData).length === 0) {
        return reply.send(article);
      }

      const updated = await prisma.kBArticle.update({
        where: { id },
        data: updateData
      });
      return updated;
    } catch (error: any) {
      fastify.log.error(error, 'Knowledge update error');
      return reply.status(500).send({ message: 'Ошибка при обновлении' });
    }
  });

  // Delete article
  fastify.delete('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const user = request.user as any;
    const { id } = request.params as { id: string };

    const article = await prisma.kBArticle.findUnique({ where: { id } });
    if (!article) return reply.status(404).send({ message: 'Статья не найдена' });

    if (user.role !== 'admin' && article.authorId !== user.id) {
      return reply.status(403).send({ message: 'Вы можете удалять только свои статьи' });
    }

    await prisma.kBArticle.delete({ where: { id } });
    return { success: true };
  });
}
