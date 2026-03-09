import type { DirectoryEntry } from '@/types';

export const mockDirectory: DirectoryEntry[] = [
  // Технический отдел (ваш отдел)
  {
    id: '1',
    name: 'Иванов Иван Иванович',
    position: 'Системный администратор',
    department: 'Технический отдел',
    cabinet: '306',
    internalPhone: '101',
    mobilePhone: '+79991234567',
    telegram: 'admin_medin',
    tags: ['сисадмин', 'админ', 'компьютеры', 'интернет', 'почта', 'сервер']
  },
  {
    id: '2',
    name: 'Петров Петр Петрович',
    position: 'Инженер по медоборудованию',
    department: 'Технический отдел',
    cabinet: '306',
    internalPhone: '102',
    mobilePhone: '+79997654321',
    telegram: 'med_eng',
    tags: ['медтехника', 'оборудование', 'ремонт', 'узи', 'мрт']
  },
  {
    id: '3',
    name: 'Сидоров Алексей',
    position: 'Техник',
    department: 'Технический отдел',
    cabinet: '306',
    internalPhone: '103',
    mobilePhone: '+79001112233',
    telegram: 'tech_alex',
    tags: ['техник', 'принтер', 'картридж', 'бумага', 'заправка']
  },
  {
    id: '4',
    name: 'Кузнецов Дмитрий',
    position: 'Техник',
    department: 'Технический отдел',
    cabinet: '306',
    internalPhone: '104',
    mobilePhone: '+79004445566',
    telegram: 'tech_dim',
    tags: ['техник', 'мышка', 'клавиатура', 'монитор', 'провод']
  },
  {
    id: '5',
    name: 'Смирнова Елена',
    position: 'Завхоз',
    department: 'Технический отдел',
    cabinet: '306',
    internalPhone: '105',
    mobilePhone: '+79007778899',
    telegram: 'elena_hoz'
  },
  // Другие отделения
  {
    id: '6',
    name: 'Васильева Анна Сергеевна',
    position: 'Зав. отделением',
    department: 'Терапия',
    cabinet: '201',
    internalPhone: '201',
    mobilePhone: '+79110001122',
    telegram: 'anna_terapia'
  },
  {
    id: '7',
    name: 'Михайлов Игорь Валентинович',
    position: 'Врач-терапевт',
    department: 'Терапия',
    cabinet: '202',
    internalPhone: '202',
    mobilePhone: '+79113334455',
  },
  {
    id: '8',
    name: 'Федорова Ольга Николаевна',
    position: 'Главный бухгалтер',
    department: 'Бухгалтерия',
    cabinet: '405',
    internalPhone: '401',
    mobilePhone: '+79221112233',
    telegram: 'olga_fin'
  },
  {
    id: '9',
    name: 'Соколов Артем',
    position: 'Бухгалтер',
    department: 'Бухгалтерия',
    cabinet: '405',
    internalPhone: '402',
    mobilePhone: '+79224445566',
  }
];
