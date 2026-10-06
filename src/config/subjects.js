/**
 * Конфигурация предметов по курсам
 */

export const COURSES = {
  1: {
    name: '1 курс',
    emoji: '1️⃣',
    subjects: [
      { id: 'english', name: 'Английский язык', emoji: '🌍' },
      { id: 'logic', name: 'Логика и критическое мышление', emoji: '🧠' },
      { id: 'it', name: 'Информационные технологии', emoji: '💻' },
      { id: 'math', name: 'Математика', emoji: '📐' },
      { id: 'business', name: 'Основы предпринимательства', emoji: '💼' },
      { id: 'russian', name: 'Русский язык', emoji: '📝' },
      { id: 'literature', name: 'Литература', emoji: '📚' },
      { id: 'history', name: 'История', emoji: '🏛️' },
    ],
  },
  2: {
    name: '2 курс',
    emoji: '2️⃣',
    available: false,
    subjects: [],
  },
  3: {
    name: '3 курс',
    emoji: '3️⃣',
    available: false,
    subjects: [],
  },
  4: {
    name: '4 курс',
    emoji: '4️⃣',
    available: false,
    subjects: [],
  },
};

/**
 * Получить предмет по ID курса и ID предмета
 */
export function getSubject(courseId, subjectId) {
  const course = COURSES[courseId];
  if (!course) return null;
  return course.subjects.find((s) => s.id === subjectId) || null;
}

/**
 * Получить предмет по ID предмета (без курса)
 */
export function getSubjectById(subjectId) {
  for (const course of Object.values(COURSES)) {
    const subject = course.subjects.find((s) => s.id === subjectId);
    if (subject) return subject;
  }
  return null;
}

export function getCourseSubjects(courseId) {
  const course = COURSES[courseId];
  if (!course) return [];
  return course.subjects;
}

export function isCourseAvailable(courseId) {
  const course = COURSES[courseId];
  return course && course.available !== false;
}