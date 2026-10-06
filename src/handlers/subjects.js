import { getCourseInlineMenu, getSubjectsKeyboard, getMainKeyboard } from './menu.js';
import { getSubject, COURSES } from '../config/subjects.js';
import { updateUserSelection, updateStudyStreak, getUserByTelegramId } from '../db/users.js';
import { getTasksByStatus, getUpcomingDeadlines } from '../db/tasks.js';

function getDaysWord(n) {
  if (n === 1) return 'день';
  if (n >= 2 && n <= 4) return 'дня';
  return 'дней';
}

async function showProfileAfterCourse(ctx, courseId, course) {
  const telegramId = ctx.from.id;

  await updateUserSelection(telegramId, parseInt(courseId), null);
  await updateStudyStreak(telegramId);

  const user = await getUserByTelegramId(telegramId);
  const pendingTasks = await getTasksByStatus(telegramId, 'pending');
  const upcomingDeadlines = await getUpcomingDeadlines(telegramId, 7);

  const streak = user?.study_streak || 0;
  const totalTasks = user?.total_tasks || 0;
  const completedTasks = user?.completed_tasks || 0;
  const totalTime = user?.total_time_spent || 0;
  const hours = Math.floor(totalTime / 60);
  const minutes = totalTime % 60;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const profileText = `
👤 <b>Добро пожаловать!</b>

━━━━━━━━━━━━━━━━━━
📅 Курс: <b>${course.name}</b>
━━━━━━━━━━━━━━━━━━

📊 <b>Твой прогресс:</b>
🔥 Серия: ${streak} ${getDaysWord(streak)} подряд
📝 Задания: ${completedTasks}/${totalTasks} (${completionRate}%)
⏱️ Время: ${hours}ч ${minutes}мин

━━━━━━━━━━━━━━━━━━
📋 Активных задач: <b>${pendingTasks.length}</b>
⏰ Дедлайнов: <b>${upcomingDeadlines.length}</b>
━━━━━━━━━━━━━━━━━━

💡 Используй меню ниже:
`;

  await ctx.editMessageText(profileText.trim(), { parse_mode: 'HTML' });

  await ctx.reply('👋 Выбери действие:', {
    reply_markup: getMainKeyboard(),
  });

  await ctx.answerCallbackQuery(`Выбран ${course.name}`);
}

export async function handleCourseCallback(ctx, courseId) {
  ctx.session.courseId = parseInt(courseId);
  ctx.session.state = 'choosing_subject';

  const course = COURSES[courseId];
  await showProfileAfterCourse(ctx, courseId, course);
}

export async function handleSubjectReply(ctx, subjectId) {
  const telegramId = ctx.from.id;
  const courseId = ctx.session.courseId;

  if (!courseId) {
    await ctx.reply('❌ Сначала выбери курс!', {
      reply_markup: getCourseInlineMenu(),
    });
    return;
  }

  const subject = getSubject(courseId, subjectId);
  if (!subject) {
    await ctx.reply('⚠️ Предмет не найден.', {
      reply_markup: getSubjectsKeyboard(courseId),
    });
    return;
  }

  ctx.session.subjectId = subjectId;
  ctx.session.subjectName = subject.name;
  ctx.session.subjectEmoji = subject.emoji;
  ctx.session.state = 'awaiting_task';

  await updateUserSelection(telegramId, courseId, subjectId);

  await ctx.reply(
    `${subject.emoji} <b>${subject.name}</b>\n\n📝 Отправь задание текстом или скриншотом — помогу разобраться!`,
    { parse_mode: 'HTML', reply_markup: getMainKeyboard() }
  );
}

export async function handleShowSubjects(ctx) {
  const courseId = ctx.session.courseId;

  if (!courseId) {
    await ctx.reply('❌ Сначала выбери курс!', {
      reply_markup: getCourseInlineMenu(),
    });
    return;
  }

  await ctx.reply(
    '📚 <b>Выбери предмет:</b>',
    { parse_mode: 'HTML', reply_markup: getSubjectsKeyboard(courseId) }
  );
}

export async function handleChangeCourse(ctx) {
  ctx.session.state = 'choosing_course';
  ctx.session.subjectId = null;

  await ctx.reply('🔄 <b>Выбери курс:</b>', {
    parse_mode: 'HTML',
    reply_markup: getCourseInlineMenu(),
  });
}

export async function handleBackToCourses(ctx) {
  ctx.session.state = 'choosing_course';
  ctx.session.courseId = null;
  ctx.session.subjectId = null;

  await ctx.reply('🔄 <b>Выбери курс:</b>', {
    parse_mode: 'HTML',
    reply_markup: getCourseInlineMenu(),
  });
}