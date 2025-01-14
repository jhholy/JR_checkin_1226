import { createClient } from '@supabase/supabase-js';
import type { Member, CheckIn } from '../types/database';

// 定义数据库类型
interface Database {
  public: {
    Tables: {
      members: {
        Row: Member
        Insert: Omit<Member, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Member, 'id'>>
      }
      check_ins: {
        Row: CheckIn
        Insert: Omit<CheckIn, 'id' | 'created_at'>
        Update: Partial<Omit<CheckIn, 'id'>>
      }
    }
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

// 添加 checkAuth 函数
export const checkAuth = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[Auth] 获取会话失败:', error);
      throw error;
    }

    if (!session) {
      console.log('[Auth] 未登录');
      return null;
    }

    console.log('[Auth] 已登录:', session.user.email);
    return session;
  } catch (error) {
    console.error('[Auth] 检查认证状态失败:', error);
    return null;
  }
};

// 监听认证状态变化
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    console.log('[Auth] 用户已登录:', session.user.email);
  } else {
    console.log('[Auth] 用户已登出');
  }
});
