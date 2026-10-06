import { getCourseInlineMenu } from './menu.js';

export async function handleStart(ctx) {
  const telegramId = ctx.from.id;
  const username = ctx.from.first_name;

  const { getOrCreateUser } = await import('../db/users.js');
  const user = await getOrCreateUser(telegramId);

  if (user) {
    ctx.session.courseId = user.course;
    ctx.session.subjectId = user.subject;
    ctx.session.state = user.course ? 'choosing_subject' : 'choosing_course';

    if (user.subject) {
      const { getSubjectById } = await import('../config/subjects.js');
      const subject = getSubjectById(user.subject);
      if (subject) {
        ctx.session.subjectName = subject.name;
        ctx.session.subjectEmoji = subject.emoji;
        ctx.session.state = 'awaiting_task';
      }
    }
  }

  const welcomeText = `
👋 <b>Привет, ${username}!</b>

Я — <b>LXP Help</b>, твой персональный тьютор.

━━━━━━━━━━━━━━━━━━
📚 Помогу разобраться с заданиями
⏰ Напомню о дедлайнах
📊 Покажу твой прогресс
━━━━━━━━━━━━━━━━━━

Выбери свой курс чтобы начать!
`;

  await ctx.reply(welcomeText.trim(), {
    parse_mode: 'HTML',
    reply_markup: getCourseInlineMenu(),
  });
}

export async function handleHelp(ctx) {
  const helpText = `
📖 <b>Как пользоваться ботом:</b>

━━━━━━━━━━━━━━━━━━
1️⃣ <b>Выбери курс</b> — нажми на кнопку с номером курса

2️⃣ <b>Выбери предмет</b> — нажми "📚 Предметы" в меню

3️⃣ <b>Отправь задание</b> — текстом или скриншотом

4️⃣ <b>Получи помощь</b> — я помогу разобраться шаг за шагом
━━━━━━━━━━━━━━━━━━

<b>Команды бота:</b>
• /start — перезапустить бота
• /profile — твой профиль
• /stats — статистика
• /tasks — список задач
• /deadlines — дедлайны
`;

  await ctx.reply(helpText.trim(), { parse_mode: 'HTML' });
}