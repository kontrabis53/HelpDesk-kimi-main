# 📦 Установка зависимостей для Phase 1

## Требуется установить:

```bash
npm install react-router-dom@^6.28.0 zustand@^5.0.2
```

## Опционально (для TypeScript):
```bash
npm install -D @types/react-router-dom
```

## После установки package.json будет содержать:

```json
{
  "dependencies": {
    ...existing dependencies...,
    "react-router-dom": "^6.28.0",
    "zustand": "^5.0.2"
  }
}
```

## Полная команда установки:

```bash
cd HelpDesk-kimi-main
npm install react-router-dom zustand
npm run dev
```

## Проверка установки:

После установки запустите:
```bash
npm list react-router-dom zustand
```

Должно вывести:
```
├── react-router-dom@6.28.0
└── zustand@5.0.2
```
