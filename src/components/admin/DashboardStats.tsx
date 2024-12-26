import React from 'react';
import { useDashboardCache } from '../../hooks/useDashboardCache';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

interface StatsData {
  todayCheckins: number;
  activeMembers: number;
  expiringMembers: number;
}

const DashboardStats: React.FC = () => {
  const { data, loading, error } = useDashboardCache<StatsData>(
    async () => {
      console.log('[DashboardStats] 开始获取统计数据');
      
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        console.log('[DashboardStats] 发起数据库查询...');

        // 并行请求数据
        const [checkinsResult, membersResult, expiringResult] = await Promise.all([
          // 今日签到数
          supabase
            .from('checkins')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString()),
          
          // 活跃会员数
          supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .gt('membership_expiry', new Date().toISOString()),
          
          // 即将到期会员数
          supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .lt('membership_expiry', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
            .gt('membership_expiry', new Date().toISOString())
        ]);

        // 检查每个请求的错误
        if (checkinsResult.error) {
          console.error('[DashboardStats] 签到数据查询失败:', checkinsResult.error);
          throw checkinsResult.error;
        }
        if (membersResult.error) {
          console.error('[DashboardStats] 会员数据查询失败:', membersResult.error);
          throw membersResult.error;
        }
        if (expiringResult.error) {
          console.error('[DashboardStats] 到期会员数据查询失败:', expiringResult.error);
          throw expiringResult.error;
        }

        console.log('[DashboardStats] 查询结果:', {
          checkins: checkinsResult,
          members: membersResult,
          expiring: expiringResult
        });

        const stats = {
          todayCheckins: checkinsResult.count || 0,
          activeMembers: membersResult.count || 0,
          expiringMembers: expiringResult.count || 0
        };

        console.log('[DashboardStats] 统计数据:', stats);
        return stats;

      } catch (error) {
        console.error('[DashboardStats] 数据获取失败:', error);
        throw new Error(`数据获取失败: ${(error as Error).message}`);
      }
    },
    {
      key: 'dashboard-stats',
      ttl: 5 * 60 * 1000 // 5分钟缓存
    }
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorMessage message={error.message} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 text-gray-500">
        暂无数据
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">今日签到</h3>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{data.todayCheckins}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">活跃会员</h3>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{data.activeMembers}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">即将到期会员</h3>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{data.expiringMembers}</p>
      </div>
    </div>
  );
};

export default React.memo(DashboardStats);