-- =====================================================
-- LXP Help Bot - Структура базы данных Supabase
-- =====================================================

-- Расширение для генерации ID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- Таблица пользователей
-- =====================================================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    course INT,
    subject VARCHAR(100),
    is_paid BOOLEAN DEFAULT false,
    is_admin BOOLEAN DEFAULT false,
    study_streak INT DEFAULT 0,
    total_tasks INT DEFAULT 0,
    completed_tasks INT DEFAULT 0,
    total_time_spent INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_telegram_id ON users(telegram_id);

-- =====================================================
-- Таблица задач (Time Management)
-- =====================================================
CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    course INT,
    deadline TIMESTAMPTZ,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'pending',
    time_spent INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_telegram_id ON tasks(telegram_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- Автоматическое обновление last_activity
-- =====================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_tasks_timestamp
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();
    