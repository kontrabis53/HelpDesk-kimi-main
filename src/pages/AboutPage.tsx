import { ArrowLeft, Info, History, ShieldCheck, Database, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AboutPage() {
  const navigate = useNavigate();

  const versions = [
    {
      version: '1.1.7',
      date: '27 апреля 2026',
      title: 'Статус онлайн и персонализация',
      isCurrent: true,
      changes: [
        'Добавлены поля isOnline, showGreeting и greetingText в модель пользователя',
        'Реализован экран приветствия, который появляется только при новом входе в систему (если включено)',
        'Обновлено отслеживание статуса пользователя через Socket.io: теперь используется поле isOnline вместо isActive',
        'Добавлена настройка приветственного сообщения в меню управления пользователями',
        'Исправлены ошибки TypeScript и улучшена типизация проекта',
        'Обновлена конфигурация CORS и Socket.io для лучшей совместимости и стабильности соединения'
      ]
    },
    {
      version: '1.1.6',
      date: '26 апреля 2026',
      title: 'Управление правами и исправление Prisma',
      changes: [
        'Исправлена критическая ошибка сервера: устранена несовместимость Prisma Client (userRole -> roleRelation)',
        'Полноценная раздача ролей: в раздел Управление добавлены интерактивные чекбоксы для настройки прав доступа',
        'Синхронизация меню: Sidebar теперь мгновенно обновляется при изменении разрешений роли',
        'Удалена ошибочно добавленная логика временного повышения прав для техников',
        'Очистка кода: исправлены ошибки типизации Fastify и удалены неиспользуемые импорты'
      ]
    },
    {
      version: '1.1.5',
      date: '24 апреля 2026',
      title: 'Техническое обслуживание и исправление API',
      changes: [
        'Исправлена критическая ошибка дублирования маршрута чата, приводившая к падению сервера',
        'Включена поддержка ignoreTrailingSlash для стабильной работы API (исправлены 404 при обращении к базе знаний)',
        'Исправлены ошибки типизации TypeScript в диагностических и тестовых скриптах',
        'Очистка базы данных от временных логов и неиспользуемых тестовых файлов'
      ]
    },
    {
      version: '1.1.4',
      date: '24 апреля 2026',
      title: 'Оптимизация работы с данными',
      changes: [
        'Оптимизация запросов Prisma Client для ускорения загрузки дашборда',
        'Исправление проблем с отображением SystemLog в IDE (устранение конфликтов типов)',
        'Очистка неиспользуемых импортов и оптимизация иконок в интерфейсе'
      ]
    },
    {
      version: '1.1.3',
      date: '24 апреля 2026',
      title: 'Стандартизация серверной архитектуры',
      changes: [
        'Стандартизация сигнатур маршрутов Fastify (удаление FastifyPluginOptions)',
        'Исправление логики валидации и проверки обязательных полей в базе знаний',
        'Улучшена обработка ошибок при создании новых записей'
      ]
    },
    {
      version: '1.1.2',
      date: '24 апреля 2026',
      title: 'Улучшение чата и безопасности',
      changes: [
        'Добавлена поддержка Socket.io для уведомлений в реальном времени',
        'Исправлен порядок аргументов в логгере ошибок для корректного вывода стека',
        'Обновлены схемы валидации Zod для всех входящих запросов'
      ]
    },
    {
      version: '1.1.1',
      date: '23 апреля 2026',
      title: 'Стабилизация и исправление ошибок',
      changes: [
        'Исправлены критические ошибки в модулях «Чат» и «База знаний»',
        'Оптимизирована работа Socket.io для стабильного соединения по локальной сети',
        'Разделена логика Справочника сотрудников и Управления пользователями CRM',
        'Удалены лишние пользователи из модуля управления, оставлены только администраторы и техники',
        'Исправлены ошибки типизации TypeScript в компонентах интерфейса'
      ]
    },
    {
      version: '1.1.0',
      date: '23 апреля 2026',
      title: 'Грандиозный переезд на БД',
      changes: [
        'Полный переход со статических mock-данных на реальную базу данных PostgreSQL',
        'Внедрение Docker и Docker Compose для развертывания инфраструктуры',
        'Миграция всех модулей: Заявки, Справочник, База знаний, Инвентарь, Документы',
        'Реализация полноценного API на Fastify',
        'Добавление панели управления сервером (Dashboard) для мониторинга логов'
      ]
    },
    {
      version: '1.0.0',
      date: 'Март 2026',
      title: 'Релиз первой версии',
      changes: [
        'Запуск базового функционала HelpDesk',
        'Создание интерфейса на React + Tailwind CSS',
        'Реализация системы ролей и прав доступа'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-4 py-4 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">О программе</h1>
      </div>

      <div className="p-4 max-w-3xl mx-auto space-y-6">
        {/* App Info */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-blue-500/20">
            <svg viewBox="0 0 100 100" className="w-12 h-12 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="7" />
              <circle cx="50" cy="50" r="10" fill="currentColor" />
              <path d="M50 82V65" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
              <path d="M25 45C25 30 36 18 50 18C64 18 75 30 75 45C75 55 65 65 50 65" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">MEDIN HelpDesk</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Система управления технической поддержкой</p>
          <div className="mt-4 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-bold border border-blue-100 dark:border-blue-800">
            Версия 1.1.5 Current
          </div>
        </div>

        {/* Tech Stack */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Database, label: 'PostgreSQL', color: 'text-blue-500' },
            { icon: Zap, label: 'Fastify', color: 'text-yellow-500' },
            { icon: ShieldCheck, label: 'Prisma', color: 'text-emerald-500' },
            { icon: Info, label: 'React', color: 'text-cyan-500' },
          ].map((item) => (
            <div key={item.label} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center gap-2">
              <item.icon className={`w-6 h-6 ${item.color}`} />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Version History */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <History className="w-5 h-5 text-slate-400" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200">История обновлений</h3>
          </div>

          {versions.map((v) => (
            <div 
              key={v.version} 
              className={`bg-white dark:bg-slate-800 rounded-xl p-5 border shadow-sm transition-all ${
                v.isCurrent 
                  ? 'border-blue-200 dark:border-blue-800 ring-4 ring-blue-50 dark:ring-blue-900/10' 
                  : 'border-slate-100 dark:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-black ${v.isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      v{v.version}
                    </span>
                    {v.isCurrent && (
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider border border-green-200 dark:border-green-800">
                        Текущая
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-medium">{v.date}</p>
                </div>
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">{v.title}</h4>
              <ul className="space-y-2">
                {v.changes.map((change, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 mt-1.5 flex-shrink-0" />
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 text-center">
          <p className="text-sm text-slate-400">© 2026 Медин IT-отдел</p>
        </div>
      </div>
    </div>
  );
}
