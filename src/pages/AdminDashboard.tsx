import React, { useState, useEffect } from 'react';
import { Shield, Users, CalendarCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import AdminLogin from '../components/AdminLogin';
import NetworkError from '../components/common/NetworkError';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { supabase } from '../lib/supabase';

// 直接导入所有组件
import MemberList from '../components/admin/MemberList';
import CheckInRecordsList from '../components/admin/CheckInRecordsList';
import ExcelImport from '../components/admin/ExcelImport';
import DataExport from '../components/admin/DataExport';
import TrainerList from '../components/admin/TrainerList';

type ActiveTab = 'members' | 'checkins' | 'trainers' | 'import' | 'export';

type DashboardStats = {
  totalMembers: number;
  todayCheckins: number;
  extraCheckins: number;
  expiringMembers: number;
};

export default function AdminDashboard() {
  const { user, loading, error, retry } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('members');
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    todayCheckins: 0,
    extraCheckins: 0,
    expiringMembers: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      
      // 获取今日日期（设置为当天开始）
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // 获取7天后的日期（设置为当天结束）
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      sevenDaysLater.setHours(23, 59, 59, 999);

      // 格式化日期
      const todayStr = today.toISOString();
      const sevenDaysLaterStr = sevenDaysLater.toISOString();

      // 并行获取各项统计数据
      const [
        { count: totalMembers },
        { count: todayCheckins },
        { count: extraCheckins },
        { count: expiringMembers }
      ] = await Promise.all([
        // 总会员数
        supabase
          .from('members')
          .select('*', { count: 'exact', head: true }),
        
        // 今日签到数
        supabase
          .from('check_ins')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayStr),
        
        // 额外签到数
        supabase
          .from('check_ins')
          .select('*', { count: 'exact', head: true })
          .eq('is_extra', true)
          .gte('created_at', todayStr),
        
        // 即将过期会员数（从membership_cards表查询）
        supabase
          .from('membership_cards')
          .select('member_id', { count: 'exact', head: true })
          .not('valid_until', 'is', null)
          .lte('valid_until', sevenDaysLaterStr)
          .gt('valid_until', todayStr)
          .order('valid_until', { ascending: true })
      ]);

      setStats({
        totalMembers: totalMembers || 0,
        todayCheckins: todayCheckins || 0,
        extraCheckins: extraCheckins || 0,
        expiringMembers: expiringMembers || 0
      });
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <NetworkError onRetry={retry} />;
  if (!user) return <AdminLogin onSuccess={() => window.location.reload()} />;

  const tabs = [
    { id: 'members', label: '会员管理' },
    { id: 'checkins', label: '签到记录' },
    { id: 'trainers', label: '教练管理' },
    { id: 'import', label: '数据导入' },
    { id: 'export', label: '数据导出' },
  ];

  const StatCard = ({ title, value, icon: Icon, color }: { 
    title: string;
    value: number;
    icon: typeof Users;
    color: string;
  }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-[#4285F4]" />
                <span className="text-lg font-medium">管理后台</span>
              </div>
              <div className="flex gap-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                    className={`relative py-2 text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'text-[#4285F4] font-medium'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4285F4]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        {!statsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="总会员数"
              value={stats.totalMembers}
              icon={Users}
              color="bg-blue-500"
            />
            <StatCard
              title="今日签到"
              value={stats.todayCheckins}
              icon={CalendarCheck}
              color="bg-green-500"
            />
            <StatCard
              title="今日额外签到"
              value={stats.extraCheckins}
              icon={AlertCircle}
              color="bg-orange-500"
            />
            <StatCard
              title="即将过期会员"
              value={stats.expiringMembers}
              icon={AlertCircle}
              color="bg-red-500"
            />
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'members' && <MemberList />}
        {activeTab === 'checkins' && <CheckInRecordsList />}
        {activeTab === 'trainers' && <TrainerList />}
        {activeTab === 'import' && <ExcelImport />}
        {activeTab === 'export' && <DataExport />}
      </main>
    </div>
  );
}