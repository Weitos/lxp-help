import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Инициализация клиента Supabase с публичным ключом
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);