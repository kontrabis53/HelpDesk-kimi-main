import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Начало наполнения базы данных...');

  // 1. Очистка существующих данных
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.document.deleteMany();
  await prisma.user.deleteMany();
  await prisma.directoryEntry.deleteMany();
  await prisma.inventoryItem.deleteMany();

  const hashedPassword = await bcrypt.hash('password', 10);

  // 2. Создание пользователей
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      name: 'Иванов Иван Иванович',
      email: 'ivan@medin.ru',
      role: 'admin',
      roleId: 'admin',
      position: 'Системный администратор',
      department: 'Технический отдел',
      isActive: true,
    },
  });

  const technician = await prisma.user.create({
    data: {
      username: 'petr',
      password: hashedPassword,
      name: 'Петров Петр Петрович',
      email: 'petr@medin.ru',
      role: 'technician',
      roleId: 'technician',
      position: 'Инженер по медоборудованию',
      department: 'Технический отдел',
      isActive: true,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      username: 'anna',
      password: hashedPassword,
      name: 'Васильева Анна Сергеевна',
      email: 'anna@medin.ru',
      role: 'user',
      roleId: 'user',
      position: 'Зав. отделением',
      department: 'Терапия',
      isActive: true,
    },
  });

  console.log('Пользователи созданы');

  // 3. Создание заявок (Tickets)
  await prisma.ticket.create({
    data: {
      number: '#1001',
      title: 'Не работает принтер в кабинете 205',
      description: 'Принтер не печатает документы, горит красная лампочка. Нужна срочная помощь.',
      category: 'printer',
      priority: 'high',
      status: 'new',
      authorId: user1.id,
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      number: '#1002',
      title: 'Проблема с интернетом на ресепшн',
      description: 'Интернет периодически пропадает, страницы долго загружаются.',
      category: 'network',
      priority: 'medium',
      status: 'in_progress',
      authorId: technician.id,
      assigneeId: admin.id,
    },
  });

  // 4. Создание комментариев
  await prisma.comment.create({
    data: {
      text: 'Проверяю кабельное соединение',
      authorId: admin.id,
      ticketId: ticket2.id,
    },
  });

  console.log('Заявки и комментарии созданы');

  // 5. Создание записей в справочнике
  await prisma.directoryEntry.createMany({
    data: [
      {
        name: 'Абабий Галина Романовна',
        position: 'М/с ЛКО',
        department: 'Средний медицинский персонал',
        mobilePhone: '778-59683'
      },
      {
        name: 'Борцой Алла Ивановна',
        position: 'процедур.-первязоч.мед.сестра',
        department: 'Средний медицинский персонал',
        cabinet: '№404',
        internalPhone: '254',
        mobilePhone: '777-83593'
      }
    ]
  });

  console.log('Справочник наполнен');

  // 6. Инвентаризация
  await prisma.inventoryItem.createMany({
    data: [
      {
        sku: 'CRT-HP-85A',
        name: 'Картридж HP 85A (CE285A)',
        category: 'consumables',
        description: 'Оригинальный картридж для HP LaserJet Pro P1102, M1132, M1212',
        quantity: 12,
        minQuantity: 5,
        unit: 'pcs',
        location: 'Склад А, стеллаж 3',
        supplier: 'Техносила',
        price: 3200,
      },
      {
        sku: 'SSD-SAM-500',
        name: 'SSD Samsung 870 EVO 500GB',
        category: 'spare_parts',
        description: 'Твердотельный накопитель 2.5" SATA III',
        quantity: 8,
        minQuantity: 3,
        unit: 'pcs',
        location: 'Склад Б, стеллаж 4',
        supplier: 'Samsung',
        price: 5800,
      }
    ]
  });

  console.log('Инвентарь наполнен');

  console.log('База данных успешно наполнена!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
