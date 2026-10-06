import { Keyboard, InlineKeyboard } from 'grammy';
import { COURSES, getCourseSubjects } from '../config/subjects.js';

export function getCourseInlineMenu() {
  const keyboard = new InlineKeyboard();

  for (const [courseId, course] of Object.entries(COURSES)) {
    if (course.available !== false) {
      keyboard.text(`${course.emoji} ${course.name}`, `course_${courseId}`);
    } else {
      keyboard.text(`${course.emoji} ${course.name} (скоро)`, `course_locked_${courseId}`);
    }

    if (parseInt(courseId) % 2 === 0) {
      keyboard.row();
    }
  }

  return keyboard;
}

export function getSubjectsKeyboard(courseId) {
  const keyboard = new Keyboard();
  const subjects = getCourseSubjects(courseId);

  for (let i = 0; i < subjects.length; i++) {
    const subject = subjects[i];
    keyboard.text(`${subject.emoji} ${subject.name}`);

    if (i % 2 === 1 || i === subjects.length - 1) {
      keyboard.row();
    }
  }

  keyboard.text('🔙 Назад в профиль');

  return keyboard;
}

export function getMainKeyboard() {
  return new Keyboard()
    .text('📚 Предметы')
    .text('📋 Задачи')
    .row()
    .text('👤 Профиль')
    .text('📅 Дедлайны')
    .row()
    .text('❓ Помощь');
}

export function getTaskKeyboard() {
  return new Keyboard()
    .text('📋 Все задачи')
    .text('➕ Новая задача')
    .row()
    .text('🔄 Завершить')
    .text('🗑️ Удалить')
    .row()
    .text('🔙 Профиль');
}

export function getProfileKeyboard() {
  return new Keyboard()
    .text('📊 Статистика')
    .text('📈 Достижения')
    .row()
    .text('📚 Предметы')
    .text('🔄 Сменить курс')
    .row()
    .text('❓ Помощь');
}