import { getUserByTelegramId } from '../db/users.js';
import { getTasksByStatus, getUpcomingDeadlines } from '../db/tasks.js';
import { getMainKeyboard, getProfileKeyboard } from './menu.js';
import { COURSES } from '../config/subjects.js';

function getDaysWord(n) {
  if (n === 1) return 'день';
  if (n >= 2 && n <= 4) return 'дня';
  return 'дней';
}

export async function handleProfile(ctx) {
  const telegramId = ctx.from.id;
  const user = await getUserByTelegramId(telegramId);

  if (!user) {
    await ctx.reply('⚠️ Ошибка загрузки профиля. Напиши /start');
    return;
  }

  const streak = user.study_streak || 0;
  const totalTasks = user.total_tasks || 0;
  const completedTasks = user.completed_tasks || 0;
  const totalTime = user.total_time_spent || 0;
  const hours = Math.floor(totalTime / 60);
  const minutes = totalTime % 60;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const pendingTasks = await getTasksByStatus(telegramId, 'pending');
  const upcomingDeadlines = await getUpcomingDeadlines(telegramId, 7);

  const courseName = user.course ? COURSES[user.course]?.name : 'не выбран';

  const profileText = `
👤 Твой профиль

━━━━━━━━━━━━━━━━━━
📅 <b>Курс:</b> ${courseName}
📚 <b>Предмет:</b> ${user.subject || 'не выбран'}
━━━━━━━━━━━━━━━━━━

🔥 <b>Серия:</b> ${streak} ${getDaysWord(streak)} подряд
📝 <b>Задания:</b> ${completedTasks} выполнено из ${totalTasks}
📊 <b>Прогресс:</b> ${completionRate}%
⏱️ <b>Время:</b> ${hours}ч ${minutes}мин

━━━━━━━━━━━━━━━━━━
📋 <b>Активных задач:</b> ${pendingTasks.length}
⏰ <b>Дедлайнов на неделе:</b> ${upcomingDeadlines.length}
━━━━━━━━━━━━━━━━━━

💡 Используй меню ниже для навигации!
`;

  await ctx.reply(profileText.trim(), {
    parse_mode: 'HTML',
    reply_markup: getProfileKeyboard(),
  });
}

export async function handleStats(ctx) {
  const telegramId = ctx.from.id;
  const user = await getUserByTelegramId(telegramId);

  if (!user) {
    await ctx.reply('⚠️ Ошибка загрузки статистики.');
    return;
  }

  const totalTasks = user.total_tasks || 0;
  const completedTasks = user.completed_tasks || 0;
  const pendingTasks = totalTasks - completedTasks;
  const totalTime = user.total_time_spent || 0;
  const hours = Math.floor(totalTime / 60);
  const minutes = totalTime % 60;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  let efficiency = '🌱 Начинающий';
  if (completionRate >= 90) efficiency = '⭐ Мастер';
  else if (completionRate >= 70) efficiency = '🔥 Прокаченный';
  else if (completionRate >= 50) efficiency = '📈 В процессе';
  else if (completionRate >= 25) efficiency = '🎯 Ученик';

  const statsText = `
📊 <b>Твоя статистика</b>

━━━━━━━━━━━━━━━━━━
📝 <b>Всего заданий:</b> ${totalTasks}
✅ <b>Выполнено:</b> ${completedTasks}
⏳ <b>В процессе:</b> ${pendingTasks}
━━━━━━━━━━━━━━━━━━

📊 <b>Эффективность:</b> ${completionRate}%
🏆 <b>Уровень:</b> ${efficiency}
⏱️ <b>Общее время:</b> ${hours}ч ${minutes}мин
━━━━━━━━━━━━━━━━━━

💡 ${completionRate >= 70 ? 'Отличный результат! Продолжай в том же духе!' : 'Разбивай задачи на мелкие шаги для лучшего результата!'}
`;

  await ctx.reply(statsText.trim(), {
    parse_mode: 'HTML',
    reply_markup: getMainKeyboard(),
  });
}