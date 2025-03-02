import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { startOfMonth, endOfMonth } from 'date-fns';

interface TrainerStat {
  trainerId: string;
  trainerName: string;
  sessionCount: number;
  oneOnOneCount: number;
  oneOnTwoCount: number;
}

export const useTrainerWorkload = () => {
  const [trainerStats, setTrainerStats] = useState<TrainerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTrainerWorkload = async () => {
      try {
        setLoading(true);
        
        // 获取当月的开始和结束日期
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        
        // 获取所有教练信息
        const { data: trainers, error: trainersError } = await supabase
          .from('trainers')
          .select('id, name');
        
        if (trainersError) throw trainersError;
        
        // 获取当月的私教签到记录
        const { data: checkIns, error: checkInsError } = await supabase
          .from('check_ins')
          .select('*')
          .eq('is_private', true)
          .gte('check_in_date', monthStart.toISOString())
          .lte('check_in_date', monthEnd.toISOString());
        
        if (checkInsError) throw checkInsError;
        
        // 处理数据统计
        const stats: TrainerStat[] = trainers?.map(trainer => {
          const trainerCheckIns = checkIns?.filter(
            checkIn => checkIn.trainer_id === trainer.id
          ) || [];
          
          return {
            trainerId: trainer.id,
            trainerName: trainer.name,
            sessionCount: trainerCheckIns.length,
            oneOnOneCount: trainerCheckIns.filter(checkIn => !checkIn.is_1v2).length,
            oneOnTwoCount: trainerCheckIns.filter(checkIn => checkIn.is_1v2).length,
          };
        }) || [];
        
        // 按课时数量排序
        const sortedStats = stats.sort((a, b) => b.sessionCount - a.sessionCount);
        
        setTrainerStats(sortedStats);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainerWorkload();
  }, []);

  return { trainerStats, loading, error };
}; 