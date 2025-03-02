import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Member, CardType, CardSubtype } from '../types/database';
import { QueryCache, createCacheKey } from '../utils/cacheUtils';
import { handleSupabaseError } from '../utils/fetchUtils';
import { normalizeNameForComparison } from '../utils/memberUtils';

interface SearchParams {
  searchTerm?: string;
  cardType?: CardType | 'no_card' | '';
  cardSubtype?: CardSubtype | '';
  expiryStatus?: 'active' | 'upcoming' | 'expired' | 'low_classes' | '';
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

      // 构建基础查询
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

      // 处理搜索词
      if (params.searchTerm) {
        const searchTerm = params.searchTerm.trim();
        query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      // 处理卡类型和子类型过滤
      if (params.cardType || params.cardSubtype) {
        if (params.cardType === 'no_card') {
          // 筛选无卡会员
          query = query.is('membership_cards', null);
        } else {
          // 筛选有特定卡类型的会员
          query = query.not('membership_cards', 'is', null);
          
          if (params.cardType) {
            query = query.eq('membership_cards.card_type', params.cardType);
          }
          
          if (params.cardSubtype) {
            query = query.eq('membership_cards.card_subtype', params.cardSubtype);
          }
        }
      }

      // 获取过滤后的会员数据
      const { data, error: fetchError, count } = await query
        .order('id', { ascending: false })
        .range(start, end);

      if (fetchError) throw fetchError;

      let filteredData = data || [];

      // 在内存中处理到期状态过滤
      if (params.expiryStatus) {
        const today = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        filteredData = filteredData.filter(member => {
          // 如果没有会员卡,不应该出现在到期筛选中
          if (!member.membership_cards || member.membership_cards.length === 0) {
            return false;
          }

          const hasValidCard = member.membership_cards.some(card => {
            if (params.expiryStatus === 'low_classes') {
              return card.card_type === 'class' && (card.remaining_group_sessions || 0) <= 2;
            }
            
            if (!card.valid_until) return false;
            const validUntil = new Date(card.valid_until);
            
            if (params.expiryStatus === 'expired') {
              return validUntil < today;
            } else if (params.expiryStatus === 'upcoming') {
              return validUntil > today && validUntil < threeDaysFromNow;
            } else if (params.expiryStatus === 'active') {
              return validUntil >= threeDaysFromNow;
            }
            return false;
          });
          return hasValidCard;
        });
      }

      // 更新缓存和状态
      const totalCount = count || 0;
      memberCache.set(createCacheKey('members', params), {
        members: filteredData,
        totalCount
      });

      setResult({
        members: filteredData,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / pageSize)
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

      // 1. 先获取该会员的所有会员卡ID
      const { data: memberCards, error: cardsQueryError } = await supabase
        .from('membership_cards')
        .select('id')
        .eq('member_id', memberId);

      if (cardsQueryError) {
        console.error('获取会员卡失败:', cardsQueryError);
        throw new Error(`获取会员卡失败: ${cardsQueryError.message}`);
      }

      const cardIds = memberCards?.map(card => card.id) || [];
      console.log('要删除的会员卡IDs:', cardIds);

      // 2. 删除所有相关的签到记录
      // 2.1 删除按member_id关联的签到记录
      const { error: memberCheckInsError } = await supabase
        .from('check_ins')
        .delete()
        .eq('member_id', memberId);

      if (memberCheckInsError) {
        console.error('删除会员签到记录失败:', memberCheckInsError);
        throw new Error(`删除会员签到记录失败: ${memberCheckInsError.message}`);
      }

      // 2.2 删除按card_id关联的签到记录
      if (cardIds.length > 0) {
        // 先检查是否还有相关的签到记录
        const { data: remainingCheckIns, error: checkError } = await supabase
          .from('check_ins')
          .select('id, card_id')
          .in('card_id', cardIds);

        if (checkError) {
          console.error('检查剩余签到记录失败:', checkError);
          throw new Error(`检查剩余签到记录失败: ${checkError.message}`);
        }

        console.log('剩余的签到记录:', remainingCheckIns);

        if (remainingCheckIns && remainingCheckIns.length > 0) {
          const { error: cardCheckInsError } = await supabase
            .from('check_ins')
            .delete()
            .in('card_id', cardIds);

          if (cardCheckInsError) {
            console.error('删除会员卡签到记录失败:', cardCheckInsError);
            throw new Error(`删除会员卡签到记录失败: ${cardCheckInsError.message}`);
          }
        }
      }

      // 3. 删除会员卡
      const { error: cardsError } = await supabase
        .from('membership_cards')
        .delete()
        .eq('member_id', memberId);

      if (cardsError) {
        console.error('删除会员卡失败:', cardsError);
        throw new Error(`删除会员卡失败: ${cardsError.message}`);
      }

      // 4. 删除会员
      const { error: memberError } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);

      if (memberError) {
        console.error('删除会员失败:', memberError);
        throw new Error(`删除会员失败: ${memberError.message}`);
      }

      // 更新本地状态
      setResult(prevResult => ({
        ...prevResult,
        members: prevResult.members.filter(m => m.id !== memberId),
        totalCount: Math.max(0, prevResult.totalCount - 1),
        totalPages: Math.ceil((prevResult.totalCount - 1) / defaultPageSize)
      }));

      // 如果当前页变空且不是第一页，则回到上一页
      if (result.members.length === 1 && result.currentPage > 1) {
        await searchMembers({ page: result.currentPage - 1 });
      } else {
        // 否则刷新当前页
        await searchMembers({ page: result.currentPage });
      }

      return { success: true };
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
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

      // 更新本地状态
      setResult(prevResult => ({
        ...prevResult,
        members: prevResult.members.map(member =>
          member.id === memberId ? { ...member, ...updates } : member
        )
      }));

      return { success: true };
    } catch (error) {
      console.error('Update error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchMembers();
  }, []);

  return {
    members: result.members,
    totalCount: result.totalCount,
    currentPage: result.currentPage,
    totalPages: result.totalPages,
    loading,
    error,
    searchMembers,
    deleteMember,
    updateMember
  };
}