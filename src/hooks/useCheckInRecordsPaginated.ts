import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckIn, ClassType } from '../types/database';

interface FetchRecordsParams {
  memberName?: string;
  startDate?: string;
  endDate?: string;
  classType?: ClassType;
  isExtra?: boolean;
  page?: number;
  pageSize?: number;
}

interface CheckInStats {
  total: number;
  regular: number;
  extra: number;
}

export function useCheckInRecordsPaginated(initialPageSize: number = 10) {
  const [records, setRecords] = useState<CheckIn[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CheckInStats>({ total: 0, regular: 0, extra: 0 });

  const fetchStats = async (params: FetchRecordsParams) => {
    try {
      let baseQuery = supabase
        .from('check_ins')
        .select('id, members!inner(name)', { count: 'exact' });

      if (params.memberName) {
        baseQuery = baseQuery.ilike('members.name', `%${params.memberName}%`);
      }
      if (params.startDate) {
        baseQuery = baseQuery.gte('check_in_date', params.startDate);
      }
      if (params.endDate) {
        baseQuery = baseQuery.lte('check_in_date', params.endDate);
      }
      if (params.classType) {
        baseQuery = baseQuery.eq('class_type', params.classType);
      }

      // 获取总数
      const { count: total } = await baseQuery;

      // 获取正常签到数
      const { count: regular } = await baseQuery.eq('is_extra', false);

      // 获取额外签到数
      const { count: extra } = await baseQuery.eq('is_extra', true);

      return {
        total: total || 0,
        regular: regular || 0,
        extra: extra || 0
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      return { total: 0, regular: 0, extra: 0 };
    }
  };

  const fetchRecords = async ({
    memberName,
    startDate,
    endDate,
    classType,
    isExtra,
    page = 1,
    pageSize = initialPageSize
  }: FetchRecordsParams) => {
    try {
      setLoading(true);
      setError(null);

      // 获取统计数据
      const statsData = await fetchStats({
        memberName,
        startDate,
        endDate,
        classType,
        isExtra
      });
      setStats(statsData);
      
      // 获取分页数据
      let query = supabase
        .from('check_ins')
        .select(`
          id,
          member_id,
          class_type,
          is_extra,
          created_at,
          check_in_date,
          members!inner(name)
        `, {
          count: 'exact'
        });

      if (memberName) {
        query = query.ilike('members.name', `%${memberName}%`);
      }
      if (startDate) {
        query = query.gte('check_in_date', startDate);
      }
      if (endDate) {
        query = query.lte('check_in_date', endDate);
      }
      if (classType) {
        query = query.eq('class_type', classType);
      }
      if (isExtra !== undefined) {
        query = query.eq('is_extra', isExtra);
      }

      const { data, error: queryError, count } = await query
        .order('check_in_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (queryError) throw queryError;

      setRecords(data as CheckIn[]);
      setTotalCount(count || 0);
      setCurrentPage(page);
      setTotalPages(Math.ceil((count || 0) / pageSize));
      
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
    stats  // 添加统计数据到返回值
  };
}