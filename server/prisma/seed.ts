import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Начало восстановления данных...');

  // 1. Очистка существующих данных
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
      await prisma.role.create({ data: role });
    } catch (e) {}
  }
  console.log('Роли восстановлены');

  const hashedPassword = await bcrypt.hash('password', 10);

  // 2. Восстановление только АДМИНОВ и ТЕХНИКОВ как пользователей CRM
  const usersData = [
    {
      id: 'u1',
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
      id: 'u2',
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
      id: 'u3',
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
    await prisma.user.create({ data: user });
  }
  console.log('Пользователи (Админы и Техники) восстановлены');

  // 3. Восстановление справочника сотрудников (БЕЗ создания их как пользователей CRM)
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

  await prisma.directoryEntry.createMany({ data: directoryData });
  console.log('Справочник сотрудников восстановлен');

  // 4. Восстановление инвентаря
  const inventoryData = [
    { sku: 'CRT-HP-85A', name: 'Картридж HP 85A (CE285A)', category: 'consumables', description: 'Оригинальный картридж для HP LaserJet Pro P1102, M1132, M1212', quantity: 12, minQuantity: 5, unit: 'pcs', location: 'Склад А, стеллаж 3', supplier: 'Техносила', price: 3200 },
    { sku: 'PAPER-A4-80', name: 'Бумага A4 80г/м2', category: 'consumables', description: 'Офисная бумага для принтеров и МФУ', quantity: 45, minQuantity: 10, unit: 'box', location: 'Склад А, стеллаж 1', supplier: 'Xerox', price: 280 },
    { sku: 'CABLE-UTP-5E', name: 'Кабель UTP Cat.5e', category: 'spare_parts', description: 'Витая пара для сетевых подключений, бухта 305м', quantity: 3, minQuantity: 2, unit: 'box', location: 'Склад Б, стеллаж 2', supplier: 'Legrand', price: 8500 },
    { sku: 'SSD-SAM-500', name: 'SSD Samsung 870 EVO 500GB', category: 'spare_parts', description: 'Твердотельный накопитель 2.5" SATA III', quantity: 8, minQuantity: 3, unit: 'pcs', location: 'Склад Б, стеллаж 4', supplier: 'Samsung', price: 5800 },
    { sku: 'TOOL-SET-01', name: 'Набор инструментов для IT', category: 'tools', description: 'Отвертки, пинцеты, кабельный тестер, кримпер', quantity: 5, minQuantity: 2, unit: 'pcs', location: 'Склад А, шкаф инструментов', supplier: 'Kraftool', price: 4500 },
  ];

  await prisma.inventoryItem.createMany({ data: inventoryData });
  console.log('Инвентарь восстановлен');

  // 5. Восстановление базы знаний (KBArticle)
  const kbData = [
    { 
      title: 'Принтер не печатает - диагностика', 
      category: 'printer', 
      description: 'Пошаговая инструкция по диагностике проблем с печатью',
      content: 'Пошаговая инструкция по диагностике проблем с печатью. 1. Проверьте подключение. 2. Очистите очередь печати.', 
      tags: ['принтер', 'печать', 'диагностика'], 
      authorId: 'u1',
      steps: [
        { id: '1', order: 1, title: 'Проверьте подключение', description: 'Убедитесь, что принтер включен в розетку.' },
        { id: '2', order: 2, title: 'Очередь печати', description: 'Удалите зависшие задания в очереди.' }
      ]
    },
    { 
      title: 'Нет интернета - что проверить', 
      category: 'network', 
      description: 'Быстрая диагностика проблем с интернет-соединением',
      content: 'Быстрая диагностика проблем с интернет-соединением. 1. Индикаторы роутера. 2. Перезагрузка.', 
      tags: ['интернет', 'сеть', 'диагностика'], 
      authorId: 'u1',
      steps: [
        { id: '1', order: 1, title: 'Индикаторы роутера', description: 'Проверьте WAN индикатор.' },
        { id: '2', order: 2, title: 'Перезагрузка', description: 'Выключите и включите роутер.' }
      ]
    },
    { 
      title: 'Компьютер не включается', 
      category: 'common', 
      description: 'Что делать, если компьютер не реагирует на кнопку включения',
      content: 'Что делать, если компьютер не реагирует на кнопку включения. 1. Кабель питания. 2. Кнопка БП.', 
      tags: ['компьютер', 'питание', 'железо'], 
      authorId: 'u1',
      steps: [
        { id: '1', order: 1, title: 'Кабель питания', description: 'Проверьте плотность подключения кабеля.' },
        { id: '2', order: 2, title: 'Кнопка БП', description: 'Убедитесь, что переключатель на блоке питания в положении I.' }
      ]
    },
    { 
      title: 'Настройка почты Outlook', 
      category: 'software', 
      description: 'Инструкция по настройке корпоративной почты в Outlook',
      content: 'Инструкция по настройке корпоративной почты в Outlook. 1. Откройте Outlook. 2. Добавление записи.', 
      tags: ['почта', 'outlook', 'email', 'настройка'], 
      authorId: 'u1',
      steps: [
        { id: '1', order: 1, title: 'Запуск мастера', description: 'Запустите Outlook и перейдите в Файл -> Добавить учетную запись.' },
        { id: '2', order: 2, title: 'Данные сервера', description: 'Введите ваш email и пароль.' }
      ]
    },
  ];

  for (const article of kbData) {
    await prisma.kBArticle.create({ data: article });
  }
  console.log('База знаний восстановлена');

  // 6. Восстановление документов (актов) с разными датами
  const documentsData = [
    { number: 'АКТ-2025-001', title: 'Акт осмотра принтера HP LaserJet', type: 'act', status: 'active', description: 'Проведен осмотр принтера, выявлена неисправность термоблока.', equipmentName: 'HP LaserJet Pro M404', equipmentLocation: 'Кабинет 205', repairDate: new Date('2025-01-28'), authorId: 'u1', createdAt: new Date('2025-01-28') },
    { number: 'РЕМ-2025-003', title: 'Ремонт УЗИ-аппарата Mindray', type: 'repair', status: 'active', description: 'Замена датчика, калибровка системы.', equipmentName: 'Mindray DC-70', equipmentLocation: 'Кабинет 112', repairDate: new Date('2025-01-25'), repairCost: 45000, authorId: 'u2', createdAt: new Date('2025-01-25') },
    { number: 'ТО-2025-012', title: 'Техническое обслуживание коммутаторов', type: 'maintenance', status: 'active', description: 'Чистка коммутаторов, обновление прошивки.', equipmentName: 'Cisco Catalyst', equipmentLocation: 'Серверная', repairDate: new Date('2025-02-01'), authorId: 'u1', createdAt: new Date('2025-02-01') },
  ];

  for (const doc of documentsData) {
    await prisma.document.create({ data: doc });
  }
  console.log('Документы восстановлены');

  // 7. Восстановление заявок
  const ticketsData = [
    { number: '#1001', title: 'Не работает принтер в кабинете 205', description: 'Принтер не печатает документы, горит красная лампочка.', category: 'printer', priority: 'high', status: 'new', authorId: 'u1', createdAt: new Date('2025-02-10') },
    { number: '#1002', title: 'Проблема с интернетом на ресепшн', description: 'Интернет периодически пропадает.', category: 'network', priority: 'medium', status: 'in_progress', authorId: 'u2', assigneeId: 'u1', createdAt: new Date('2025-02-11') },
  ];

  for (const ticket of ticketsData) {
    await prisma.ticket.create({ data: ticket });
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
