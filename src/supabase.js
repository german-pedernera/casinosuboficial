import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Si las variables no existen o son el texto de ejemplo, usamos valores válidos de relleno
// para que la app no crashee y el administrador pueda entrar
if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  supabaseUrl = 'https://placeholder.supabase.co';
}
if (!supabaseAnonKey || supabaseAnonKey === 'tu_anon_key_de_supabase_aqui') {
  supabaseAnonKey = 'placeholder';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

