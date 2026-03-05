import { z } from 'zod';

export const ticketSchema = z.object({
  title: z.string().min(3, 'Заголовок должен содержать минимум 3 символа'),
  description: z.string().min(10, 'Описание должно содержать минимум 10 символов'),
  category: z.enum(['hardware', 'software', 'network', 'printer', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  assigneeId: z.string().optional(),
});

export type TicketFormValues = z.infer<typeof ticketSchema>;

export const guideSchema = z.object({
  title: z.string().min(3, 'Заголовок должен содержать минимум 3 символа'),
  description: z.string().min(10, 'Описание должно содержать минимум 10 символов'),
  category: z.enum(['hardware', 'software', 'network', 'printer', 'common']),
  tags: z.string(),
});

export type GuideFormValues = z.infer<typeof guideSchema>;
