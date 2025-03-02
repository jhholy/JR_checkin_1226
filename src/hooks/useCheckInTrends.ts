import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, subDays } from 'date-fns';

interface CheckInTrend {
  date: string;
  total: number;
  regular: number;
  extra: number;
  groupClass: number;  // 团课签到数
  privateClass: number; // 私教签到数
}

export const useCheckInTrends = () => {
  const [trends, setTrends] = useState<CheckInTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setLoading(true);
        
        // 获取最近7天的数据
        const endDate = new Date();
        const startDate = subDays(endDate, 6);

        const { data: checkIns, error: checkInsError } = await supabase
          .from('check_ins')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        if (checkInsError) throw checkInsError;

        // 处理数据按日期分组
        const trendData: CheckInTrend[] = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = format(d, 'MM-dd');
          const dayCheckins = checkIns?.filter(
            check => format(new Date(check.created_at), 'MM-dd') === dateStr
          ) || [];

          trendData.push({
            date: dateStr,
            total: dayCheckins.length,
            regular: dayCheckins.filter(check => !check.is_extra).length,
            extra: dayCheckins.filter(check => check.is_extra).length,
            // 按课程类型分类 - 使用is_private字段判断
            privateClass: dayCheckins.filter(check => check.is_private).length,
            groupClass: dayCheckins.filter(check => !check.is_private).length,
          });
        }

        setTrends(trendData);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, []);

  return { trends, loading, error };
};