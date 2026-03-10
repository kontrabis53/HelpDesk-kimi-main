// Типы для системы Медин

// ===== ЗАЯВКИ =====
export type TicketStatus = 'new' | 'in_progress' | 'waiting' | 'resolved' | 'cancelled';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketCategory = 'hardware' | 'software' | 'network' | 'printer' | 'other';

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  position?: string;
  role: 'user' | 'technician' | 'admin' | 'viewer' | 'manager'; // Added viewer and manager
  roleId: string; // Added for compatibility with RoleStore
  department: string;
  isActive?: boolean;
  createdAt?: string;
  lastLogin?: string;
  username?: string;
  password?: string;
}

export interface RegistrationRequest {
  id: string;
  name: string;
  email: string;
  department: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
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

// ===== СПРАВОЧНИК =====
export interface DirectoryEntry {
  id: string;
  name: string;
  position: string;
  department: string;
  cabinet: string;
  internalPhone: string;
  mobilePhone?: string;
  telegram?: string; // @username
  tags?: string[]; // search tags
}

export interface SearchStat {
  query: string;
  count: number;
  lastSearched: string;
}

// ===== ЧАТ =====
export type ChatType = 'direct' | 'group';

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string; // Display name (e.g., "Medin CC")
  senderRealName?: string; // Real person name (e.g., "Иван Иванов")
  text: string;
  timestamp: string;
}

export interface Chat {
  id: string;
  name: string;
  type: ChatType;
  participants: string[]; // user IDs or identifiers like 'Medin Reception'
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

// ===== ПАРСЕР =====
export interface Device {
  id: string;
  ipAddress: string;
  macAddress: string;
  hostname: string;
  status: 'online' | 'offline';
  lastSeen: string;
  os: string;
  openPorts: number[];
  services: string[];
  hasAppRunning: boolean; // запущен ли HelpDesk-kimi-main
}

export interface NetworkScanResult {
  timestamp: string;
  onlineDevices: number;
  totalDevices: number;
  devicesWithApp: number;
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

export interface DocumentFilter {
  type?: DocumentType;
  status?: DocumentStatus;
  search?: string;
}

export interface InventoryFilter {
  category?: InventoryCategory;
  lowStock?: boolean;
  search?: string;
}

export interface KnowledgeFilter {
  category?: GuideCategory;
  search?: string;
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
