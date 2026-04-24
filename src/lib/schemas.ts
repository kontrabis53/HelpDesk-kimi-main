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

// Фильтр Zalgo-символов, эмодзи и подозрительных спецсимволов
const noZalgoOrEmoji = (val: string) => {
  if (!val) return true;
  // Более строгий regex для Zalgo и комбинируемых символов
  // Включает основные диапазоны комбинируемых диакритических знаков
  const zalgoRegex = /[\u0300-\u036F\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F\u0483-\u0489\u20D0-\u20F0]/;
  // Эмодзи
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3297}\u{3299}]/u;
  
  // Если находим хоть один такой символ - возвращаем false
  if (zalgoRegex.test(val) || emojiRegex.test(val)) return false;

  // Дополнительная проверка на "чистоту" текста: разрешаем только буквы, цифры, пробелы и базовую пунктуацию
  // Это самый надежный способ против Zalgo
  const cleanTextRegex = /^[a-zA-Z0-9а-яА-ЯёЁ\s\-\.\,\(\)\/\"\'\№\!\?\+\=\:\;\[\]\{\}\<\>\@\#\$\%\^\&\*\_\\|]*$/;
  return cleanTextRegex.test(val);
};

export const inventorySchema = z.object({
  sku: z.string().min(1, 'Артикул обязателен'),
  name: z.string()
    .min(2, 'Название должно содержать минимум 2 символа')
    .max(100, 'Название слишком длинное')
    .refine(noZalgoOrEmoji, 'Название содержит недопустимые символы (Zalgo или эмодзи)'),
  category: z.enum(['spare_parts', 'consumables', 'equipment', 'tools', 'other']),
  description: z.string()
    .max(500, 'Описание слишком длинное')
    .refine(noZalgoOrEmoji, 'Описание содержит недопустимые символы (Zalgo или эмодзи)')
    .optional(),
  quantity: z.number()
    .min(-5000, 'Минимальное количество — -5 000 (пересорт)')
    .max(25000, 'Максимальное количество — 25 000'),
  minQuantity: z.number()
    .min(0, 'Минимальное количество не может быть отрицательным')
    .max(25000, 'Максимальное значение — 25 000'),
  unit: z.enum(['pcs', 'kg', 'l', 'm', 'box']),
  location: z.string().min(1, 'Местоположение обязательно'),
  supplier: z.string().optional(),
  price: z.number().min(0, 'Цена не может быть отрицательной').max(1000000, 'Цена слишком велика').optional(),
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
