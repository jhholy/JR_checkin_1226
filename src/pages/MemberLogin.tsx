import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMemberAuth } from '../contexts/MemberAuthContext';
import { supabase } from '../lib/supabase';
import { User } from 'lucide-react';

export function MemberLogin() {
  const navigate = useNavigate();
  const { setMember } = useMemberAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('name', name)
        .eq('email', email)
        .single();

      if (error) {
        throw new Error('登录失败，请重试');
      }

      if (!data) {
        throw new Error('会员信息不存在，请检查姓名和邮箱是否正确');
      }

      setMember(data);
      localStorage.setItem('member', JSON.stringify(data));
      navigate('/member');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <User className="w-12 h-12 text-muaythai-blue mx-auto mb-4" />
          <h1 className="text-2xl font-bold">会员登录 Member Login</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              姓名 Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              邮箱 Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            className="w-full bg-[#4285F4] text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? '登录中... Logging in...' : '登录 Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default MemberLogin;