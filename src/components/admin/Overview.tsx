import React from 'react';
import { Users, CalendarCheck, AlertCircle } from 'lucide-react';
import StatCard from '../common/StatCard';

interface DashboardStats {
  totalMembers: number;
  todayCheckins: number;
  extraCheckins: number;
  expiringMembers: number;
}

interface Props {
  stats: DashboardStats;
}

export default function Overview({ stats }: Props) {
  return (
    <div className="space-y-8">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* 可以在这里添加更多统计信息和图表 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium mb-4">数据分析 Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500">会员状态分布</h3>
            <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
              图表占位 Chart Placeholder
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500">签到趋势</h3>
            <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
              图表占位 Chart Placeholder
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 