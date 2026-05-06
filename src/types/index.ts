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
  departmentId?: string; // Link to department
  avatarHistory?: string[];
  isActive?: boolean;
  isOnline?: boolean;
  notificationsEnabled?: boolean;
  aiEnabled?: boolean;
  showGreeting?: boolean;
  greetingText?: string;
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
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: User;
  assigneeId?: string | null;
  assignee?: User;
  comments: Comment[];
  _count?: {
    comments: number;
  };
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
  equipmentId?: string; // Связь с оборудованием
  equipmentName?: string;
  equipmentLocation?: string;
  repairDate?: string;
  repairCost?: number;
  partsUsed?: string[];
  files?: { name: string; url: string; size?: number }[];
  createdAt: string;
  updatedAt: string;
  author: User;
}

// ===== ЛОКАЦИИ И ОБОРУДОВАНИЕ =====
export interface Building {
  id: string;
  name: string; // Например, "Корпус А", "Корпус Б"
  order?: number;
  width?: number;
}

export interface Department {
  id: string;
  name: string; // Например, "Терапия", "Хирургия"
  buildingId?: string; // Optional building
  icon?: string; // Lucide icon name
  color?: string; // Hex color
}

export interface Floor {
  id: string;
  buildingId: string;
  number: number; // Этаж
}

export interface Cabinet {
  id: string;
  buildingId: string;
  floorId: string;
  departmentId?: string; // Связь с отделением
  name: string; // Номер или название кабинета
  order?: number;
}

export interface Equipment {
  id: string;
  name: string; // Например, "Hamilton C3"
  model: string;
  serialNumber?: string;
  inventoryNumber?: string; // Добавлено инвентарный номер
  tag?: string;
  comment?: string;
  fileUrl?: string;
  status: string;
  cabinetId: string; // Текущее местоположение
  buildingId?: string;
  floorId?: string;
  departmentId?: string;
  cabinet?: Cabinet; // Добавлено связь с кабинетом
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
  isPinned?: boolean;
  isHidden?: boolean;
  isMuted?: boolean;
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
  description?: string;
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

// ===== БАЗА ЗНАНИЙ (Knowledge Base) =====
export type KBArticleCategory = 'software' | 'network' | 'printer' | 'common' | 'security';

export interface KBArticle {
  id: string;
  title: string;
  category: KBArticleCategory;
  description: string;
  content: string; // Markdown или HTML
  steps: { id: string; order: number; title: string; description: string }[];
  tags: string[];
  successRate: number;
  views: number;
  createdAt: string;
  updatedAt: string;
  author: User;
}

// ===== ТЕХНИЧЕСКИЕ ИНСТРУКЦИИ (Equipment Guides) =====
export interface TechnicalGuide {
  id: string;
  title: string;
  description: string;
  equipmentModels: string[]; // Например, ["Hamilton C3"]
  fileUrls: { name: string; url: string; type: 'pdf' | 'doc' | 'image' }[];
  createdAt: string;
  updatedAt: string;
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
  category?: KBArticleCategory;
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
export const kbArticleCategoryLabels: Record<KBArticleCategory, string> = {
  software: 'ПО',
  network: 'Сеть',
  printer: 'Принтеры',
  security: 'Безопасность',
  common: 'Общее',
};
