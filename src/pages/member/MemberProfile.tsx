import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useMemberAuth } from '../../contexts/MemberAuthContext';
import { User, Mail, Phone, Calendar, Hash } from 'lucide-react';

interface MemberProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

// 根据时间返回不同的问候语
function getTimeBasedGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "早上好 Good Morning";
  if (hour < 18) return "下午好 Good Afternoon";
  return "晚上好 Good Evening";
}

export function MemberProfile() {
  const { member } = useMemberAuth();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        if (!member?.id) return;

        const { data, error } = await supabase
          .from('members')
          .select('*')
          .eq('id', member.id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setProfile(data);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('获取会员信息失败');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [member?.id]);

  if (loading) {
    return <div className="p-4">加载中...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  if (!profile) {
    return <div className="p-4">未找到会员信息</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* 个性化欢迎信息 */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-medium text-lg">
          {getTimeBasedGreeting()}, {profile.name}! 
          <span className="text-sm font-normal ml-2">欢迎回来 Welcome back</span>
        </h3>
      </div>
      
      <h2 className="text-2xl font-bold mb-6">会员资料 Member Profile</h2>
      
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center space-x-4">
          <User className="w-6 h-6 text-gray-500" />
          <div>
            <div className="text-sm text-gray-500">姓名 Name</div>
            <div className="font-medium">{profile.name}</div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Mail className="w-6 h-6 text-gray-500" />
          <div>
            <div className="text-sm text-gray-500">邮箱 Email</div>
            <div className="font-medium">{profile.email}</div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Phone className="w-6 h-6 text-gray-500" />
          <div>
            <div className="text-sm text-gray-500">电话 Phone</div>
            <div className="font-medium">{profile.phone || '未设置'}</div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Calendar className="w-6 h-6 text-gray-500" />
          <div>
            <div className="text-sm text-gray-500">注册时间 Registration Date</div>
            <div className="font-medium">
              {new Date(profile.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Hash className="w-6 h-6 text-gray-500" />
          <div>
            <div className="text-sm text-gray-500">会员ID Member ID</div>
            <div className="font-medium">{profile.id}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemberProfile; 