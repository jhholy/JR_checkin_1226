import React from 'react';
import DashboardStats from '../DashboardStats';
import CheckInTrends from './CheckInTrends';
import MembershipDistribution from './MembershipDistribution';
import ExpiringMembersList from './ExpiringMembersList';
import DashboardHeader from './DashboardHeader';
import { useDashboardRefresh } from '../../../hooks/useDashboardRefresh';
import '../../../utils/chart/setup';

export default function DashboardLayout() {
  const { lastUpdate, autoRefresh, refresh, toggleAutoRefresh } = useDashboardRefresh({
    interval: 5 * 60 * 1000, // 5 minutes
    enabled: true
  });

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* 页面标题和控制区 */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">数据看板</h1>
        <DashboardHeader 
          lastUpdate={lastUpdate}
          autoRefresh={autoRefresh}
          onRefresh={refresh}
          onToggleAutoRefresh={toggleAutoRefresh}
        />
      </div>

      {/* 关键统计数据 */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">今日概览</h2>
        <DashboardStats />
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">签到趋势</h2>
          <CheckInTrends />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">会员卡分布</h2>
          <MembershipDistribution />
        </div>
      </div>

      {/* 到期会员列表 */}
      <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">即将到期会员</h2>
        <ExpiringMembersList />
      </div>

      {/* 底部间距 */}
      <div className="h-6" />
    </div>
  );
}