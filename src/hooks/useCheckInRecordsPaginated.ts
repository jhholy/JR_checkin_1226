import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckIn, ClassType } from '../types/database';

interface FetchRecordsParams {
  memberName?: string;
  startDate?: string;
  endDate?: string;
  timeSlot?: string;
  classType?: string;
  isExtra?: boolean;
  is1v2?: boolean;
  trainerId?: string;
  page?: number;
  pageSize?: number;
  isPrivate?: boolean;
}

interface CheckInStats {
  total: number;
  regular: number;
  extra: number;
  oneOnOne: number;
  oneOnTwo: number;
}

interface CheckInRecord {
  id: string;
  member_id: string;
  time_slot: string;
  is_extra: boolean;
  is_private: boolean;
  is_1v2: boolean;
  created_at: string;
  check_in_date: string;
  trainer_id: string | null;
  members: { name: string; email: string }[];
  trainer: { name: string }[];
  [key: string]: any; // 允许其他字段
}

export function useCheckInRecordsPaginated(initialPageSize: number = 10) {
  const [records, setRecords] = useState<CheckInRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CheckInStats>({ 
    total: 0, 
    regular: 0, 
    extra: 0,
    oneOnOne: 0,
    oneOnTwo: 0
  });

  const fetchStats = async (params: FetchRecordsParams) => {
    try {
      // 获取总签到数
      const getCountWithFilters = async (additionalFilters: any = {}) => {
        // 创建基础查询
        const query = supabase
          .from('check_ins')
          .select('id', { count: 'exact' });
        
        // 应用通用筛选条件
        if (params.startDate) {
          query.gte('check_in_date', params.startDate);
        }
        if (params.endDate) {
          query.lte('check_in_date', params.endDate);
        }
        if (params.timeSlot) {
          query.eq('time_slot', params.timeSlot);
        }
        if (params.trainerId) {
          query.eq('trainer_id', params.trainerId);
        }
        
        // 应用额外筛选条件
        Object.entries(additionalFilters).forEach(([key, value]) => {
          if (value !== undefined) {
            query.eq(key, value);
          }
        });
        
        // 如果有会员名称，我们需要单独处理
        if (params.memberName) {
          // 首先获取匹配的会员ID
          const { data: membersData } = await supabase
            .from('members')
            .select('id')
            .or(`name.ilike.%${params.memberName}%,email.ilike.%${params.memberName}%`);
          
          if (membersData && membersData.length > 0) {
            const memberIds = membersData.map(m => m.id);
            query.in('member_id', memberIds);
          } else {
            // 如果没有匹配的会员，直接返回0
            return 0;
          }
        }
        
        const { count, error } = await query;
        if (error) {
          console.error('获取计数错误:', error);
          return 0;
        }
        
        return count || 0;
      };
      
      // 并行获取各种计数
      const [total, regular, extra, oneOnOne, oneOnTwo] = await Promise.all([
        getCountWithFilters(),
        getCountWithFilters({ is_extra: false }),
        getCountWithFilters({ is_extra: true }),
        getCountWithFilters({ is_private: true, is_1v2: false }),
        getCountWithFilters({ is_private: true, is_1v2: true })
      ]);
      
      return {
        total,
        regular,
        extra,
        oneOnOne,
        oneOnTwo
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      return { 
        total: 0, 
        regular: 0, 
        extra: 0, 
        oneOnOne: 0,
        oneOnTwo: 0
      };
    }
  };

  const fetchRecords = async ({
    memberName,
    startDate,
    endDate,
    timeSlot,
    classType,
    isExtra,
    is1v2,
    trainerId,
    page = 1,
    pageSize = initialPageSize,
    isPrivate
  }: FetchRecordsParams) => {
    try {
      setLoading(true);
      setError(null);

      console.log('筛选条件:', {
        memberName,
        startDate,
        endDate,
        timeSlot,
        classType,
        isExtra,
        is1v2,
        trainerId,
        isPrivate
      });
      
      // 简化版的查询 - 不使用高级关系特性
      const query = supabase
        .from('check_ins')
        .select(`
          id,
          member_id,
          time_slot,
          is_extra,
          is_private,
          is_1v2,
          created_at,
          check_in_date,
          trainer_id
        `, { count: 'exact' });

      // 应用普通过滤条件
      if (startDate) {
        query.gte('check_in_date', startDate);
      }
      if (endDate) {
        query.lte('check_in_date', endDate);
      }
      if (timeSlot) {
        query.eq('time_slot', timeSlot);
      }
      if (classType) {
        query.eq('class_type', classType);
      }
      if (isExtra !== undefined) {
        query.eq('is_extra', isExtra);
      }
      if (isPrivate !== undefined) {
        query.eq('is_private', isPrivate);
      }
      if (is1v2 !== undefined) {
        query.eq('is_1v2', is1v2);
      }
      if (trainerId) {
        query.eq('trainer_id', trainerId);
      }

      // 排序和分页
      const { data: checkInsData, error: checkInsError, count } = await query
        .order('check_in_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);
      
      if (checkInsError) {
        console.error('获取签到记录错误:', checkInsError);
        throw checkInsError;
      }
      
      console.log('签到记录数量:', checkInsData?.length);
      
      // 如果找不到记录，返回空数组
      if (!checkInsData || checkInsData.length === 0) {
        setRecords([]);
        setTotalCount(0);
        setCurrentPage(page);
        setTotalPages(0);
        return;
      }
      
      // 获取会员数据
      const memberIds = checkInsData.map(record => record.member_id).filter(Boolean);
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('id, name, email')
        .in('id', memberIds);
        
      if (membersError) {
        console.error('获取会员数据错误:', membersError);
        throw membersError;
      }
      
      // 获取教练数据
      const trainerIds = checkInsData.map(record => record.trainer_id).filter(Boolean);
      const { data: trainersData, error: trainersError } = trainerIds.length > 0 ? 
        await supabase
          .from('trainers')
          .select('id, name')
          .in('id', trainerIds) : 
        { data: [], error: null };
        
      if (trainersError) {
        console.error('获取教练数据错误:', trainersError);
        throw trainersError;
      }
      
      // 创建查找映射
      const memberMap = new Map(membersData?.map(m => [m.id, m]) || []);
      const trainerMap = new Map(trainersData?.map(t => [t.id, t]) || []);
      
      // 处理数据，生成最终记录
      const processedRecords = checkInsData.map(checkIn => {
        const member = memberMap.get(checkIn.member_id);
        const trainer = trainerMap.get(checkIn.trainer_id);
        
        return {
          ...checkIn,
          members: member ? [{ name: member.name, email: member.email }] : [],
          trainer: trainer ? [{ name: trainer.name }] : []
        };
      });
      
      // 如果有会员名称过滤条件，手动过滤结果
      let filteredRecords = processedRecords;
      if (memberName) {
        const lowerMemberName = memberName.toLowerCase();
        filteredRecords = processedRecords.filter(record => {
          if (record.members.length === 0) return false;
          
          const memberInfo = record.members[0];
          return (memberInfo.name && memberInfo.name.toLowerCase().includes(lowerMemberName)) || 
                 (memberInfo.email && memberInfo.email.toLowerCase().includes(lowerMemberName));
        });
      }

      setRecords(filteredRecords as CheckInRecord[]);
      setTotalCount(count || 0);
      setCurrentPage(page);
      setTotalPages(Math.ceil((count || 0) / pageSize));
      
      // 获取并更新统计数据
      const statsData = await fetchStats({
        memberName,
        startDate,
        endDate,
        timeSlot,
        trainerId
      });
      setStats(statsData);
      
    } catch (error) {
      console.error('Error fetching check-in records:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return {
    records,
    totalCount,
    currentPage,
    totalPages,
    loading,
    error,
    fetchRecords,
    stats
  };
}