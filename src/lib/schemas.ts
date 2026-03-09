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

export const inventorySchema = z.object({
  sku: z.string().min(1, 'Артикул обязателен'),
  name: z.string().min(2, 'Название должно содержать минимум 2 символа'),
  category: z.enum(['spare_parts', 'consumables', 'equipment', 'tools', 'other']),
  description: z.string().optional(),
  quantity: z.number().min(0, 'Количество не может быть отрицательным'),
  minQuantity: z.number().min(0, 'Минимальное количество не может быть отрицательным'),
  unit: z.enum(['pcs', 'kg', 'l', 'm', 'box']),
  location: z.string().min(1, 'Местоположение обязательно'),
  supplier: z.string().optional(),
  price: z.number().min(0, 'Цена не может быть отрицательной').optional(),
});

export type InventoryFormValues = z.infer<typeof inventorySchema>;

export const documentSchema = z.object({
  title: z.string().min(3, 'Заголовок должен содержать минимум 3 символа'),
  type: z.enum(['act', 'repair', 'maintenance', 'inventory', 'other']),
  status: z.enum(['draft', 'active', 'archived']),
  description: z.string().optional(),
  number: z.string().optional(), // Номер часто генерируется сервером
  equipmentName: z.string().optional(),
  equipmentLocation: z.string().optional(),
  repairDate: z.date().optional(),
  repairCost: z.number().min(0).optional(),
  partsUsed: z.string().optional(), // В форме это строка, которую потом парсят
});

export type DocumentFormValues = z.infer<typeof documentSchema>;
