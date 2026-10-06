import { getMainKeyboard, getTaskKeyboard, getSubjectsKeyboard } from './menu.js';
import { createTask, getTasksByTelegramId, updateTaskStatus, deleteTask, getUpcomingDeadlines } from '../db/tasks.js';

export async function handleAddTask(ctx, taskData) {
  const telegramId = ctx.from.id;

  if (!taskData.title) {
    ctx.session.state = 'adding_task_title';
    ctx.session.taskData = {};
    ctx.session.taskStep = 'title';
    await ctx.reply('📝 <b>Новая задача</b>\n\nВведи название задачи:', {
      parse_mode: 'HTML',
      reply_markup: new (await import('grammy')).Keyboard().text('❌ Отмена'),
    });
    return;
  }

  const task = await createTask(telegramId, taskData);

  if (task) {
    let text = `✅ <b>Задача добавлена!</b>\n\n`;
    text += `📋 <b>${task.title}</b>\n`;
    text += `🎯 Предмет: ${task.subject || 'не указан'}\n`;

    if (task.deadline) {
      const deadline = new Date(task.deadline);
      const formatted = deadline.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
      text += `📅 Дедлайн: ${formatted}`;
    }

    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: getTaskKeyboard(),
    });
  } else {
    await ctx.reply('😔 Не удалось создать задачу.', {
      reply_markup: getMainKeyboard(),
    });
  }
}

export async function handleListTasks(ctx) {
  const telegramId = ctx.from.id;
  const tasks = await getTasksByTelegramId(telegramId);

  if (tasks.length === 0) {
    await ctx.reply('📋 <b>Задач пока нет</b>\n\nНажми "➕ Новая задача" чтобы создать первую!', {
      parse_mode: 'HTML',
      reply_markup: getTaskKeyboard(),
    });
    return;
  }

  const pending = tasks.filter(t => t.status === 'pending');
  const completed = tasks.filter(t => t.status === 'completed');

  let text = '📋 <b>Твои задачи</b>\n\n';

  if (pending.length > 0) {
    text += '━━━━━━━━━━━━━━━━━━\n';
    text += '⏳ <b>В процессе:</b>\n';
    text += '━━━━━━━━━━━━━━━━━━\n';
    for (const task of pending.slice(0, 10)) {
      const deadline = task.deadline ? new Date(task.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '';
      const priority = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
      text += `${priority} <b>${task.id}.</b> ${task.title}${deadline ? ` 📅${deadline}` : ''}\n`;
    }
  }

  if (completed.length > 0) {
    text += '\n━━━━━━━━━━━━━━━━━━\n';
    text += '✅ <b>Выполнено:</b>\n';
    text += '━━━━━━━━━━━━━━━━━━\n';
    for (const task of completed.slice(0, 3)) {
      text += `✔ ${task.title}\n`;
    }
  }

  await ctx.reply(text.trim(), {
    parse_mode: 'HTML',
    reply_markup: getTaskKeyboard(),
  });
}

export async function handleDeadlines(ctx) {
  const telegramId = ctx.from.id;
  const deadlines = await getUpcomingDeadlines(telegramId, 7);

  if (deadlines.length === 0) {
    await ctx.reply('✅ <b>Нет задач с дедлайнами!</b>\n\nТы молодец! Все дела под контролем! 🎉', {
      parse_mode: 'HTML',
      reply_markup: getMainKeyboard(),
    });
    return;
  }

  let text = '⏰ <b>Дедлайны на неделю</b>\n\n';

  for (const task of deadlines.slice(0, 5)) {
    const deadline = new Date(task.deadline);
    const now = new Date();
    const diffMs = deadline - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    let urgency = '🟢';
    if (diffHours < 24) urgency = '🔴';
    else if (diffDays < 3) urgency = '🟡';

    const formattedDate = deadline.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });

    text += `━━━━━━━━━━━━━━━━━━\n`;
    text += `${urgency} <b>${task.title}</b>\n`;
    text += `📅 ${formattedDate}\n`;
    text += `🎯 ${task.subject || 'без предмета'}\n`;
    text += `⏰ Осталось: ${diffDays > 0 ? diffDays + ' дн' : diffHours + ' ч'}\n`;
  }

  text += '\n━━━━━━━━━━━━━━━━━━\n';
  text += '💡 Нажми "📚 Предметы" чтобы начать решать задание!';

  await ctx.reply(text.trim(), {
    parse_mode: 'HTML',
    reply_markup: getMainKeyboard(),
  });
}

export async function handleDeleteTask(ctx, taskId) {
  const success = await deleteTask(taskId);

  if (success) {
    await ctx.reply('🗑️ <b>Задача удалена!</b>', {
      parse_mode: 'HTML',
      reply_markup: getTaskKeyboard(),
    });
  } else {
    await ctx.reply('😔 Не удалось удалить задачу.', {
      reply_markup: getMainKeyboard(),
    });
  }
}