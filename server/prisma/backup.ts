import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Начало создания точки сохранения (бэкапа)...');

  try {
    const users = await prisma.user.findMany();
    const directory = await prisma.directoryEntry.findMany();
    const inventory = await prisma.inventoryItem.findMany();
    const knowledge = await prisma.kBArticle.findMany();
    const documents = await prisma.document.findMany();
    const roles = await prisma.role.findMany();

    const backupData = {
      timestamp: new Date().toISOString(),
      users,
      directory,
      inventory,
      knowledge,
      documents,
      roles
    };

    const backupPath = path.join(__dirname, 'backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

    console.log(`Точка сохранения успешно создана: ${backupPath}`);
    console.log(`Сохранено: ${users.length} пользователей, ${directory.length} записей справочника.`);
  } catch (error) {
    console.error('Ошибка при создании бэкапа:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
