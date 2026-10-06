import { supabase } from './supabase.js';

/**
 * Получить данные пользователя
 */
export async function getUserByTelegramId(telegramId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (error) return null;
  return data;
}

/**
 * Создать нового пользователя
 */
export async function createUser(telegramId) {
  const { data, error } = await supabase
    .from('users')
    .insert({
      telegram_id: telegramId,
      is_paid: false,
      is_admin: false,
      study_streak: 0,
      total_tasks: 0,
      completed_tasks: 0,
      total_time_spent: 0
    })
    .select()
    .single();

  if (error) {
    console.error('Ошибка создания пользователя:', error);
    return null;
  }
  return data;
}

/**
 * Получить или создать пользователя
 */
export async function getOrCreateUser(telegramId) {
  let user = await getUserByTelegramId(telegramId);
  if (!user) {
    user = await createUser(telegramId);
  }
  return user;
}

/**
 * Обновить курс и предмет
 */
export async function updateUserSelection(telegramId, courseId, subjectId) {
  const { data, error } = await supabase
    .from('users')
    .update({
      course: courseId,
      subject: subjectId,
      last_activity: new Date().toISOString()
    })
    .eq('telegram_id', telegramId)
    .select()
    .single();

  if (error) {
    console.error('Ошибка обновления:', error);
    return null;
  }
  return data;
}

/**
 * Обновить время активности
 */
export async function updateLastActivity(telegramId) {
  await supabase
    .from('users')
    .update({ last_activity: new Date().toISOString() })
    .eq('telegram_id', telegramId);
}

/**
 * Проверить статус оплаты
 */
export async function isUserPaid(telegramId) {
  const user = await getUserByTelegramId(telegramId);
  return user && user.is_paid === true;
}

/**
 * Проверить статус админа
 */
export async function isAdmin(telegramId) {
  const user = await getUserByTelegramId(telegramId);
  return user && user.is_admin === true;
}

/**
 * Установить статус оплаты
 */
export async function setUserPaid(telegramId, isPaid) {
  const { data, error } = await supabase
    .from('users')
    .update({ is_paid: isPaid })
    .eq('telegram_id', telegramId)
    .select()
    .single();

  if (error) return null;
  return data;
}

/**
 * Установить статус админа
 */
export async function setAdmin(telegramId, isAdminStatus) {
  const { data, error } = await supabase
    .from('users')
    .update({ is_admin: isAdminStatus })
    .eq('telegram_id', telegramId)
    .select()
    .single();

  if (error) return null;
  return data;
}

/**
 * Обновить статистику пользователя
 */
export async function updateUserStats(telegramId, stats) {
  const { data, error } = await supabase
    .from('users')
    .update(stats)
    .eq('telegram_id', telegramId)
    .select()
    .single();

  if (error) return null;
  return data;
}

/**
 * Инкремент счётчика задач
 */
export async function incrementTaskStats(telegramId, completed = false) {
  const user = await getUserByTelegramId(telegramId);
  if (!user) return null;

  const updates = {
    total_tasks: (user.total_tasks || 0) + 1,
    last_activity: new Date().toISOString()
  };

  if (completed) {
    updates.completed_tasks = (user.completed_tasks || 0) + 1;
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('telegram_id', telegramId)
    .select()
    .single();

  return data;
}

/**
 * Добавить время к общему времени
 */
export async function addStudyTime(telegramId, minutes) {
  const user = await getUserByTelegramId(telegramId);
  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .update({
      total_time_spent: (user.total_time_spent || 0) + minutes,
      last_activity: new Date().toISOString()
    })
    .eq('telegram_id', telegramId)
    .select()
    .single();

  return data;
}

/**
 * Обновить серию дней
 */
export async function updateStudyStreak(telegramId) {
  const user = await getUserByTelegramId(telegramId);
  if (!user) return null;

  const lastActivity = user.last_activity ? new Date(user.last_activity) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let newStreak = user.study_streak || 0;

  if (lastActivity) {
    const lastDate = new Date(lastActivity);
    lastDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Следующий день подряд
      newStreak += 1;
    } else if (diffDays > 1) {
      // Серия сломана
      newStreak = 1;
    }
    // diffDays === 0 — тот же день, не меняем
  } else {
    newStreak = 1;
  }

  const { data, error } = await supabase
    .from('users')
    .update({
      study_streak: newStreak,
      last_activity: new Date().toISOString()
    })
    .eq('telegram_id', telegramId)
    .select()
    .single();

  return data;
}