import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Member, MembershipType } from '../types/database';
import { QueryCache, createCacheKey } from '../utils/cacheUtils';
import { retryWithBackoff, handleSupabaseError } from '../utils/fetchUtils';
import { normalizeNameForComparison } from '../utils/memberUtils';

interface SearchParams {
  searchTerm?: string;
  membershipType?: MembershipType | '';
  expiryStatus?: 'upcoming' | 'expired' | '';
  page?: number;
  pageSize?: number;
}

interface SearchResult {
  members: Member[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

const memberCache = new QueryCache<{
  members: Member[];
  totalCount: number;
}>();

export function useMemberSearch(defaultPageSize: number = 10) {
  const [result, setResult] = useState<SearchResult>({
    members: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 1
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchMembers = async (params: SearchParams = {}) => {
    try {
      setLoading(true);
      setError(null);

      const page = params.page || 1;
      const pageSize = params.pageSize || defaultPageSize;
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;

      const cacheKey = createCacheKey('members', params);
      const cachedData = memberCache.get(cacheKey);
      if (cachedData) {
        setResult({
          members: cachedData.members,
          totalCount: cachedData.totalCount,
          currentPage: page,
          totalPages: Math.ceil(cachedData.totalCount / pageSize)
        });
        setLoading(false);
        return;
      }

      let query = supabase
        .from('members')
        .select('*', { count: 'exact' });

      if (params.searchTerm) {
        // Case-insensitive search with normalized comparison
        const searchTerm = params.searchTerm.trim();
        query = query.ilike('name', `%${searchTerm}%`);
      }

      if (params.membershipType) {
        query = query.eq('membership', params.membershipType);
      }

      if (params.expiryStatus) {
        const today = new Date().toISOString();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        if (params.expiryStatus === 'expired') {
          query = query.or(
            `membership_expiry.lt.${today},and(remaining_classes.eq.0,membership.neq.single_monthly,membership.neq.double_monthly)`
          );
        } else if (params.expiryStatus === 'upcoming') {
          query = query.or(
            `and(membership_expiry.gt.${today},membership_expiry.lt.${threeDaysFromNow.toISOString()}),and(remaining_classes.lte.2,remaining_classes.gt.0,membership.neq.single_monthly,membership.neq.double_monthly)`
          );
        }
      }

      const { data, count, error: fetchError } = await query
        .order('id', { ascending: false })
        .range(start, end);

      if (fetchError) throw fetchError;

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      // Post-process results to handle case and space insensitive matching
      const filteredData = params.searchTerm
        ? data?.filter(member => 
            normalizeNameForComparison(member.name)
              .includes(normalizeNameForComparison(params.searchTerm))
          )
        : data;

      memberCache.set(cacheKey, {
        members: filteredData || [],
        totalCount: filteredData?.length || 0
      });

      setResult({
        members: filteredData || [],
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

  const deleteMember = async (memberId: string) => {
    try {
      setLoading(true);

      // 1. 先删除该会员的签到记录
      const { error: checkInsError } = await supabase
        .from('check_ins')
        .delete()
        .eq('member_id', memberId);

      if (checkInsError) throw checkInsError;

      // 2. 再删除会员本身
      const { error: memberError } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);

      if (memberError) throw memberError;
      
      // Clear cache and refresh data
      memberCache.clear();
      await searchMembers({ page: result.currentPage });
      
      return { success: true };
    } catch (err) {
      console.error('Delete error:', err);
      throw new Error('删除失败，请重试。Delete failed, please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateMember = async (memberId: string, updates: Partial<Member>) => {
    try {
      setLoading(true);

      // 如果更新包含会员类型变更，自动处理相关字段
      if (updates.membership) {
        const isMonthly = updates.membership === 'single_monthly' || updates.membership === 'double_monthly';
        
        // 如果改为次卡，清除到期时间
        if (!isMonthly) {
          updates.membership_expiry = null;
        }
        
        // 如果改为月卡，清除剩余课时
        if (isMonthly) {
          updates.remaining_classes = 0;
        }
      }

      const { error } = await supabase
        .from('members')
        .update(updates)
        .eq('id', memberId);

      if (error) throw error;
      
      // Clear cache and refresh data
      memberCache.clear();
      await searchMembers({ page: result.currentPage });
      
      return { success: true };
    } catch (err) {
      console.error('Update error:', err);
      throw new Error('更新失败，请重试。Update failed, please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchMembers();
  }, []);

  return {
    ...result,
    loading,
    error,
    searchMembers,
    deleteMember,
    updateMember
  };
}