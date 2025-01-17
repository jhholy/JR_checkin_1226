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
      // 构建基础查询条件
      const queryFilters = {
        memberName: params.memberName,
        startDate: params.startDate,
        endDate: params.endDate,
        classType: params.classType
      };

      // 创建新的查询并应用过滤条件
      const createFilteredQuery = () => {
        let query = supabase
          .from('check_ins')
          .select('id, members!inner(name)', { count: 'exact' });

        if (queryFilters.memberName) {
          query = query.ilike('members.name', `%${queryFilters.memberName}%`);
        }
        if (queryFilters.startDate) {
          query = query.gte('check_in_date', queryFilters.startDate);
        }
        if (queryFilters.endDate) {
          query = query.lte('check_in_date', queryFilters.endDate);
        }
        if (queryFilters.classType) {
          query = query.eq('class_type', queryFilters.classType);
        }

        return query;
      };

      // 分别获取各类型签到数量
      const [totalResult, regularResult, extraResult] = await Promise.all([
        createFilteredQuery(),
        createFilteredQuery().eq('is_extra', false),
        createFilteredQuery().eq('is_extra', true)
      ]);

      return {
        total: totalResult.count || 0,
        regular: regularResult.count || 0,
        extra: extraResult.count || 0
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
          members!inner(name, email)
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