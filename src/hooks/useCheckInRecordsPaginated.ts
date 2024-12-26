import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckIn, ClassType } from '../types/database';
import { QueryCache, createCacheKey } from '../utils/cacheUtils';
import { retryWithBackoff, handleSupabaseError } from '../utils/fetchUtils';
import { normalizeNameForComparison } from '../utils/memberUtils';

interface FetchFilters {
  memberName?: string;
  startDate?: string;
  endDate?: string;
  classType?: ClassType;
  isExtra?: boolean;
  page?: number;
  pageSize?: number;
}

interface PaginatedResult {
  records: CheckIn[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

const checkInCache = new QueryCache<{
  records: CheckIn[];
  totalCount: number;
}>();

export function useCheckInRecordsPaginated(defaultPageSize: number = 10) {
  const [result, setResult] = useState<PaginatedResult>({
    records: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 1
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = async (filters?: FetchFilters) => {
    try {
      setLoading(true);
      setError(null);

      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || defaultPageSize;
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;

      const cacheKey = createCacheKey('check-ins', filters || {});
      const cachedData = checkInCache.get(cacheKey);
      if (cachedData) {
        setResult({
          records: cachedData.records,
          totalCount: cachedData.totalCount,
          currentPage: page,
          totalPages: Math.ceil(cachedData.totalCount / pageSize)
        });
        setLoading(false);
        return;
      }

      let query = supabase
        .from('check_ins')
        .select(`
          *,
          member:members!inner (
            name,
            email
          )
        `, { count: 'exact' });

      if (filters?.memberName) {
        // Use ilike for case-insensitive name search
        query = query.ilike('member.name', `%${filters.memberName.trim()}%`);
      }

      if (filters?.startDate) {
        query = query.gte('check_in_date', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('check_in_date', filters.endDate);
      }

      if (filters?.classType) {
        query = query.eq('class_type', filters.classType);
      }

      if (filters?.isExtra !== undefined) {
        query = query.eq('is_extra', filters.isExtra);
      }

      const { data, count, error: fetchError } = await query
        .order('created_at', { ascending: false })
        .range(start, end);

      if (fetchError) throw fetchError;

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      // Post-process results for case and space insensitive matching if needed
      const filteredData = filters?.memberName
        ? data?.filter(record => 
            normalizeNameForComparison(record.member?.name || '')
              .includes(normalizeNameForComparison(filters.memberName))
          )
        : data;

      checkInCache.set(cacheKey, {
        records: filteredData || [],
        totalCount: filteredData?.length || 0
      });

      setResult({
        records: filteredData || [],
        totalCount: filteredData?.length || 0,
        currentPage: page,
        totalPages: Math.ceil((filteredData?.length || 0) / pageSize)
      });
    } catch (err) {
      console.error('Query error:', err);
      setError(handleSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  return {
    ...result,
    loading,
    error,
    fetchRecords
  };
}