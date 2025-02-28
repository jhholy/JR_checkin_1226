import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Member, CardType, CardSubtype } from '../types/database';
import { QueryCache, createCacheKey } from '../utils/cacheUtils';
import { handleSupabaseError } from '../utils/fetchUtils';
import { normalizeNameForComparison } from '../utils/memberUtils';

interface SearchParams {
  searchTerm?: string;
  cardType?: CardType | '';
  cardSubtype?: CardSubtype | '';
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
        .select(`
          *,
          membership_cards (
            id,
            card_type,
            card_subtype,
            valid_until,
            remaining_group_sessions,
            remaining_private_sessions,
            trainer_type
          )
        `, { count: 'exact' });

      if (params.searchTerm) {
        const searchTerm = params.searchTerm.trim();
        query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      // 获取所有会员数据
      const { data, error: fetchError, count } = await query
        .order('id', { ascending: false })
        .range(start, end);

      if (fetchError) throw fetchError;

      // 在内存中过滤会员卡类型
      let filteredData = data || [];

      if (params.cardType) {
        filteredData = filteredData.filter(member => 
          member.membership_cards?.some(card => card.card_type === params.cardType)
        );
      }

      if (params.cardSubtype) {
        filteredData = filteredData.filter(member =>
          member.membership_cards?.some(card => card.card_subtype === params.cardSubtype)
        );
      }

      if (params.expiryStatus) {
        const today = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        filteredData = filteredData.filter(member => {
          const hasValidCard = member.membership_cards?.some(card => {
            const validUntil = new Date(card.valid_until);
            if (params.expiryStatus === 'expired') {
              return validUntil < today;
            } else if (params.expiryStatus === 'upcoming') {
              return validUntil > today && validUntil < threeDaysFromNow;
            }
            return false;
          });
          return hasValidCard;
        });
      }

      // 名字模糊匹配
      if (params.searchTerm) {
        filteredData = filteredData.filter(member => 
          normalizeNameForComparison(member.name)
            .includes(normalizeNameForComparison(params.searchTerm!))
        );
      }

      memberCache.set(cacheKey, {
        members: filteredData,
        totalCount: filteredData.length
      });

      setResult({
        members: filteredData,
        totalCount: filteredData.length,
        currentPage: page,
        totalPages: Math.ceil(filteredData.length / pageSize)
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

      // 1. 删除会员卡
      const { error: cardsError } = await supabase
        .from('membership_cards')
        .delete()
        .eq('member_id', memberId);

      if (cardsError) throw cardsError;

      // 2. 删除签到记录
      const { error: checkInsError } = await supabase
        .from('check_ins')
        .delete()
        .eq('member_id', memberId);

      if (checkInsError) throw checkInsError;

      // 3. 删除会员
      const { error: memberError } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);

      if (memberError) throw memberError;
      
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

      const { error } = await supabase
        .from('members')
        .update(updates)
        .eq('id', memberId);

      if (error) throw error;
      
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