import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Проверка и восстановление базовых данных...');

  // 1. Очистка данных УДАЛЕНА. Теперь мы только добавляем недостающее или обновляем системное.
  // Если вы хотите полностью сбросить базу, используйте npm run prisma:reset-hard

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
    try {
      // @ts-ignore
      await prisma.role.upsert({
        where: { id: role.id },
        update: { permissions: role.permissions, name: role.name, description: role.description },
        create: role
      });
    } catch (e) {
      console.error(`Ошибка при восстановлении роли ${role.id}:`, e);
    }
  }
  console.log('Роли проверены/обновлены');

  const hashedPassword = await bcrypt.hash('password', 10);

  // 2. Восстановление только АДМИНОВ и ТЕХНИКОВ как пользователей CRM
  const usersData = [
    {
      username: 'admin',
      password: hashedPassword,
      name: 'Иванов Иван Иванович',
      email: 'ivan@medin.ru',
      role: 'admin',
      roleId: 'admin',
      position: 'Системный администратор',
      department: 'Технический отдел',
      isActive: true,
      isOnline: false,
      showGreeting: true,
      greetingText: 'Шо ты маленький, привет',
    },
    {
      name: 'Петров Петр Петрович',
      email: 'petr@medin.ru',
      role: 'technician',
      roleId: 'technician',
      position: 'Инженер по медоборудованию',
      department: 'Технический отдел',
      isActive: true,
      isOnline: false,
      showGreeting: true,
      greetingText: 'Шо ты маленький, привет',
      username: 'petr',
      password: hashedPassword,
    },
    {
      name: 'Сидоров Алексей',
      email: 'alexey@medin.ru',
      role: 'technician',
      roleId: 'technician',
      position: 'Техник',
      department: 'Технический отдел',
      isActive: true,
      isOnline: false,
      showGreeting: true,
      greetingText: 'Шо ты маленький, привет',
      username: 'alexey',
      password: hashedPassword,
    }
  ];

  for (const user of usersData) {
    try {
      const notificationsEnabled = (user.roleId === 'admin' || user.roleId === 'technician');

      await prisma.user.upsert({
        where: { username: user.username },
        update: {
            role: user.role,
            roleId: user.roleId,
            notificationsEnabled: notificationsEnabled
          },
          create: {
            ...user,
            notificationsEnabled: notificationsEnabled
          },
      });
      console.log(`Пользователь ${user.username} проверен/обновлен`);
    } catch (e: any) {
      if (e.code === 'P2002') {
        // Just log the conflict, don't try to force updates by email to avoid data loss/accidental merges
        console.warn(`Пропуск пользователя ${user.username}: конфликт уникальности (${e.meta?.target})`);
      } else {
        console.error(`Ошибка при обновлении пользователя ${user.username}:`, e);
      }
    }
  }
  console.log('Базовые пользователи проверены');

  // 3. Восстановление справочника сотрудников (БЕЗ создания их как пользователей CRM)
  // Для справочника используем логику "добавить если нет по имени"
  const directoryData = [
    { name: 'Абабий Галина Романовна', position: 'М/с ЛКО', department: 'Средний медицинский персонал', mobilePhone: '778-59683' },
    { name: 'Борцой Алла Ивановна', position: 'процедур.-первязоч.мед.сестра', department: 'Средний медицинский персонал', cabinet: '№404', internalPhone: '254', mobilePhone: '777-83593' },
    { name: 'Будыгай Анастасия Григорьевна', position: 'м/с анестиз.реаним', department: 'Средний медицинский персонал', mobilePhone: '779-19509' },
    { name: 'Буланша Светлана Михайловна', position: 'М/с по массажу', department: 'Средний медицинский персонал', cabinet: '№107', internalPhone: '227', mobilePhone: '777-21495, 8-85-48' },
    { name: 'Войчишена (Каража) Виктория Евгеньевна', position: 'м/с', department: 'Средний медицинский персонал', mobilePhone: '775-37769' },
    { name: 'Ворникова Нина Васильевна', position: 'М/с', department: 'Средний медицинский персонал', mobilePhone: '0775-96487' },
    { name: 'Гарбуз Алина Олеговна', position: 'м/с анестиз.реаним', department: 'Средний медицинский персонал', cabinet: '№404', internalPhone: '254', mobilePhone: '779-73790' },
    { name: 'Герасимова Ирина Петря', position: 'М/с ЛКО', department: 'Средний медицинский персонал', mobilePhone: '777-14652' },
    { name: 'Грибанова Алена Дмитриевна', position: 'М/с ЛКО', department: 'Средний медицинский персонал', mobilePhone: '779-60691' },
    { name: 'Деменчак Ольга Викторовна', position: 'М/с УЗД', department: 'Средний медицинский персонал', cabinet: '№201', internalPhone: '210', mobilePhone: '779-07620' },
    { name: 'Дечук-Вит Кристиан Александрович', position: 'м*брат', department: 'Средний медицинский персонал', mobilePhone: '778-70628' },
    { name: 'Епурь Наталья Сергеевна', position: 'медицинская сестра', department: 'Средний медицинский персонал', mobilePhone: '779-37807' },
    { name: 'Заболотная Анастасия Станиславовна', position: 'м/с каб.эндоскопии', department: 'Средний медицинский персонал', cabinet: '№104', internalPhone: '229', mobilePhone: '77551287' },
    { name: 'Заболотный Денис Станиславович', position: 'медицинский брат', department: 'Средний медицинский персонал', mobilePhone: '779-95309' },
    { name: 'Зинган Лилия Ивановна', position: 'М/с забора крови', department: 'Средний медицинский персонал', mobilePhone: '779-33229' },
    { name: 'Кирович Оксана Георгиевна', position: 'М/с УЗД', department: 'Средний медицинский персонал', cabinet: '209', internalPhone: '218', mobilePhone: '777-01520' },
    { name: 'Ковалева Светлана Аркадьевна', position: 'М/с по физиотерапии', department: 'Средний медицинский персонал', cabinet: '№108-111', internalPhone: '231', mobilePhone: '778-86876' },
    { name: 'Когут Ирина Олеговна', position: 'М/с ЛКО', department: 'Средний медицинский персонал', cabinet: '№204', internalPhone: '212', mobilePhone: '778-90233' },
    { name: 'Кошевая Елизавета Анатольевна', position: 'м/с', department: 'Средний медицинский персонал', mobilePhone: '778-72050' },
    { name: 'Кравец Наталья Юрьевна', position: 'М/с ФД', department: 'Средний медицинский персонал', cabinet: '№113, 114', internalPhone: '225', mobilePhone: '777-34878' },
    { name: 'Крец Татьяна Васильевна', position: 'Рентгенолаборант', department: 'Средний медицинский персонал', cabinet: '№12', internalPhone: '232', mobilePhone: '777-65497, 533-55256' },
    { name: 'Маевский Александр Юрьевич', position: 'операционный мед.брат', department: 'Средний медицинский персонал', cabinet: '№404', internalPhone: '254', mobilePhone: '778-96422, 5-00-12' },
    { name: 'Маковей Екатерина Радовна', position: 'м/с анестиз.реаним', department: 'Средний медицинский персонал', cabinet: '№404', internalPhone: '254', mobilePhone: '779-53275' },
    { name: 'Маринова Екатерина Сергеевна', position: 'М/с УЗД', department: 'Средний медицинский персонал', cabinet: '№207', internalPhone: '216', mobilePhone: '777-74800, 61376' },
    { name: 'Мыцыкова Татьяна Дмитриевна', position: 'М/с ЛКО', department: 'Средний медицинский персонал', mobilePhone: '778-64394, 557-23650' },
    { name: 'Нейковчена Степанида Георгиевна', position: 'М/с ЛКО', department: 'Средний медицинский персонал', mobilePhone: '779-83207' },
    { name: 'Некулица Кристина Вячеславовна', position: 'М/с ЛКО', department: 'Средний медицинский персонал', mobilePhone: '779-13664' },
    { name: 'Нигорица Александр Сергеевич', position: 'мед.брат анестезиол.и реанимац', department: 'Средний медицинский персонал', cabinet: '№404', internalPhone: '254', mobilePhone: '778-72281' },
    { name: 'Осетянов Максим Николаевич', position: 'м/б ЛКО', department: 'Средний медицинский персонал', mobilePhone: '779-94881' },
    { name: 'Плугарев Александр Иванович', position: 'м/б стомат.отд.', department: 'Средний медицинский персонал', mobilePhone: '779-72512' },
    { name: 'Разлован Наталья Георгиевна', position: 'М/с ЛКО', department: 'Средний медицинский персонал', cabinet: '№300', internalPhone: '242', mobilePhone: '777-21970' },
    { name: 'Рознован Маргарита Игорьевна', position: 'М/с ЛКО', department: 'Средний медицинский персонал', mobilePhone: '775-61476' },
    { name: 'Самойленко Юлия Сергеевна', position: 'Рентгенлаборант', department: 'Средний медицинский персонал', cabinet: '№5', internalPhone: '234', mobilePhone: '775-12956' },
    { name: 'Селецкий Вячеслав Вячеславович', position: 'Рентгенлаборант', department: 'Средний медицинский персонал', cabinet: '№5, 8', internalPhone: '234 (236)', mobilePhone: '779-76102' },
    { name: 'Стоянова Варвара Ильинична', position: 'М/с ЛКО', department: 'Средний медицинский персонал', mobilePhone: '779-33292' },
    { name: 'Татар Домника Константиновна', position: 'М/с ЛКО', department: 'Средний медицинский персонал', mobilePhone: '777-63487' },
    { name: 'Тростина Алина Юрьевна', position: 'м/с стомат.отд.', department: 'Средний медицинский персонал', mobilePhone: '778-76324' },
    { name: 'Унгурян Татьяна Ивановна', position: 'м/с ЛКО', department: 'Средний медицинский персонал', cabinet: '№210', internalPhone: '219', mobilePhone: '778-54777' },
    { name: 'Урека Емилия Алексеевна', position: 'Рентгенолаборант', department: 'Средний медицинский персонал', mobilePhone: '778-23343' },
    { name: 'Фрунза Анна Анатольевна', position: 'М/с ЛКО', department: 'Средний медицинский персонал', mobilePhone: '777-85281' },
    { name: 'Черниговская Лолита Дмитриевна', position: 'М/с ЛКО', department: 'Средний медицинский персонал', cabinet: '120 лабор', internalPhone: '223', mobilePhone: '777-35723' },
    { name: 'Чумак Снежана Георгиевна', position: 'М/С', department: 'Средний медицинский персонал', mobilePhone: '779-89831' },
    { name: 'Цуркан Екатерина Сергеевна', position: 'м/с', department: 'Средний медицинский персонал', cabinet: '№12', internalPhone: '232', mobilePhone: '775-41662' },
    { name: 'Якименко Инна Витальевна', position: 'м/с анестиз.реаним', department: 'Средний медицинский персонал', cabinet: '№404', internalPhone: '254', mobilePhone: '778-27026' },
    { name: 'Ярошенко Наталия Владимировна', position: 'М/с УЗД', department: 'Средний медицинский персонал', cabinet: '№206', internalPhone: '215', mobilePhone: '777-37911' },
    { name: 'Зоица Ирина Ивановна', position: 'Врач КЛД', department: 'КДЛ врачи', cabinet: '120 лаб.', internalPhone: '223', mobilePhone: '778-35152' },
    { name: 'Кристя Даниил Юрьевич', position: 'лаборант', department: 'КДЛ врачи', cabinet: '120 лаб.', internalPhone: '223', mobilePhone: '779-86189' },
    { name: 'Кристя Ольга Васильевна', position: 'лаборант', department: 'КДЛ врачи', cabinet: '120 лаб.', internalPhone: '223', mobilePhone: '779-44453' },
    { name: 'Матненко Анна Николаевна', position: 'Врач КЛД', department: 'КДЛ врачи', cabinet: '120 лаб.', internalPhone: '223', mobilePhone: '552-61649, 067174729' },
    { name: 'Привалова Юлия Викторовна', position: 'Врач КЛД', department: 'КДЛ врачи', cabinet: '120 лаб.', internalPhone: '223', mobilePhone: '777-03553' },
    { name: 'Скуртул Анна Виктровна', position: 'Врач КЛД', department: 'КДЛ врачи', cabinet: '120 лаб.', internalPhone: '223', mobilePhone: '778-53183' },
    { name: 'Смирнова Светлана Григорьевна', position: 'Заведующий КДЛ', department: 'КДЛ врачи', cabinet: '120 лаб.', internalPhone: '223', mobilePhone: '777-35458' },
    { name: 'Артеменко Ольга Михайловна', position: 'администратор', department: 'Регистратура', mobilePhone: '777-53677' },
    { name: 'Беженарь Каролина Васильевна', position: 'Менеджер - кассир', department: 'Регистратура', mobilePhone: '777-82210, 5-04-80' },
    { name: 'Белая Алина Сергеевна', position: 'Менеджер - кассир', department: 'Регистратура', mobilePhone: '777-75312' },
    { name: 'Борзенко Оксана Владимировна', position: 'администратор', department: 'Регистратура', mobilePhone: '777-51141' },
    { name: 'Вискушенко Анна Дмитриевна', position: 'Старший менеджер - кассир', department: 'Регистратура', mobilePhone: '777-67674' },
    { name: 'Дубина Наталья Юрьевна', position: 'Менеджер - кассир', department: 'Регистратура', mobilePhone: '778-91468' },
    { name: 'Евстратенко Марина Петровна', position: 'Менеджер - кассир', department: 'Регистратура', mobilePhone: '777-52225, 26702' },
    { name: 'Иванова Екатерина Григорьевна', position: 'Менеджер - кассир', department: 'Регистратура', mobilePhone: '778-90598' },
    { name: 'Камбур Татьяна Николаевна', position: 'Старший менеджер - кассир', department: 'Регистратура', mobilePhone: '778-30033' },
    { name: 'Карпова Ирина Валентина', position: 'Менеджер - кассир', department: 'Регистратура', mobilePhone: '777-50812' },
    { name: 'Костюк Таисия Андреевна', position: 'Менеджер - кассир', department: 'Регистратура', mobilePhone: '779-36096' },
    { name: 'Лесик Алена Сергеевна', position: 'Менеджер - кассир', department: 'Регистратура', mobilePhone: '775-29705' },
    { name: 'Михайлова Лилия Валерьевна', position: 'Менеджер - кассир', department: 'Регистратура', mobilePhone: '775-10570' },
    { name: 'Мунтяну Елена Семеновна', position: 'Старший менеджер - кассир', department: 'Регистратура', mobilePhone: '777-72494' },
    { name: 'Неженская Дина Степановна', position: 'Менеджер - кассир', department: 'Регистратура', mobilePhone: '777-08292' },
    { name: 'Николаева Анастасия Дмитриевна', position: 'Менеджер - кассир', department: 'Регистратура', mobilePhone: '778-42646' },
    { name: 'Пинчак Яна Юрьевна', position: 'администратор', department: 'Регистратура', mobilePhone: '779-80855' },
    { name: 'Попович Людмила Игоревна', position: 'Менеджер - кассир', department: 'Регистратура', mobilePhone: '778-00027, 47945' },
    { name: 'Попович Яна Вячеславовна', position: 'Менеджер - кассир', department: 'Регистратура', mobilePhone: '778-55082' },
    { name: 'Тарновская Елена Анатольевна', position: 'Менеджер - кассир', department: 'Регистратура', mobilePhone: '777-25737' },
    { name: 'Ткач Анастасия Андреевна', position: 'Менеджер - кассир', department: 'Регистратура', mobilePhone: '779-96214' },
    { name: 'Чешуина Лилия Степановна', position: 'Менеджер - кассир', department: 'Регистратура', mobilePhone: '779-94976' },
    { name: 'Бабенко Ирина Александровна', position: 'санитарка ХО', department: 'АХО', mobilePhone: '778-68179' },
    { name: 'Ганевич Александра Владимировна', position: 'Уборщица', department: 'АХО', mobilePhone: '777-12852' },
    { name: 'Грек Наталья Анатольевна', position: 'Уборщица', department: 'АХО', mobilePhone: '777-87898' },
    { name: 'Грибанова Сильвия Константиновна', position: 'Уборщица', department: 'АХО', mobilePhone: '775-45394' },
    { name: 'Дюльгер Ольга Ивановна', position: 'Уборщица', department: 'АХО', mobilePhone: '779-57472' },
    { name: 'Кичигина Марина Владимировна', position: 'санитарка ХО', department: 'АХО', mobilePhone: '777-32856' },
    { name: 'Колесникова Алла Владимировна', position: 'санитарка КДЛ', department: 'АХО', mobilePhone: '778-75193, 557-53373' },
    { name: 'Корженко Владимир Иванович', position: 'Охранник', department: 'АХО', internalPhone: '775-12171', mobilePhone: '552-67844, 777-95283' },
    { name: 'Мазанова Татьяна Федоровна', position: 'Уборщица', department: 'АХО', mobilePhone: '777-46894, 7-16-29' },
    { name: 'Новосельцева Альбина Гертрудовна', position: 'санитарка ХО', department: 'АХО', mobilePhone: '775-09188' },
    { name: 'Обручкова Любовь Николаевна', position: 'санитарка ХО', department: 'АХО', mobilePhone: '775-80627' },
    { name: 'Пелипенко Татьяна Петровна', position: 'Уборщица', department: 'АХО', internalPhone: '533-50177', mobilePhone: '777-86795' },
    { name: 'Ротарь Лариса Никаноровна', position: 'Уборщица', department: 'АХО', mobilePhone: '77584940' },
    { name: 'Скавронская Ольга Васильевна', position: 'Уборщица', department: 'АХО', mobilePhone: '778-62619' },
    { name: 'Степанов Олег Павлович', position: 'Охранник', department: 'АХО', internalPhone: '779-13859', mobilePhone: '775-60562' },
    { name: 'Стогорнюк Лилия Петровна', position: 'Уборщица', department: 'АХО', mobilePhone: '777-83501, 54396' },
    { name: 'Ткач Наталия Петровна', position: 'Уборщица', department: 'АХО', mobilePhone: '778-27270' },
    { name: 'Ткач Максим Николаевич', position: 'Охранник', department: 'АХО', internalPhone: '779-13859', mobilePhone: '779-74892' },
    { name: 'Чебан Иван Александрович', position: 'Охранник', department: 'АХО', internalPhone: '779-13859', mobilePhone: '776-04666' },
    { name: 'Чебан Галина Ивановна', position: 'Уборщица', department: 'АХО', mobilePhone: '778-69310, 557-53241' },
    { name: 'Чур Виталий Иванович', position: 'Охранник', department: 'АХО', internalPhone: '775-12171', mobilePhone: '777-70664' },
    { name: 'Бабенюк Яков Леонидович', position: 'Врач-рентгенолог', department: 'ДО врачи', cabinet: '№5', internalPhone: '234-63812', mobilePhone: '777-62822, 533-64311' },
    { name: 'Берневек Татьяна Сергеевна', position: 'Врач-рентгенолог', department: 'ДО врачи', cabinet: '№12', internalPhone: '232', mobilePhone: '777-61678' },
    { name: 'Боровская Татьяна Алексеевна', position: 'Врач УЗД', department: 'ДО врачи', cabinet: '№208', internalPhone: '217', mobilePhone: '777-14980' },
    { name: 'Волков Владимир Юрьевич', position: 'Врач УЗД-хирург', department: 'ДО врачи', cabinet: '№105', internalPhone: '224', mobilePhone: '777-24244' },
    { name: 'Иким Светлана Викторовна', position: 'Заведующий ДО', department: 'ДО врачи', cabinet: '№207', internalPhone: '216', mobilePhone: '777-18286' },
    { name: 'Лица Андрей Антонович', position: 'Врач-УЗД, хирург', department: 'ДО врачи', cabinet: '№105', internalPhone: '224', mobilePhone: '777-69194' },
    { name: 'Матушевский Виктор Александрович', position: 'Врач-эндоскопист', department: 'ДО врачи', cabinet: '№ 104', internalPhone: '229', mobilePhone: '775-85297' },
    { name: 'Могильдя Сильвиу Михайлович', position: 'Врач-эндоскопист', department: 'ДО врачи', cabinet: '№ 104', internalPhone: '229', mobilePhone: '37369053901' },
    { name: 'Синицын Станислав Евгеньевич', position: 'Врач-рентгенолог', department: 'ДО врачи', cabinet: '№12', internalPhone: '232', mobilePhone: '77998118' },
    { name: 'Трепак Андрей Ефимович', position: 'Врач ФД', department: 'ДО врачи', cabinet: '№113, 114', internalPhone: '225', mobilePhone: '779-05109' },
    { name: 'Чернышева Елена Аркадьевна', position: 'Врач-рентгенолог', department: 'ДО врачи', cabinet: '№8-12', internalPhone: '236-232', mobilePhone: '778-08248' },
    { name: 'Яровой Динис Вадимович', position: 'Врач УЗД', department: 'ДО врачи', cabinet: '№9, 208', internalPhone: '119-217', mobilePhone: '775-43857' },
    { name: 'Агафонов Игорь Дмитриевич', position: 'Врач-анестез.–реаниматолог', department: 'ЛКО врачи', cabinet: '№405', internalPhone: '255 (63-833)', mobilePhone: '778-76350' },
    { name: 'Андреева Алина Евгеньевна', position: 'врач-онколог', department: 'ЛКО врачи', cabinet: '№206', internalPhone: '215', mobilePhone: '779-81739' },
    { name: 'Бабаджанян Юлиана Арташевна', position: 'Врач-офтальмолог', department: 'ЛКО врачи', cabinet: '№212', internalPhone: '221', mobilePhone: '777-29792' },
  ];

  for (const entry of directoryData) {
    const existing = await prisma.directoryEntry.findFirst({ where: { name: entry.name } });
    if (!existing) {
      await prisma.directoryEntry.create({ data: entry });
    }
  }
  console.log('Справочник сотрудников проверен');

  // 4. Инвентарь (если нужно восстановить базу)
  const inventoryData = [
    { sku: 'MON-HP-24-001', name: 'Монитор HP 24"', category: 'monitors', description: '24 inch IPS display', quantity: 15, minQuantity: 5, unit: 'pcs', location: 'Склад А', supplier: 'HP Store', price: 12000 },
    { sku: 'PC-DELL-OPT-005', name: 'Системный блок Dell Optiplex', category: 'computers', description: 'Intel i5, 16GB RAM, 512GB SSD', quantity: 8, minQuantity: 2, unit: 'pcs', location: 'Склад А', supplier: 'Dell Russia', price: 45000 },
    { sku: 'PRN-KYOCERA-2040', name: 'МФУ Kyocera M2040dn', category: 'printers', description: 'Laser monochrome MFP', quantity: 3, minQuantity: 1, unit: 'pcs', location: 'Склад Б', supplier: 'Kyocera Center', price: 32000 },
    { sku: 'KBD-LOGI-K120', name: 'Клавиатура Logitech K120', category: 'peripherals', description: 'Wired USB keyboard', quantity: 25, minQuantity: 10, unit: 'pcs', location: 'Склад А', supplier: 'Logitech', price: 850 },
    { sku: 'MSE-LOGI-B100', name: 'Мышь Logitech B100', category: 'peripherals', description: 'Wired optical mouse', quantity: 30, minQuantity: 10, unit: 'pcs', location: 'Склад А', supplier: 'Logitech', price: 450 },
    { sku: 'TONER-KYOCERA-1170', name: 'Тонер Kyocera TK-1170', category: 'consumables', description: 'Black toner cartridge', quantity: 12, minQuantity: 5, unit: 'pcs', location: 'Склад Б', supplier: 'Kyocera Center', price: 2800 },
    { sku: 'TOOL-SET-01', name: 'Набор инструментов для IT', category: 'tools', description: 'Отвертки, пинцеты, кабельный тестер, кримпер', quantity: 5, minQuantity: 2, unit: 'pcs', location: 'Склад А', supplier: 'Kraftool', price: 4500 },
  ];

  for (const item of inventoryData) {
    try {
      await (prisma as any).inventoryItem.upsert({
        where: { sku: item.sku },
        update: item,
        create: item
      });
    } catch (e) {
      console.warn(`Пропуск предмета инвентаря ${item.sku}`);
    }
  }
  console.log('База инвентаря проверена');

  // 5. Восстановление базы знаний (KBArticle)
  const kbData = [
    { title: 'Настройка почты Outlook', content: 'Инструкция по настройке корпоративной почты...', category: 'software', authorId: 'admin' },
    { title: 'Замена картриджа в принтере', content: 'Пошаговое руководство по замене тонера...', category: 'hardware', authorId: 'admin' },
  ];

  for (const article of kbData) {
    try {
      // Find admin to link as author
      const admin = await prisma.user.findFirst({ where: { roleId: 'admin' } });
      if (admin) {
        await (prisma as any).kBArticle.upsert({
          where: { title: article.title },
          update: { ...article, authorId: admin.id },
          create: { ...article, authorId: admin.id }
        });
      }
    } catch (e) {
      console.warn(`Пропуск статьи базы знаний ${article.title}`);
    }
  }
  console.log('База знаний проверена');

  // 6. Восстановление документов (актов) с разными датами
  const documentsData = [
    { number: 'АКТ-2025-001', title: 'Акт осмотра принтера HP LaserJet', type: 'act', status: 'active', description: 'Проведен осмотр принтера, выявлена неисправность термоблока.', equipmentName: 'HP LaserJet Pro M404', equipmentLocation: 'Кабинет 205', repairDate: new Date('2025-01-28'), authorId: 'u1', createdAt: new Date('2025-01-28') },
    { number: 'РЕМ-2025-003', title: 'Ремонт УЗИ-аппарата Mindray', type: 'repair', status: 'active', description: 'Замена датчика, калибровка системы.', equipmentName: 'Mindray DC-70', equipmentLocation: 'Кабинет 112', repairDate: new Date('2025-01-25'), repairCost: 45000, authorId: 'u2', createdAt: new Date('2025-01-25') },
    { number: 'ТО-2025-012', title: 'Техническое обслуживание коммутаторов', type: 'maintenance', status: 'active', description: 'Чистка коммутаторов, обновление прошивки.', equipmentName: 'Cisco Catalyst', equipmentLocation: 'Серверная', repairDate: new Date('2025-02-01'), authorId: 'u1', createdAt: new Date('2025-02-01') },
  ];

  for (const doc of documentsData) {
    try {
      await prisma.document.upsert({
        where: { number: doc.number },
        update: doc,
        create: doc
      });
    } catch (e) {
      console.warn(`Пропуск документа ${doc.number}`);
    }
  }
  console.log('Документы восстановлены');

  // 7. Восстановление заявок
  const ticketsData = [
    { number: '#1001', title: 'Не работает принтер в кабинете 205', description: 'Принтер не печатает документы, горит красная лампочка.', category: 'printer', priority: 'high', status: 'new', authorId: 'u1', createdAt: new Date('2025-02-10') },
    { number: '#1002', title: 'Проблема с интернетом на ресепшн', description: 'Интернет периодически пропадает.', category: 'network', priority: 'medium', status: 'in_progress', authorId: 'u2', assigneeId: 'u1', createdAt: new Date('2025-02-11') },
  ];

  for (const ticket of ticketsData) {
    try {
      await prisma.ticket.upsert({
        where: { number: ticket.number },
        update: ticket,
        create: ticket
      });
    } catch (e) {
      console.warn(`Пропуск заявки ${ticket.number}`);
    }
  }
  console.log('Заявки восстановлены');

  console.log('Все данные успешно восстановлены и структурированы!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
