import 'dotenv/config';
import Groq from 'groq-sdk';
import { buildSystemPrompt, buildImagePrompt, buildTutorPrompt } from './prompts.js';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Модели
const MODEL_TEXT = 'llama-3.3-70b-versatile';
const MODEL_VISION = 'llama-3.2-11b-vision-preview';
const TEMPERATURE = 0.75;

/**
 * Получить ответ от Llama 3 через Groq API
 */
export async function getAIResponse(subjectName, userMessage, imageBase64 = null) {
  let model = MODEL_TEXT;
  let systemPrompt = buildSystemPrompt(subjectName, userMessage);
  let userContent = userMessage;

  // Если есть изображение - используем Vision модель
  if (imageBase64) {
    model = MODEL_VISION;
    systemPrompt = buildImagePrompt(subjectName);
    userContent = [
      { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
      { type: 'text', text: userMessage || 'Помоги решить это задание. Опиши что видишь на изображении.' }
    ];
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      temperature: TEMPERATURE,
      max_tokens: 4096,
    });

    return chatCompletion.choices[0]?.message?.content || 'Не удалось получить ответ. Попробуй ещё раз.';

  } catch (error) {
    console.error('Ошибка при запросе к Groq:', error);
    throw error;
  }
}

/**
 * Получить ответ для тьютора (улучшенный промпт)
 */
export async function getTutorResponse(subjectName, userMessage, context = {}) {
  const systemPrompt = buildTutorPrompt(subjectName, context);

  try {
    const chatCompletion = await groq.chat.completions.create({
      model: MODEL_TEXT,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: TEMPERATURE,
      max_tokens: 4096,
    });

    return chatCompletion.choices[0]?.message?.content || 'Не удалось получить ответ. Попробуй ещё раз.';

  } catch (error) {
    console.error('Ошибка при запросе к Groq:', error);
    throw error;
  }
}