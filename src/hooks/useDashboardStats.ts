import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { DashboardStats } from '../types/dashboard';

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // 获取当前日期
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // 获取活跃会员数
        const { data: activeMembers, error: activeError } = await supabase
          .from('members')
          .select('id, membership, membership_expiry, remaining_classes')
          .not('membership', 'is', null);

        if (activeError) throw activeError;

        // 获取签到数据
        const { data: checkIns, error: checkInsError } = await supabase
          .from('check_ins')
          .select('*')
          .gte('created_at', startOfMonth.toISOString());

        if (checkInsError) throw checkInsError;

        // 计算会员卡类型分布
        const membershipCounts = {
          singleDaily: 0,
          doubleDaily: 0,
          tenClasses: 0,
          twoClasses: 0,
          singleClass: 0,
        };

        activeMembers?.forEach(member => {
          const type = member.membership;
          if (type in membershipCounts) {
            membershipCounts[type as keyof typeof membershipCounts]++;
          }
        });

        // 计算签到统计
        const todayCheckIns = checkIns?.filter(
          check => new Date(check.created_at).toDateString() === today.toDateString()
        );

        const weeklyCheckIns = checkIns?.filter(
          check => new Date(check.created_at) >= startOfWeek
        );

        const monthlyCheckIns = checkIns?.length || 0;

        // 计算平均每日签到
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const averageDailyCheckIns = Math.round(monthlyCheckIns / daysInMonth * 10) / 10;

        setStats({
          activeMembers: activeMembers?.length || 0,
          membershipGrowth: 0, // 将在后续实现
          todayCheckIns: todayCheckIns?.length || 0,
          todayExtraCheckIns: todayCheckIns?.filter(check => check.is_extra).length || 0,
          expiringMemberships: activeMembers?.filter(
            member => member.membership_expiry && 
            new Date(member.membership_expiry) <= new Date(today.setDate(today.getDate() + 7))
          ).length || 0,
          membershipTypeCounts: membershipCounts,
          weeklyCheckIns: weeklyCheckIns?.length || 0,
          monthlyCheckIns,
          averageDailyCheckIns,
        });

      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
};