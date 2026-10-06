import { supabase } from './supabase.js';

/**
 * Создать новую задачу
 */
export async function createTask(telegramId, taskData) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      telegram_id: telegramId,
      title: taskData.title,
      description: taskData.description || null,
      subject: taskData.subject,
      course: taskData.course,
      deadline: taskData.deadline || null,
      priority: taskData.priority || 'medium',
      status: 'pending',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Ошибка создания задачи:', error);
    return null;
  }
  return data;
}

/**
 * Получить все задачи пользователя
 */
export async function getTasksByTelegramId(telegramId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('telegram_id', telegramId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data || [];
}

/**
 * Получить задачи по статусу
 */
export async function getTasksByStatus(telegramId, status) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('telegram_id', telegramId)
    .eq('status', status)
    .order('deadline', { ascending: true });

  if (error) return [];
  return data || [];
}

/**
 * Обновить статус задачи
 */
export async function updateTaskStatus(taskId, status) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', taskId)
    .select()
    .single();

  if (error) return null;
  return data;
}

/**
 * Удалить задачу
 */
export async function deleteTask(taskId) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  return !error;
}

/**
 * Получить задачи с дедлайнами
 */
export async function getUpcomingDeadlines(telegramId, days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('telegram_id', telegramId)
    .eq('status', 'pending')
    .lte('deadline', futureDate.toISOString())
    .order('deadline', { ascending: true });

  if (error) return [];
  return data || [];
}

/**
 * Добавить время к задаче
 */
export async function addTimeToTask(taskId, minutes) {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      time_spent: minutes
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) return null;
  return data;
}