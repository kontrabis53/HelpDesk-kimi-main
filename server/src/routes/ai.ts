import { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma.js';

export default async function aiRoutes(fastify: FastifyInstance) {
  // Get AI history for current user
  fastify.get('/history', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const user = request.user as any;
    try {
      const history = await (prisma as any).aIHistory.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' }, // От старых к новым для чата
        take: 50
      });
      return history;
    } catch (error) {
      console.error('[AI History Fetch Error]:', error);
      return reply.status(500).send({ message: 'Ошибка получения истории' });
    }
  });

  // Chat with local AI
  fastify.post('/chat', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { message } = request.body as { message: string };
    const user = request.user as any;

    try {
      console.log(`[AI DEBUG] User ${user.id} sent message: "${message}"`);
      // 0. Вспомогательные функции
      const levenshtein = (a: string, b: string): number => {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
          for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
            else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
          }
        }
        return matrix[b.length][a.length];
      };

      const isFuzzyMatch = (target: string, query: string, threshold = 0.4) => {
        const t = target.toLowerCase();
        const q = query.toLowerCase();
        if (t.includes(q)) return true;
        const distance = levenshtein(t, q);
        const maxLength = Math.max(t.length, q.length);
        return (distance / maxLength) <= threshold;
      };

      const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

      const crmKnowledge = {
        tickets: "Раздел **Заявки** — здесь вы создаете тикеты на ремонт или обслуживание. Можно назначать ответственных, менять статусы и приоритеты.",
        inventory: "Модуль **Склад** — учет расходных материалов (бумага, картриджи). Я вижу остатки в реальном времени.",
        registry: "Раздел **Клиника Live** (Реестр) — здесь вся структура клиники: здания, этажи, кабинеты и закрепленное за ними оборудование.",
        knowledge: "Модуль **База знаний** — инструкции, регламенты и полезные статьи для сотрудников.",
        guides: "Раздел **Инструкции** — пошаговые руководства по работе с оборудованием и ПО.",
        documents: "Модуль **Документы** — здесь хранятся акты выполненных работ, списания и другие отчеты.",
        directory: "Раздел **Справочник** — контакты всех сотрудников клиники, их должности и внутренние номера.",
        chat: "Внутренний **Чат** — для оперативного общения между сотрудниками.",
        admin: "Панель **Управление** — только для администраторов: настройка ролей, прав доступа и управление структурой клиники."
      };

      // --- 1. ПОДГОТОВКА КОНТЕКСТА ---
      const cleanMsg = message.toLowerCase().replace(/[.,!?;:]/g, ' ').trim();
      
      // Слова-исключения, которые не должны считаться поисковыми словами для контактов
      const stopWords = ['привет', 'здравствуй', 'телефон', 'номер', 'найди', 'подскажи', 'узнай', 'сотрудник', 'контакт', 'справочник'];

      // Функция для примитивного стемминга (удаление окончаний)
      const stem = (word: string) => {
        if (word.length <= 4) return word;
        return word.replace(/(а|я|о|е|и|ы|ь|ю|у|ой|ей|ий|ый|ов|ев|их|ых|ую|юю|ая|яя|ое|ее)$/g, '');
      };

      const searchWords = cleanMsg.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));
      const stemmedWords = searchWords.map(stem).filter(w => w.length > 2);
      
      console.log(`[AI Search] Original: "${message}", Words: ${searchWords}, Stemmed: ${stemmedWords}`);

      const [dbUser, userHistory] = await Promise.all([
        (prisma.user as any).findUnique({
          where: { id: user.id },
          include: { roleRelation: true, departmentRelation: true }
        }),
        (prisma as any).aIHistory.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 5
        })
      ]);

      // --- 2. ПОИСК В БД ---
      // Поиск контактов (Самый важный поиск)
      const allDirectory = await (prisma as any).directoryEntry.findMany({ take: 1000 });
      
      let relevantContacts = allDirectory.map((c: any) => {
        const fullName = c.name.toLowerCase();
        const nameParts = fullName.split(/\s+/);
        const surname = nameParts[0];
        let score = 0;

        // Проверяем каждое слово из запроса пользователя
        searchWords.forEach(word => {
          // 1. Точное совпадение с фамилией (первое слово в ФИО) - ВЫСШИЙ ПРИОРИТЕТ
          if (surname === word) score += 1000;
          // 2. Фамилия начинается на это слово
          else if (surname.startsWith(word)) score += 500;
          // 3. Совпадение с Именем (второе слово)
          else if (nameParts[1] === word) score += 300;
          // 4. Слово есть где-то в отчестве (самый низкий приоритет)
          else if (nameParts[2] && nameParts[2].toLowerCase().includes(word)) score += 10;
        });

        // Проверяем корни слов (для окончаний)
        stemmedWords.forEach(stem => {
          if (surname.startsWith(stem)) score += 400;
        });

        // Если в запросе была вся фраза целиком (например, "Андреева Алина")
        if (fullName === cleanMsg) score += 2000;
        else if (fullName.includes(cleanMsg)) score += 500;

        return { ...c, searchScore: score };
      })
      .filter((c: any) => c.searchScore > 0)
      .sort((a: any, b: any) => b.searchScore - a.searchScore);

      // ЖЕСТКИЙ ФИЛЬТР: Если есть один явный лидер, убираем всех остальных
      if (relevantContacts.length > 1) {
        const bestScore = relevantContacts[0].searchScore;
        const secondBestScore = relevantContacts[1].searchScore;
        
        // Если первый результат значительно лучше второго, оставляем только его
        if (bestScore >= secondBestScore + 100) {
          relevantContacts = [relevantContacts[0]];
        } else {
          relevantContacts = relevantContacts.slice(0, 5);
        }
      }

      console.log(`[AI DEBUG] Found ${relevantContacts.length} contacts. Best: ${relevantContacts[0]?.name} (Score: ${relevantContacts[0]?.searchScore})`);

      // 2.1 ПОИСК ПРЕДЛОЖЕНИЙ (Если нет точного лидера)
      let suggestions: string[] = [];
      if (relevantContacts.length === 0 || (relevantContacts.length > 1 && relevantContacts[0].searchScore < 500)) {
        const allContacts = await (prisma as any).directoryEntry.findMany({ take: 500 });
        const fuzzyMatches = allContacts
          .map((c: any) => ({ 
            name: c.name, 
            score: Math.max(...searchWords.map(w => 1 - levenshtein(c.name.toLowerCase().split(' ')[0], w) / Math.max(c.name.split(' ')[0].length, w.length)))
          }))
          .filter((c: any) => c.score > 0.6)
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 3);
        
        suggestions = fuzzyMatches.map(m => m.name);
      }

      // Поиск оборудования
      const relevantEquipment = await (prisma as any).equipment.findMany({
        where: {
          OR: [
            { name: { contains: cleanMsg, mode: 'insensitive' } },
            ...searchWords.map(word => ({ name: { contains: word, mode: 'insensitive' } })),
            ...searchWords.map(word => ({ inventoryNumber: { contains: word, mode: 'insensitive' } }))
          ]
        },
        include: { cabinet: { include: { building: true, floor: true } }, department: true },
        take: 5
      });

      // Поиск на складе
      const relevantInventory = await (prisma as any).inventoryItem.findMany({
        where: {
          OR: [
            { name: { contains: cleanMsg, mode: 'insensitive' } },
            ...searchWords.map(word => ({ name: { contains: word, mode: 'insensitive' } }))
          ]
        },
        take: 3
      });

      // --- 3. ФОРМИРОВАНИЕ ОТВЕТА ---
      let aiReply = '';
      let prefix = '';
      const msg = cleanMsg;
      
      console.log(`[AI] Processing message: "${msg}" (User: ${dbUser?.name})`);

      // 9.1 Проверка подтверждения предложения (если пользователь написал "да")
      const isConfirmation = /^(да|ага|давай|верно|точно|yes|yep)/i.test(msg);
      const lastInteraction = userHistory[0];
      
      if (isConfirmation && lastInteraction && lastInteraction.reply.includes('Возможно, вы имели в виду:')) {
        const match = lastInteraction.reply.match(/•\s*([^(\n]+)/);
        if (match && match[1]) {
          const suggestedName = match[1].trim();
          const confirmedContact = allDirectory.find((c: any) => c.name.includes(suggestedName));
          
          if (confirmedContact) {
            aiReply = `Отлично! Вот информация по сотруднику:\n👤 **${confirmedContact.name}**\n💼 ${confirmedContact.position}\n🏢 ${confirmedContact.department || '—'}\n📞 Внутр: **${confirmedContact.internalPhone || '—'}**\n📱 Моб: **${confirmedContact.mobilePhone || '—'}**`;
            await (prisma as any).aIHistory.create({
              data: { message: message, reply: aiReply, userId: user.id }
            });
            return { reply: aiReply };
          }
        }
      }

      // Проверка контекста из истории
      const isContextFollowUp = /(подробн|еще|повтори|что там|дальше)/i.test(msg);

      // Распознавание интентов
      const isGreeting = /^(привет|здравствуй|ку|хай|добрый (день|вечер|утро)|hello|hi|салам|здорово|прив|дратути|приветик|приветствую)/i.test(cleanMsg);
      const isCapabilityQuery = /(что (ты )?умеешь|что (ты )?можешь|помощь|как пользоваться|функции|\?)/i.test(cleanMsg);
      
      // Более гибкое определение модуля (нечеткое)
      const findCrmModule = () => {
        const modules: any = {
          'заявк': 'tickets', 'тикет': 'tickets', 'тикеты': 'tickets',
          'склад': 'inventory', 'расход': 'inventory', 'товар': 'inventory',
          'реестр': 'registry', 'клиник': 'registry', 'здан': 'registry', 'кабин': 'registry',
          'баз': 'knowledge', 'стать': 'knowledge',
          'инструкц': 'guides', 'гайд': 'guides',
          'документ': 'documents', 'акт': 'documents',
          'справочник': 'directory', 'контакт': 'directory', 'сотрудн': 'directory',
          'чат': 'chat', 'сообщен': 'chat',
          'админ': 'admin', 'управлен': 'admin', 'права': 'admin'
        };
        for (const key in modules) {
          if (msg.includes(key)) return modules[key];
        }
        return null;
      };

      const matchedModule = findCrmModule();
      const isCrmGuideQuery = /(как|что|зачем|расскажи|инструкция|помоги)/i.test(msg) && matchedModule;

      const isEquipmentQuery = /(где|найти|оборудован|аппарат|инвентар|номер|hamilton|монитор|принтер|пк|компьютер)/i.test(cleanMsg);
      const isInventoryQuery = /(сколько|остаток|склад|картридж|бумаг|есть ли|расходники)/i.test(cleanMsg);
      const isContactQuery = /(телефон|номер|кто это|сотрудник|контакт|найти|тел)/i.test(cleanMsg) || (relevantContacts.length > 0 && cleanMsg.length > 2);

      // Если есть приветствие - добавляем его как префикс
      if (isGreeting) {
        const greetings = [
          `Здравствуйте, ${dbUser?.name?.split(' ')[0]}! `,
          `Приветствую! Чем могу помочь? `,
          `На связи ИИ MEDIN. `,
          `Добрый день! Слушаю вас. `
        ];
        prefix = getRandom(greetings);
      }

      // Основная логика ответа
      if (isCapabilityQuery) {
        aiReply = `Я — ваш интеллектуальный помощник MEDIN (Версия логики: 2.0). Вот что я умею:\n` +
          `1. 📞 **Поиск контактов**: Спросите "Телефон Иванова" или просто фамилию.\n` +
          `2. 🏥 **Поиск оборудования**: Спросите "Где Hamilton?" или по инв. номеру.\n` +
          `3. 📦 **Склад**: Спросите "Сколько бумаги на складе?" или "Остатки картриджей".\n` +
          `4. 💡 **Консультации**: Расскажу про любой модуль (Заявки, Реестр, Документы).`;
      } 
      else if (relevantContacts.length > 0) {
        if (relevantContacts.length === 1) {
          const c = relevantContacts[0];
          aiReply = `Нашел точное совпадение по фамилии:\n👤 **${c.name}**\n💼 ${c.position}\n🏢 ${c.department || '—'}\n📞 Внутр: **${c.internalPhone || '—'}**\n📱 Моб: **${c.mobilePhone || '—'}**`;
        } else {
          aiReply = `Нашел нескольких сотрудников (уточните фамилию):\n` + 
            relevantContacts.map((c: any) => `• **${c.name}** (${c.position}) — тел: ${c.internalPhone || 'нет'}`).join('\n');
        }
      }
      else if (relevantEquipment.length > 0 && (isEquipmentQuery || searchWords.some(w => w === 'hamilton'))) {
        if (relevantEquipment.length === 1) {
          const eq = relevantEquipment[0];
          const loc = eq.cabinet 
            ? `${eq.cabinet.building?.name || ''}, этаж ${eq.cabinet.floor?.number || ''}, каб. ${eq.cabinet.name}`
            : 'местоположение не указано';
          aiReply = `Оборудование **${eq.name}** (${eq.model}) находится здесь: ${loc}.\n📍 Инв. номер: \`${eq.inventoryNumber || 'нет'}\`.`;
        } else {
          aiReply = `Найдено несколько устройств:\n` + 
            relevantEquipment.map((eq: any) => `• **${eq.name}** — ${eq.cabinet?.name || 'не указано'}`).join('\n');
        }
      }
      else if (relevantInventory.length > 0 && isInventoryQuery) {
        if (relevantInventory.length === 1) {
          const i = relevantInventory[0];
          aiReply = `На складе **${i.name}**: **${i.quantity} ${i.unit}**. (SKU: ${i.sku})`;
        } else {
          aiReply = `Остатки на складе:\n` + 
            relevantInventory.map((i: any) => `• **${i.name}**: ${i.quantity} ${i.unit}`).join('\n');
        }
      }
      else if (isGreeting) {
        aiReply = "Я на связи и готов искать информацию по сотрудникам, технике или складу. О чем хотите узнать?";
      }
      else {
        const notFound = [
          "К сожалению, по этому запросу ничего не нашлось. Попробуйте уточнить фамилию или название.",
          "Я просмотрел базу данных, но совпадений нет. Может, опечатка?",
          "Хм, не вижу такого в системе. Попробуйте спросить иначе."
        ];
        aiReply = getRandom(notFound);
        if (suggestions.length > 0) {
          aiReply += `\n\n**Возможно, вы имели в виду:**\n` + suggestions.map(s => `• ${s}`).join('\n');
        }
      }

      const finalReply = prefix + aiReply;
      
      // 4. СОХРАНЕНИЕ В ИСТОРИЮ
      await (prisma as any).aIHistory.create({
        data: {
          message: message,
          reply: finalReply,
          userId: user.id
        }
      });

      return { reply: finalReply };

    } catch (error: any) {
      console.error('[AI Route Error]:', error);
      return reply.status(500).send({ message: 'Внутренняя ошибка ИИ-сервиса' });
    }
  });
}
