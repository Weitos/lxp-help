import 'dotenv/config';
import { Bot, session } from 'grammy';
import { handleStart, handleHelp } from './handlers/start.js';
import { handleCourseCallback, handleSubjectReply, handleShowSubjects, handleChangeCourse, handleBackToCourses } from './handlers/subjects.js';
import { handleTask } from './handlers/help.js';
import { handleProfile, handleStats } from './handlers/profile.js';
import { handleAddTask, handleListTasks, handleDeadlines, handleDeleteTask } from './handlers/tasks.js';
import { getCourseInlineMenu, getSubjectsKeyboard, getMainKeyboard, getTaskKeyboard } from './handlers/menu.js';
import { getCourseSubjects, getSubjectById } from './config/subjects.js';
import { getOrCreateUser, setUserPaid, setAdmin, incrementTaskStats, updateUserSelection } from './db/users.js';
import { updateTaskStatus, createTask } from './db/tasks.js';

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

bot.use(session({
  initial: () => ({
    state: 'choosing_course',
    courseId: null,
    subjectId: null,
    subjectName: null,
    subjectEmoji: null,
    taskStep: null,
    taskData: {},
  }),
}));

bot.use(async (ctx, next) => {
  const telegramId = ctx.from.id;
  const text = ctx.message?.text || '';

  if (text.startsWith('/admin')) {
    return next();
  }

  const user = await getOrCreateUser(telegramId);
  if (!user) {
    await ctx.reply('⚠️ Ошибка системы. Попробуйте позже.');
    return;
  }

  if (user.is_admin) {
    return next();
  }

  if (!user.is_paid) {
    await ctx.reply(`
💰 <b>Закрытый бета-тест</b>

Для доступа необходимо оплатить 2000 руб.

📱 Оплата: @ivaxxo
💳 Сумма: 2000 ₽

После оплаты напишите @ivaxxo.
`, { parse_mode: 'HTML' });
    return;
  }

  return next();
});

bot.command('start', handleStart);
bot.command('help', handleHelp);
bot.command('profile', handleProfile);
bot.command('stats', handleStats);
bot.command('tasks', handleListTasks);
bot.command('deadlines', handleDeadlines);

bot.command('admin', async (ctx) => {
  const telegramId = ctx.from.id;
  const user = await getOrCreateUser(telegramId);

  if (!user?.is_admin) {
    await ctx.reply('⛔ Доступ запрещён.');
    return;
  }

  const args = ctx.message.text.split(' ').slice(1);
  const action = args[0];
  const targetId = parseInt(args[1]);

  if (action === 'grant' && targetId) {
    await setUserPaid(targetId, true);
    await ctx.reply(`✅ Пользователю ${targetId} предоставлен доступ.`);
  } else if (action === 'revoke' && targetId) {
    await setUserPaid(targetId, false);
    await ctx.reply(`❌ Доступ отозван.`);
  } else if (action === 'makeadmin' && targetId) {
    await setAdmin(targetId, true);
    await ctx.reply(`✅ Пользователь ${targetId} — админ.`);
  } else if (action === 'removeadmin' && targetId) {
    await setAdmin(targetId, false);
    await ctx.reply(`❌ Админ удалён.`);
  } else {
    await ctx.reply('/grant | /revoke | /makeadmin | /removeadmin <id>');
  }
});

bot.callbackQuery(/^course_(\d+)$/, async (ctx) => {
  await handleCourseCallback(ctx, ctx.match[1]);
});

bot.callbackQuery(/^course_locked_(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery('⏳ Скоро будет!', { show_alert: true });
});

bot.hears('📚 Предметы', handleShowSubjects);
bot.hears('🔄 Сменить курс', handleChangeCourse);
bot.hears('❓ Помощь', handleHelp);
bot.hears('🔙 Назад в профиль', handleProfile);
bot.hears('🔙 Профиль', handleProfile);

bot.hears('👤 Профиль', handleProfile);
bot.hears('📊 Статистика', handleStats);

bot.hears('📋 Задачи', handleListTasks);
bot.hears('📋 Все задачи', handleListTasks);
bot.hears('📅 Дедлайны', handleDeadlines);

bot.hears('➕ Новая задача', async (ctx) => {
  ctx.session.state = 'adding_task_title';
  ctx.session.taskStep = 'title';
  ctx.session.taskData = {};
  await ctx.reply('📝 <b>Новая задача</b>\n\nВведи название задачи:', { parse_mode: 'HTML' });
});

bot.hears('🗑️ Удалить', async (ctx) => {
  await ctx.reply('🗑️ Введи ID задачи для удаления:', { reply_markup: getTaskKeyboard() });
  ctx.session.state = 'deleting_task';
});

bot.hears('🔄 Завершить', async (ctx) => {
  await ctx.reply('🔄 Введи ID задачи для завершения:', { reply_markup: getTaskKeyboard() });
  ctx.session.state = 'completing_task';
});

bot.on('message:text', async (ctx) => {
  const text = ctx.message.text;
  if (text.startsWith('/')) return;

  const { state, courseId, subjectId, taskStep } = ctx.session;

  // Добавление задачи - шаг название
  if (state === 'adding_task_title') {
    if (text === '❌ Отмена') {
      ctx.session.state = 'awaiting_task';
      await ctx.reply('❌ Отменено.', { reply_markup: getMainKeyboard() });
      return;
    }

    ctx.session.taskData.title = text;
    ctx.session.state = 'adding_task_subject';
    ctx.session.taskStep = 'subject';

    const course = courseId ? COURSES[courseId] : null;
    const subjects = course ? course.subjects : [];

    if (subjects.length > 0) {
      const kb = new (await import('grammy')).Keyboard().text('📝 Без предмета').row();
      for (const s of subjects) {
        kb.text(`${s.emoji} ${s.name}`);
      }
      await ctx.reply('🎯 <b>Выбери предмет:</b>', { parse_mode: 'HTML', reply_markup: kb });
    } else {
      await createTask(ctx.from.id, ctx.session.taskData);
      await ctx.reply('✅ <b>Задача создана!</b>', { parse_mode: 'HTML', reply_markup: getTaskKeyboard() });
      ctx.session.state = 'awaiting_task';
    }
    return;
  }

  // Добавление задачи - шаг предмет
  if (state === 'adding_task_subject') {
    if (text === '📝 Без предмета') {
      ctx.session.taskData.subject = null;
    } else {
      const subject = getSubjectById(text) || getSubjectById(text.replace(/[^\w]/g, ''));
      ctx.session.taskData.subject = subject?.name || null;
    }

    ctx.session.state = 'adding_task_deadline';
    ctx.session.taskStep = 'deadline';

    const kb = new (await import('grammy')).Keyboard()
      .text('📅 Через 1 день').text('📅 Через 3 дня')
      .text('📅 Через 1 неделю').text('📅 Без срока')
      .row().text('❌ Отмена');

    await ctx.reply('📅 <b>Установи дедлайн:</b>', { parse_mode: 'HTML', reply_markup: kb });
    return;
  }

  // Добавление задачи - шаг дедлайн
  if (state === 'adding_task_deadline') {
    if (text === '❌ Отмена') {
      ctx.session.state = 'awaiting_task';
      await ctx.reply('❌ Отменено.', { reply_markup: getMainKeyboard() });
      return;
    }

    let deadline = null;
    if (text === '📅 Через 1 день') {
      deadline = new Date(Date.now() + 86400000);
    } else if (text === '📅 Через 3 дня') {
      deadline = new Date(Date.now() + 86400000 * 3);
    } else if (text === '📅 Через 1 неделю') {
      deadline = new Date(Date.now() + 86400000 * 7);
    }

    if (deadline) {
      ctx.session.taskData.deadline = deadline.toISOString();
    }

    await handleAddTask(ctx, ctx.session.taskData);
    ctx.session.state = 'awaiting_task';
    return;
  }

  // Завершение задачи
  if (state === 'completing_task') {
    const taskId = parseInt(text);
    if (!isNaN(taskId)) {
      await updateTaskStatus(taskId, 'completed');
      await incrementTaskStats(ctx.from.id, true);
      await ctx.reply('✅ <b>Задача выполнена!</b>', { parse_mode: 'HTML', reply_markup: getTaskKeyboard() });
    }
    ctx.session.state = 'awaiting_task';
    return;
  }

  // Удаление задачи
  if (state === 'deleting_task') {
    const taskId = parseInt(text);
    if (!isNaN(taskId)) {
      await handleDeleteTask(ctx, taskId);
    }
    ctx.session.state = 'awaiting_task';
    return;
  }

  // Выбор предмета
  if (courseId && (state === 'choosing_subject' || state === 'awaiting_task')) {
    const subjects = getCourseSubjects(courseId);
    for (const subject of subjects) {
      const subjectOption = `${subject.emoji} ${subject.name}`;
      if (text === subjectOption) {
        await handleSubjectReply(ctx, subject.id);
        return;
      }
    }
  }

  // Задание
  if (state === 'awaiting_task' && subjectId) {
    await handleTask(ctx, text);
    return;
  }

  if (state === 'choosing_course') {
    await ctx.reply('👋 Выбери курс из меню выше:');
  }
});

bot.on('message:photo', async (ctx) => {
  const { subjectId, subjectName, subjectEmoji, state } = ctx.session;

  if (state !== 'awaiting_task' || !subjectId) {
    await ctx.reply('❌ Сначала выбери предмет в меню.');
    return;
  }

  await ctx.reply('🖼️ Обрабатываю...');

  try {
    const photoUrl = await ctx.api.getFile(ctx.message.photo[ctx.message.photo.length - 1].file_id);
    const fullUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${photoUrl.file_path}`;

    const photoResponse = await fetch(fullUrl);
    const photoBuffer = await photoResponse.arrayBuffer();
    const photoBase64 = Buffer.from(photoBuffer).toString('base64');

    const caption = ctx.message.caption || 'Помоги решить';

    const { getAIResponse } = await import('./ai/groq.js');
    const response = await getAIResponse(subjectName, caption, photoBase64);

    await ctx.reply(`${subjectEmoji} <b>${subjectName}</b>\n\n${response}`, {
      parse_mode: 'HTML',
      reply_markup: getMainKeyboard(),
    });

    const { updateLastActivity } = await import('./db/users.js');
    await updateLastActivity(ctx.from.id);

  } catch (error) {
    console.error('Ошибка:', error);
    await ctx.reply('😔 Ошибка. Попробуй текстом.', { reply_markup: getMainKeyboard() });
  }
});

bot.catch((err) => {
  console.error('Ошибка бота:', err);
});

console.log('🚀 LXP Help Bot запускается...');
console.log('⏰', new Date().toLocaleString('ru-RU'));

bot.start().then(() => {
  console.log('✅ Бот запущен!');
}).catch((error) => {
  console.error('❌ Ошибка:', error);
  process.exit(1);
});