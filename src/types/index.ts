// Типы для системы Медин

// ===== ЗАЯВКИ =====
export type TicketStatus = 'new' | 'in_progress' | 'waiting' | 'resolved' | 'cancelled';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketCategory = 'hardware' | 'software' | 'network' | 'printer' | 'other';

export interface User {
  id: string;
  name: string;
  avatar?: string;
  role: 'user' | 'technician' | 'admin';
  department: string;
}

export interface Comment {
  id: string;
  author: User;
  text: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  number: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  author: User;
  assignee?: User;
  comments: Comment[];
}

export interface TicketFilter {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  search?: string;
}

// ===== ДОКУМЕНТЫ =====
export type DocumentType = 'act' | 'repair' | 'maintenance' | 'inventory' | 'other';
export type DocumentStatus = 'draft' | 'active' | 'archived';

export interface Document {
  id: string;
  number: string;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  description: string;
  equipmentName?: string;
  equipmentLocation?: string;
  repairDate?: string;
  repairCost?: number;
  partsUsed?: string[];
  fileUrl?: string;
  fileName?: string;
  createdAt: string;
  updatedAt: string;
  author: User;
}

// ===== СКЛАД =====
export type InventoryCategory = 'spare_parts' | 'consumables' | 'equipment' | 'tools' | 'other';
export type InventoryUnit = 'pcs' | 'kg' | 'l' | 'm' | 'box';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: InventoryCategory;
  description: string;
  quantity: number;
  minQuantity: number;
  unit: InventoryUnit;
  location: string;
  supplier?: string;
  price?: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  item: InventoryItem;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  ticketId?: string;
  documentId?: string;
  createdAt: string;
  author: User;
}

// ===== БАЗА ЗНАНИЙ =====
export type GuideCategory = 'hardware' | 'software' | 'network' | 'printer' | 'common';

export interface GuideStep {
  id: string;
  order: number;
  title: string;
  description: string;
  imageUrl?: string;
}

export interface KnowledgeGuide {
  id: string;
  title: string;
  category: GuideCategory;
  description: string;
  tags: string[];
  steps: GuideStep[];
  successRate: number;
  views: number;
  createdAt: string;
  updatedAt: string;
  author: User;
}

// ===== МЕТКИ =====
export const statusLabels: Record<TicketStatus, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  waiting: 'Ожидание',
  resolved: 'Решена',
  cancelled: 'Отменена',
};

export const priorityLabels: Record<TicketPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  critical: 'Критический',
};

export const categoryLabels: Record<TicketCategory, string> = {
  hardware: 'Оборудование',
  software: 'ПО',
  network: 'Сеть',
  printer: 'Принтер',
  other: 'Другое',
};

export const statusColors: Record<TicketStatus, string> = {
  new: 'bg-blue-500',
  in_progress: 'bg-amber-500',
  waiting: 'bg-violet-500',
  resolved: 'bg-emerald-500',
  cancelled: 'bg-slate-400',
};

export const priorityColors: Record<TicketPriority, string> = {
  low: 'bg-slate-400',
  medium: 'bg-blue-500',
  high: 'bg-amber-500',
  critical: 'bg-red-500',
};

// Документы
export const documentTypeLabels: Record<DocumentType, string> = {
  act: 'Акт',
  repair: 'Ремонт',
  maintenance: 'Обслуживание',
  inventory: 'Инвентаризация',
  other: 'Другое',
};

export const documentStatusLabels: Record<DocumentStatus, string> = {
  draft: 'Черновик',
  active: 'Активен',
  archived: 'В архиве',
};

// Склад
export const inventoryCategoryLabels: Record<InventoryCategory, string> = {
  spare_parts: 'Запчасти',
  consumables: 'Расходники',
  equipment: 'Оборудование',
  tools: 'Инструменты',
  other: 'Другое',
};

export const inventoryUnitLabels: Record<InventoryUnit, string> = {
  pcs: 'шт',
  kg: 'кг',
  l: 'л',
  m: 'м',
  box: 'кор',
};

// База знаний
export const guideCategoryLabels: Record<GuideCategory, string> = {
  hardware: 'Оборудование',
  software: 'ПО',
  network: 'Сеть',
  printer: 'Принтер',
  common: 'Общее',
};
