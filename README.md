# LXP Help Bot 🤖

Telegram бот-тьютор для студентов IThub. Помогает закрывать долги в LXP, предоставляя пошаговую помощь с заданиями с помощью AI (Llama 3 70B через Groq API).

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Скопируй `.env.example` в `.env` и заполни значения:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Настройка базы данных

1. Перейди в [Supabase Dashboard](https://supabase.com/dashboard)
2. Выбери свой проект → SQL Editor
3. Выполни запросы из файла `schema.sql`

### 4. Запуск

```bash
# Режим разработки (с авто-перезагрузкой)
npm run dev

# Продакшен
npm start
```

## 📁 Структура проекта

```
lxp-help-bot/
├── src/
│   ├── bot/
│   │   ├── index.js           # Точка входа, инициализация бота
│   │   └── handlers/
│   │       ├── start.js       # Команды /start, /help
│   │       ├── subjects.js    # Выбор курса и предмета
│   │       ├── help.js        # Обработка заданий через AI
│   │       └── menu.js        # Генерация клавиатур
│   ├── ai/
│   │   ├── groq.js            # Интеграция с Groq API
│   │   └── prompts.js         # Системные промпты
│   ├── db/
│   │   ├── supabase.js        # Клиент Supabase
│   │   └── users.js           # Работа с таблицей users
│   └── config/
│       └── subjects.js        # Конфигурация предметов
├── .env                       # Переменные окружения (не коммитить!)
├── .env.example               # Шаблон для .env
├── schema.sql                 # SQL-миграция для Supabase
└── package.json
```

## 🎯 Возможности

- **Выбор курса и предмета** — интерактивное меню
- **Текстовые задания** — отправь текст, получи пошаговое решение
- **Скриншоты заданий** — отправь фото с заданием
- **Запоминание выбора** — бот помнит предмет между сессиями
- **Поддержка нескольких курсов** — архитектура для 1-4 курса

## 🔧 Конфигурация предметов

Предметы настраиваются в `src/config/subjects.js`:

```javascript
export const COURSES = {
  1: {
    name: '1 курс',
    subjects: [
      { id: 'english', name: 'Английский язык', emoji: '🌍' },
      // ...
    ],
  },
};
```

## 📝 Лицензия

MIT