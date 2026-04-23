import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import prisma from '../lib/prisma.js';
import { z } from 'zod';

const kbArticleSchema = z.object({
  title: z.string().min(5),
  content: z.string().min(10),
  category: z.string(),
  tags: z.array(z.string()).optional(),
});

export default async function knowledgeRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  // List all articles
  fastify.get('/', {
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
    const { id } = request.params as { id: string };
    
    // Increment views
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
  });

  // Create article (Admin/Technician)
  fastify.post('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const user = request.user as any;
    if (user.role === 'user') {
      return reply.status(403).send({ message: 'Недостаточно прав для создания инструкций' });
    }

    try {
      const data = kbArticleSchema.parse(request.body);
      const article = await prisma.kBArticle.create({
        data: {
          ...data,
          authorId: user.id
        }
      });
      return reply.status(201).send(article);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Ошибка валидации', errors: error.errors });
      }
      return reply.status(500).send({ message: 'Ошибка сервера' });
    }
  });

  // Update article
  fastify.patch('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const user = request.user as any;
    const { id } = request.params as { id: string };

    const article = await prisma.kBArticle.findUnique({ where: { id } });
    if (!article) return reply.status(404).send({ message: 'Статья не найдена' });

    if (user.role !== 'admin' && article.authorId !== user.id) {
      return reply.status(403).send({ message: 'Вы можете редактировать только свои статьи' });
    }

    try {
      const data = kbArticleSchema.partial().parse(request.body);
      const updated = await prisma.kBArticle.update({
        where: { id },
        data
      });
      return updated;
    } catch (error: any) {
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
