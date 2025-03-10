import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// 定义会员类型
interface Member {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
  member?: Member;
}

interface MemberAuthContextType {
  member: Member | null;
  isAuthenticated: boolean;
  login: (name: string, email: string) => Promise<LoginResult>;
  logout: () => void;
}

const MemberAuthContext = createContext<MemberAuthContextType | undefined>(undefined);

export function MemberAuthProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<Member | null>(null);

  // 初始化时检查本地存储的会员信息
  useEffect(() => {
    const storedMember = localStorage.getItem('member');
    if (storedMember) {
      try {
        setMember(JSON.parse(storedMember));
      } catch (error) {
        console.error('Failed to parse stored member:', error);
        localStorage.removeItem('member');
      }
    }
  }, []);

  // 登录函数
  const login = async (name: string, email: string): Promise<LoginResult> => {
    try {
      // 查询会员表
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('name', name)
        .eq('email', email)
        .single();

      if (error) {
        console.error('Login query error:', error);
        throw new Error('登录查询失败');
      }

      if (!data) {
        return {
          success: false,
          error: '会员信息不存在，请检查姓名和邮箱是否正确。'
        };
      }

      // 设置会员登录状态
      setMember(data);
      localStorage.setItem('member', JSON.stringify(data));

      return {
        success: true,
        member: data
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '登录失败，请重试。'
      };
    }
  };

  // 登出函数
  const logout = () => {
    setMember(null);
    localStorage.removeItem('member');
  };

  return (
    <MemberAuthContext.Provider value={{
      member,
      isAuthenticated: !!member,
      login,
      logout
    }}>
      {children}
    </MemberAuthContext.Provider>
  );
}

// 自定义Hook
export function useMemberAuth() {
  const context = useContext(MemberAuthContext);
  if (context === undefined) {
    throw new Error('useMemberAuth must be used within a MemberAuthProvider');
  }
  return context;
} 