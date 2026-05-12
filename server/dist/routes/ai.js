"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = aiRoutes;
const prisma_js_1 = __importDefault(require("../lib/prisma.js"));
// --- ИЗОЛЯЦИЯ ЛОГИКИ ИИ ---
const AI_UTILS = {
    levenshtein: (a, b) => {
        const matrix = [];
        for (let i = 0; i <= b.length; i++)
            matrix[i] = [i];
        for (let j = 0; j <= a.length; j++)
            matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1))
                    matrix[i][j] = matrix[i - 1][j - 1];
                else
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
        return matrix[b.length][a.length];
    },
    getRandom: (arr) => arr[Math.floor(Math.random() * arr.length)],
    /** Все разделы CRM — единая карта для Medini */
    crmKnowledge: {
        tickets: '**Заявки** — создание тикетов на ремонт и обслуживание, назначение исполнителя, статусы и приоритеты. Отсюда ведётся вся «линейка» ИТ-поддержки.',
        inventory: '**Склад** — учёт расходников (бумага, картриджи и т.д.), остатки и списание. Удобно проверять, чего не хватает до заказа.',
        registry: '**Клиника Live / Реестр** — структура клиники: здания, этажи, кабинеты и привязанное оборудование. Карта помещений «как в жизни».',
        knowledge: '**База знаний** — статьи, регламенты и ответы на частые вопросы. То, что должно жить дольше одного тикета.',
        guides: '**Инструкции** — пошаговые сценарии по оборудованию и ПО. Короче и практичнее, чем полные статьи.',
        documents: '**Документы** — акты, отчёты, списания: формальная «бумага» по выполненным работам.',
        directory: '**Справочник** — контакты сотрудников, должности, отделы и внутренние телефоны.',
        chat: '**Чат** — внутренняя переписка между сотрудниками, в том числе групповые обсуждения.',
        admin: '**Управление (админка)** — роли, права доступа, пользователи и настройки системы (по политике клиники).',
        profile: '**Профиль** — ваши данные, аватар, настройки уведомлений и персональные параметры аккаунта.',
        parser: '**Парсер** — разбор и импорт данных из файлов (при включённом модуле и правах доступа).',
        users: '**Пользователи** — учётные записи персонала (часто в связке с админкой): кто во что может заходить.',
        decryptor: '**Расшифровка** — инструмент для работы с защищённым содержимым в рамках политики безопасности (доступ по ролям).'
    },
    stopWords: ['привет', 'здравствуй', 'телефон', 'номер', 'найди', 'подскажи', 'узнай', 'сотрудник', 'контакт', 'справочник'],
    stem: (word) => {
        if (word.length <= 4)
            return word;
        return word.replace(/(а|я|о|е|и|ы|ь|ю|у|ой|ей|ий|ый|ов|ев|их|ых|ую|юю|ая|яя|ое|ее)$/g, '');
    },
    livelyCloser: [
        'Если нужно — уточните формулировку, я подстроюсь.',
        'Напишите одним предложением, что ищете — разверну ответ.',
        'Могу сузить поиск: справочник, техника или база знаний.',
        'Я рядом — спросите ещё раз чуть конкретнее, если что-то упустила.'
    ],
    moduleTeasers: [
        'Коротко и по делу:',
        'Смотрите, как это устроено:',
        'В двух словах про раздел:',
        'Вот что важно знать:'
    ]
};
function wantsModuleExplanation(msg) {
    return /расскажи|объясни|что такое|зачем (нужен|это)|как (работает|пользоваться|открыть|найти)|инструкция|опиши|где (лежит|находится|вкладка)|модуль|раздел|экран|вкладк|про функционал|для чего|назначение/i.test(msg);
}
function contactShouldWin(relevantContacts, isContactQuery) {
    if (relevantContacts.length === 0)
        return false;
    const top = relevantContacts[0].searchScore;
    return isContactQuery || top >= 480;
}
function formatModuleAnswer(moduleKey, firstName) {
    const body = AI_UTILS.crmKnowledge[moduleKey];
    if (!body)
        return '';
    const teaser = AI_UTILS.getRandom(AI_UTILS.moduleTeasers);
    const closer = AI_UTILS.getRandom(AI_UTILS.livelyCloser);
    const nod = firstName ? `${firstName}, ` : '';
    return `${teaser}\n\n${body}\n\n✨ ${nod}${closer}`;
}
/** Имя для обращения: при «Фамилия Имя …» — второе слово (как в русском ФИО). */
function givenNameFromFull(fullName) {
    if (!fullName?.trim())
        return undefined;
    const p = fullName.trim().split(/\s+/).filter(Boolean);
    if (p.length >= 2)
        return p[1];
    return p[0];
}
function buildModulesOverviewLine(stats) {
    const order = [
        'tickets',
        'inventory',
        'registry',
        'knowledge',
        'guides',
        'documents',
        'directory',
        'chat',
        'profile',
        'parser',
        'users',
        'admin',
        'decryptor'
    ];
    const lines = order
        .map((k, i) => {
        const text = AI_UTILS.crmKnowledge[k];
        return text ? `${i + 1}. ${text}` : '';
    })
        .filter(Boolean);
    const digest = `📊 **Краткая сводка по базе:** открытых заявок — **${stats.tickets}**, статей в базе знаний — **${stats.kb}**, единиц оборудования в реестре — **${stats.equip}**, документов — **${stats.docs}**, позиций на складе — **${stats.sku}**.`;
    return (`Я **Medini** — штатный помощник CRM. Вижу не только справочник, но и заявки, склад, реестр, документы и базу знаний.\n\n` +
        `**Карта модулей:**\n\n${lines.join('\n\n')}\n\n${digest}\n\n` +
        `Спросите **конкретно** — например фамилию, инвентарный номер, «остаток бумаги» или «что такое заявки» — и я вытащу данные или объясню раздел.`);
}
async function aiRoutes(fastify) {
    fastify.get('/history', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        const requestUser = request.user;
        try {
            const history = await prisma_js_1.default.aIHistory.findMany({
                where: { userId: requestUser.id },
                orderBy: { createdAt: 'asc' },
                take: 50
            });
            return history;
        }
        catch (error) {
            console.error('[AI History Fetch Error]:', error);
            return reply.status(500).send({ message: 'Ошибка получения истории' });
        }
    });
    fastify.post('/chat', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        const { message: rawMessage } = request.body;
        const requestUser = request.user;
        try {
            console.log(`[AI DEBUG] User ${requestUser.id} sent message: "${rawMessage}"`);
            const cleanMsg = rawMessage.toLowerCase().replace(/[.,!?;:]/g, ' ').trim();
            const searchWords = cleanMsg.split(/\s+/).filter(w => w.length > 2 && !AI_UTILS.stopWords.includes(w));
            const stemmedWords = searchWords.map(AI_UTILS.stem).filter(w => w.length > 2);
            console.log(`[AI Search] Original: "${rawMessage}", Words: ${searchWords}, Stemmed: ${stemmedWords}`);
            const [dbUser, userHistory, kbArticleHits, statsTickets, statsKb, statsEquip, statsDocs, statsSku, allDirectory] = await Promise.all([
                prisma_js_1.default.user.findUnique({
                    where: { id: requestUser.id },
                    include: { roleRelation: true, departmentRelation: true }
                }),
                prisma_js_1.default.aIHistory.findMany({
                    where: { userId: requestUser.id },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }),
                searchWords.length > 0
                    ? prisma_js_1.default.kBArticle.findMany({
                        where: {
                            OR: searchWords.flatMap(w => [
                                { title: { contains: w, mode: 'insensitive' } },
                                { description: { contains: w, mode: 'insensitive' } }
                            ])
                        },
                        take: 5,
                        select: { title: true, category: true }
                    })
                    : Promise.resolve([]),
                prisma_js_1.default.ticket.count({ where: { status: { notIn: ['closed', 'resolved'] } } }).catch(() => 0),
                prisma_js_1.default.kBArticle.count().catch(() => 0),
                prisma_js_1.default.equipment.count().catch(() => 0),
                prisma_js_1.default.document.count().catch(() => 0),
                prisma_js_1.default.inventoryItem.count().catch(() => 0),
                prisma_js_1.default.directoryEntry.findMany({ take: 1000 })
            ]);
            let relevantContacts = allDirectory.map((c) => {
                const fullName = c.name.toLowerCase();
                const nameParts = fullName.split(/\s+/);
                const surname = nameParts[0];
                let score = 0;
                searchWords.forEach(word => {
                    if (surname === word)
                        score += 1000;
                    else if (surname.startsWith(word))
                        score += 500;
                    else if (nameParts[1] === word)
                        score += 300;
                    else if (nameParts[2] && nameParts[2].toLowerCase().includes(word))
                        score += 10;
                });
                stemmedWords.forEach(stem => {
                    if (surname.startsWith(stem))
                        score += 400;
                });
                if (fullName === cleanMsg)
                    score += 2000;
                else if (fullName.includes(cleanMsg) && cleanMsg.length > 3)
                    score += 500;
                return { ...c, searchScore: score };
            })
                .filter((c) => c.searchScore > 0)
                .sort((a, b) => b.searchScore - a.searchScore);
            if (relevantContacts.length > 1) {
                const bestScore = relevantContacts[0].searchScore;
                const secondBestScore = relevantContacts[1].searchScore;
                if (bestScore >= secondBestScore + 100) {
                    relevantContacts = [relevantContacts[0]];
                }
                else {
                    relevantContacts = relevantContacts.slice(0, 5);
                }
            }
            console.log(`[AI DEBUG] Found ${relevantContacts.length} contacts. Best: ${relevantContacts[0]?.name} (Score: ${relevantContacts[0]?.searchScore})`);
            let aiSuggestions = [];
            if (relevantContacts.length === 0 || (relevantContacts.length > 1 && relevantContacts[0].searchScore < 500)) {
                const fuzzyMatches = allDirectory
                    .map((c) => ({
                    name: c.name,
                    score: Math.max(...searchWords.map((w) => 1 -
                        AI_UTILS.levenshtein(c.name.toLowerCase().split(' ')[0], w) /
                            Math.max(c.name.split(' ')[0].length, w.length)))
                }))
                    .filter((c) => c.score > 0.6)
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 3);
                aiSuggestions = fuzzyMatches.map((m) => m.name);
            }
            const relevantEquipment = await prisma_js_1.default.equipment.findMany({
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
            const relevantInventory = await prisma_js_1.default.inventoryItem.findMany({
                where: {
                    OR: [
                        { name: { contains: cleanMsg, mode: 'insensitive' } },
                        ...searchWords.map(word => ({ name: { contains: word, mode: 'insensitive' } }))
                    ]
                },
                take: 3
            });
            let aiReply = '';
            let prefix = '';
            const msg = cleanMsg;
            console.log(`[AI] Processing message: "${msg}" (User: ${dbUser?.name})`);
            const isConfirmation = /^(да|ага|давай|верно|точно|yes|yep)/i.test(msg);
            const lastInteraction = userHistory[0];
            if (isConfirmation && lastInteraction && lastInteraction.reply.includes('Возможно, вы имели в виду:')) {
                const match = lastInteraction.reply.match(/•\s*([^(\n]+)/);
                if (match && match[1]) {
                    const suggestedName = match[1].trim();
                    const confirmedContact = allDirectory.find((c) => c.name.includes(suggestedName));
                    if (confirmedContact) {
                        aiReply = `Отлично! Вот информация по сотруднику:\n👤 **${confirmedContact.name}**\n💼 ${confirmedContact.position}\n🏢 ${confirmedContact.department || '—'}\n📞 Внутр: **${confirmedContact.internalPhone || '—'}**\n📱 Моб: **${confirmedContact.mobilePhone || '—'}**`;
                        await prisma_js_1.default.aIHistory.create({
                            data: { message: rawMessage, reply: aiReply, userId: requestUser.id }
                        });
                        return { reply: aiReply };
                    }
                }
            }
            const isGreeting = /^(привет|здравствуй|ку|хай|добрый (день|вечер|утро)|hello|hi|салам|здорово|прив|дратути|приветик|приветствую)/i.test(cleanMsg.trim());
            const isOverviewQuery = /все модули|весь функционал|какие разделы|карта (приложения|системы)|обзор системы|что (за |)crm|что здесь есть|что умеет система|навигац|полный список/i.test(msg);
            const isCapabilityQuery = /что (ты )?умеешь|что (ты )?можешь|чем можешь помочь|чем полезен|ваши возможности|функции системы|как пользоваться (crm|систем)/i.test(msg) || /^(помощь|help)$/i.test(msg.trim());
            const findCrmModule = () => {
                const modules = {
                    заявк: 'tickets',
                    тикет: 'tickets',
                    тикеты: 'tickets',
                    склад: 'inventory',
                    расход: 'inventory',
                    товар: 'inventory',
                    остат: 'inventory',
                    реестр: 'registry',
                    клиник: 'registry',
                    здан: 'registry',
                    кабин: 'registry',
                    оборудован: 'registry',
                    баз: 'knowledge',
                    знан: 'knowledge',
                    стать: 'knowledge',
                    регламент: 'knowledge',
                    инструкц: 'guides',
                    гайд: 'guides',
                    документ: 'documents',
                    акт: 'documents',
                    справочник: 'directory',
                    контакт: 'directory',
                    сотрудн: 'directory',
                    фио: 'directory',
                    чат: 'chat',
                    сообщен: 'chat',
                    переписк: 'chat',
                    админ: 'admin',
                    управлен: 'admin',
                    прав: 'admin',
                    рол: 'admin',
                    профил: 'profile',
                    аватар: 'profile',
                    личн: 'profile',
                    парсер: 'parser',
                    parser: 'parser',
                    пользовател: 'users',
                    учётн: 'users',
                    юзер: 'users',
                    расшиф: 'decryptor',
                    шифр: 'decryptor'
                };
                for (const key in modules) {
                    if (msg.includes(key))
                        return modules[key];
                }
                return null;
            };
            const matchedModule = findCrmModule();
            const isCrmGuideQuery = /(как|что|зачем|расскажи|инструкция|помоги|объясни|опиши|где найти|для чего)/i.test(msg) && !!matchedModule;
            const isEquipmentQuery = /(где|найти|оборудован|аппарат|инвентар|номер|hamilton|монитор|принтер|пк|компьютер)/i.test(cleanMsg);
            const isInventoryQuery = /(сколько|остаток|склад|картридж|бумаг|есть ли|расходники)/i.test(cleanMsg);
            const isContactQuery = /(телефон|номер|кто это|сотрудник|контакт|найти|позвонить|внутренн|мобильн|звонок|фио|кто такой|кто такая)/i.test(msg);
            const wantsKb = /база знаний|стать|регламент|kb|инструкц (в базе|из баз)/i.test(rawMessage) ||
                (matchedModule === 'knowledge' && wantsModuleExplanation(msg));
            if (isGreeting) {
                const gn = givenNameFromFull(dbUser?.name);
                const greetings = gn
                    ? [
                        `Здравствуйте, ${gn}! `,
                        `Приветствую, ${gn}! `,
                        `На связи Medini ✨ ${gn}, `,
                        `Добрый день, ${gn}! `
                    ]
                    : [`Здравствуйте! `, `Приветствую! `, `На связи Medini ✨ `, `Добрый день! `];
                prefix = AI_UTILS.getRandom(greetings);
            }
            const statsBundle = {
                tickets: statsTickets,
                kb: statsKb,
                equip: statsEquip,
                docs: statsDocs,
                sku: statsSku
            };
            const firstName = givenNameFromFull(dbUser?.name);
            if (isCapabilityQuery || isOverviewQuery) {
                aiReply = buildModulesOverviewLine(statsBundle);
            }
            else if (matchedModule &&
                (wantsModuleExplanation(msg) || isCrmGuideQuery) &&
                !contactShouldWin(relevantContacts, isContactQuery)) {
                aiReply = formatModuleAnswer(matchedModule, firstName);
                if (matchedModule === 'knowledge' && kbArticleHits.length > 0) {
                    aiReply +=
                        `\n\n📚 **Похожие статьи в базе:**\n` +
                            kbArticleHits.map((a) => `• **${a.title}** (${a.category})`).join('\n');
                }
            }
            else if (kbArticleHits.length > 0 && wantsKb && !contactShouldWin(relevantContacts, isContactQuery)) {
                aiReply =
                    `Нашла материалы в **базе знаний** по вашим словам:\n\n` +
                        kbArticleHits.map((a) => `• **${a.title}** — ${a.category}`).join('\n') +
                        `\n\nОткройте раздел **База знаний** в меню, чтобы прочитать полностью.`;
            }
            else if (relevantContacts.length > 0 && contactShouldWin(relevantContacts, isContactQuery)) {
                if (relevantContacts.length === 1) {
                    const c = relevantContacts[0];
                    aiReply = `Нашла совпадение в справочнике:\n👤 **${c.name}**\n💼 ${c.position}\n🏢 ${c.department || '—'}\n📞 Внутр: **${c.internalPhone || '—'}**\n📱 Моб: **${c.mobilePhone || '—'}**`;
                }
                else {
                    aiReply =
                        `Несколько человек подходят — уточните фамилию:\n` +
                            relevantContacts.map((c) => `• **${c.name}** (${c.position}) — тел: ${c.internalPhone || 'нет'}`).join('\n');
                }
            }
            else if (relevantEquipment.length > 0 && (isEquipmentQuery || searchWords.some(w => w === 'hamilton'))) {
                if (relevantEquipment.length === 1) {
                    const eq = relevantEquipment[0];
                    const loc = eq.cabinet
                        ? `${eq.cabinet.building?.name || ''}, этаж ${eq.cabinet.floor?.number || ''}, каб. ${eq.cabinet.name}`
                        : 'местоположение не указано';
                    aiReply = `Оборудование **${eq.name}** (${eq.model}) — ${loc}.\n📍 Инв. номер: \`${eq.inventoryNumber || 'нет'}\`.`;
                }
                else {
                    aiReply =
                        `Нашла несколько устройств:\n` +
                            relevantEquipment.map((eq) => `• **${eq.name}** — ${eq.cabinet?.name || 'не указано'}`).join('\n');
                }
            }
            else if (relevantInventory.length > 0 && isInventoryQuery) {
                if (relevantInventory.length === 1) {
                    const i = relevantInventory[0];
                    aiReply = `На складе **${i.name}**: **${i.quantity} ${i.unit}**. (SKU: ${i.sku})`;
                }
                else {
                    aiReply =
                        `Остатки:\n` + relevantInventory.map((i) => `• **${i.name}**: ${i.quantity} ${i.unit}`).join('\n');
                }
            }
            else if (matchedModule && !contactShouldWin(relevantContacts, isContactQuery)) {
                aiReply = formatModuleAnswer(matchedModule, firstName);
            }
            else if (isGreeting) {
                aiReply = AI_UTILS.getRandom([
                    'Я на связи — могу провести по модулям CRM, найти контакт, технику или остатки на складе. Что ищем?',
                    'Рада помочь: справочник, заявки, реестр, база знаний, документы — спросите в своих словах.',
                    'Задайте вопрос про раздел или фамилию — разложу по полочкам.'
                ]);
            }
            else {
                const notFound = [
                    'Пока не нашла точного совпадения. Попробуйте фамилию из справочника, инв. номер или название раздела («заявки», «склад»…).',
                    'В базе такого нет — возможно, опечатка? Или спросите про конкретный модуль.',
                    'Не вижу совпадения. Могу показать **карту модулей** — напишите «что ты умеешь» или «все модули».'
                ];
                aiReply = AI_UTILS.getRandom(notFound);
                if (aiSuggestions.length > 0) {
                    aiReply += `\n\n**Возможно, вы имели в виду:**\n` + aiSuggestions.map(s => `• ${s}`).join('\n');
                }
            }
            const finalReply = prefix + aiReply;
            await prisma_js_1.default.aIHistory.create({
                data: {
                    message: rawMessage,
                    reply: finalReply,
                    userId: requestUser.id
                }
            });
            return { reply: finalReply };
        }
        catch (error) {
            console.error('[AI Route Error]:', error);
            return reply.status(500).send({ message: 'Внутренняя ошибка ИИ-сервиса' });
        }
    });
}
