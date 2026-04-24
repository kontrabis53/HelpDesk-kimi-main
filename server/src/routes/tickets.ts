import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import prisma from '../lib/prisma.js';
import { z } from 'zod';

const ticketSchema = z.object({
  title: z.string().min(5),
  description: z.string(),
  category: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
});

const updateTicketSchema = z.object({
  status: z.enum(['new', 'in_progress', 'waiting', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assigneeId: z.string().optional().nullable(),
});

const commentSchema = z.object({
  text: z.string().min(1),
});

export default async function ticketRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  // List all tickets
  fastify.get('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const tickets = await prisma.ticket.findMany({
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
    const { id } = request.params as { id: string };
    const ticket = await prisma.ticket.findUnique({
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
      const user = request.user as any;

      // Generate a simple ticket number
      const count = await prisma.ticket.count();
      const number = `#${1000 + count + 1}`;

      const ticket = await prisma.ticket.create({
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
    } catch (error: any) {
      if (error instanceof z.ZodError) {
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
      const { id } = request.params as { id: string };
      const user = request.user as any;
      const data = updateTicketSchema.parse(request.body);

      // Check if ticket exists and get author
      const existingTicket = await prisma.ticket.findUnique({ where: { id } });
      if (!existingTicket) {
        return reply.status(404).send({ message: 'Заявка не найдена' });
      }

      // Permission check: only admin, technician, or the author (if only changing status to closed) can update
      if (user.role === 'user' && existingTicket.authorId !== user.id) {
        return reply.status(403).send({ message: 'Нет прав на редактирование этой заявки' });
      }

      const ticket = await prisma.ticket.update({
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

      return ticket;
    } catch (error: any) {
      return reply.status(500).send({ message: 'Ошибка при обновлении заявки' });
    }
  });

  // Add comment
  fastify.post('/:id/comments', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { id: ticketId } = request.params as { id: string };
      const { text } = commentSchema.parse(request.body);
      const user = request.user as any;

      const comment = await prisma.comment.create({
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

      return reply.status(201).send(comment);
    } catch (error: any) {
      return reply.status(500).send({ message: 'Ошибка при добавлении комментария' });
    }
  });
}
