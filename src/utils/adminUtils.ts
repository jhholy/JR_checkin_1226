import { supabase } from '../lib/supabase';

export const signInAdmin = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        redirectTo: window.location.origin // Ensure proper redirect
      }
    });

    if (error) {
      throw new Error('登录失败，请检查邮箱和密码。Login failed, please check your email and password.');
    }

    // Ensure we have a session
    if (!data.session) {
      throw new Error('登录失败，未获取到会话。Login failed, no session received.');
    }

    // Update headers with new access token
    supabase.rest.headers.set('Authorization', `Bearer ${data.session.access_token}`);

    return data;
  } catch (error) {
    console.error('Admin login error:', error);
    throw error;
  }
};

export const signOutAdmin = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Reset to anon key
    supabase.rest.headers.set('Authorization', `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`);
  } catch (error) {
    console.error('Admin logout error:', error);
    throw error;
  }
};