import { getMainKeyboard } from './menu.js';
import { getAIResponse } from '../ai/groq.js';
import { updateLastActivity } from '../db/users.js';

/**
 * Обработчик текстовых сообщений с заданиями
 */
export async function handleTask(ctx, text) {
  const telegramId = ctx.from.id;
  const { subjectId, subjectName, subjectEmoji, state } = ctx.session;

  if (state !== 'awaiting_task' || !subjectId) {
    await ctx.reply('❌ Сначала выбери предмет через меню.');
    return;
  }

  await ctx.reply('🤔 Думаю над решением...');

  try {
    const response = await getAIResponse(subjectName, text);

    const answerText = `${subjectEmoji} <b>${subjectName}</b>\n\n${response}`;

    await ctx.reply(answerText.trim(), {
      parse_mode: 'HTML',
      reply_markup: getMainKeyboard(),
    });

    await updateLastActivity(telegramId);

  } catch (error) {
    console.error('Ошибка при обработке задания:', error);
    await ctx.reply(
      '😔 Произошла ошибка. Попробуй ещё раз.',
      { reply_markup: getMainKeyboard() }
    );
  }
}