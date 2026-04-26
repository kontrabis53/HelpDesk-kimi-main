import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('ВНИМАНИЕ: Начинается полный сброс базы данных к заводским настройкам...');

  // 1. Очистка ВСЕХ данных
  await prisma.chatMessage.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.document.deleteMany();
  await prisma.kBArticle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.directoryEntry.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.registrationRequest.deleteMany();
  try {
    // @ts-ignore
    await prisma.role.deleteMany();
  } catch (e) {}

  console.log('Все таблицы очищены.');

  const defaultRoles = [
    {
      id: 'user',
      name: 'Пользователь',
      description: 'Базовый доступ - создание заявок и просмотр базы знаний',
      color: '#10B981',
      isSystem: true,
      permissions: [
        { moduleId: 'knowledge', canView: true, canCreate: false, canEdit: false, canDelete: false },
        { moduleId: 'tickets', canView: true, canCreate: true, canEdit: false, canDelete: false },
        { moduleId: 'documents', canView: false, canCreate: false, canEdit: false, canDelete: false },
        { moduleId: 'inventory', canView: false, canCreate: false, canEdit: false, canDelete: false },
        { moduleId: 'directory', canView: true, canCreate: false, canEdit: false, canDelete: false },
        { moduleId: 'chat', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { moduleId: 'parser', canView: false, canCreate: false, canEdit: false, canDelete: false },
        { moduleId: 'admin', canView: false, canCreate: false, canEdit: false, canDelete: false },
        { moduleId: 'profile', canView: true, canCreate: true, canEdit: true, canDelete: false },
        { moduleId: 'guides', canView: true, canCreate: false, canEdit: false, canDelete: false },
      ],
    },
    {
      id: 'admin',
      name: 'Администратор',
      description: 'Полный доступ ко всем модулям и настройкам системы',
      color: '#8B5CF6',
      isSystem: true,
      permissions: [
        { moduleId: 'knowledge', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { moduleId: 'tickets', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { moduleId: 'documents', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { moduleId: 'inventory', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { moduleId: 'directory', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { moduleId: 'chat', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { moduleId: 'parser', canView: true, canCreate: false, canEdit: false, canDelete: false },
        { moduleId: 'admin', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { moduleId: 'profile', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { moduleId: 'guides', canView: true, canCreate: true, canEdit: true, canDelete: true },
      ],
    },
    {
      id: 'technician',
      name: 'Технический специалист',
      description: 'Доступ к заявкам, базе знаний и складу',
      color: '#3B82F6',
      isSystem: true,
      permissions: [
        { moduleId: 'knowledge', canView: true, canCreate: true, canEdit: true, canDelete: false },
        { moduleId: 'tickets', canView: true, canCreate: true, canEdit: true, canDelete: false },
        { moduleId: 'documents', canView: true, canCreate: true, canEdit: true, canDelete: false },
        { moduleId: 'inventory', canView: true, canCreate: true, canEdit: true, canDelete: false },
        { moduleId: 'directory', canView: true, canCreate: true, canEdit: true, canDelete: false },
        { moduleId: 'chat', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { moduleId: 'parser', canView: true, canCreate: false, canEdit: false, canDelete: false },
        { moduleId: 'admin', canView: false, canCreate: false, canEdit: false, canDelete: false },
        { moduleId: 'profile', canView: true, canCreate: true, canEdit: true, canDelete: false },
        { moduleId: 'guides', canView: true, canCreate: true, canEdit: true, canDelete: false },
      ],
    },
    {
      id: 'viewer',
      name: 'Наблюдатель',
      description: 'Только просмотр заявок и базы знаний',
      color: '#6B7280',
      isSystem: true,
      permissions: [
        { moduleId: 'knowledge', canView: true, canCreate: false, canEdit: false, canDelete: false },
        { moduleId: 'tickets', canView: true, canCreate: false, canEdit: false, canDelete: false },
        { moduleId: 'documents', canView: false, canCreate: false, canEdit: false, canDelete: false },
        { moduleId: 'inventory', canView: false, canCreate: false, canEdit: false, canDelete: false },
        { moduleId: 'directory', canView: true, canCreate: false, canEdit: false, canDelete: false },
        { moduleId: 'chat', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { moduleId: 'parser', canView: false, canCreate: false, canEdit: false, canDelete: false },
        { moduleId: 'admin', canView: false, canCreate: false, canEdit: false, canDelete: false },
        { moduleId: 'profile', canView: true, canCreate: false, canEdit: true, canDelete: false },
        { moduleId: 'guides', canView: true, canCreate: false, canEdit: false, canDelete: false },
      ],
    },
  ];

  for (const role of defaultRoles) {
    // @ts-ignore
    await prisma.role.create({ data: role });
  }

  const hashedPassword = await bcrypt.hash('password', 10);

  const usersData = [
    {
      id: 'u1',
      username: 'admin',
      password: hashedPassword,
      name: 'Иванов Иван Иванович',
      email: 'ivan@medin.ru',
      roleId: 'admin',
      position: 'Системный администратор',
      department: 'Технический отдел',
      isActive: true,
      showGreeting: true,
      greetingText: 'Шо ты маленький, привет',
    },
    {
      id: 'u2',
      username: 'petr',
      password: hashedPassword,
      name: 'Петров Петр Петрович',
      email: 'petr@medin.ru',
      roleId: 'technician',
      position: 'Инженер по медоборудованию',
      department: 'Технический отдел',
      isActive: true,
      showGreeting: true,
      greetingText: 'Шо ты маленький, привет',
    }
  ];

  for (const user of usersData) {
    await prisma.user.create({ data: user });
  }

  console.log('Сброс завершен. База данных возвращена к начальному состоянию.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
