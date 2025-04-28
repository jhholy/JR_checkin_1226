import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Member, CardType, CardSubtype } from '../types/database';
import { QueryCache, createCacheKey } from '../utils/cacheUtils';
import { handleSupabaseError } from '../utils/fetchUtils';
import { normalizeNameForComparison } from '../utils/memberUtils';

interface SearchParams {
  searchTerm?: string;
  cardType?: CardType | 'no_card' | '团课' | '私教课' | 'all_cards' | '';
  cardSubtype?: CardSubtype | string | '';
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

// 添加卡类型映射函数，确保同时支持中英文卡类型
const mapCardTypeToDbValues = (cardType: string): string[] => {
  // 定义映射关系
  const typeMap: Record<string, string[]> = {
    '团课': ['团课', 'class', 'group'],
    'class': ['团课', 'class', 'group'],
    '私教课': ['私教课', 'private', '私教'],
    'private': ['私教课', 'private', '私教'],
    '月卡': ['月卡', 'monthly'],
    'monthly': ['月卡', 'monthly']
  };
  
  return typeMap[cardType] || [cardType];
};

// 添加卡子类型映射函数，确保同时支持中英文卡子类型
const mapCardSubtypeToDbValues = (cardSubtype: string, cardType?: string): string[] => {
  // 基础映射关系
  const subtypeMap: Record<string, string[]> = {
    // 通用映射 - 适用于所有卡类型
    '10次卡': ['10次卡', 'ten_classes', 'ten_private', 'group_ten_class'],
    
    // 团课卡子类型专用映射
    'ten_classes': ['10次卡', 'ten_classes', 'group_ten_class'],
    '单次卡': ['单次卡', 'single_class', 'single_private'],
    'single_class': ['单次卡', 'single_class'],
    '两次卡': ['两次卡', 'two_classes'],
    'two_classes': ['两次卡', 'two_classes'],
    
    // 私教卡子类型专用映射
    '10次私教': ['10次私教', '10次卡', 'ten_private'],
    'ten_private': ['10次私教', '10次卡', 'ten_private'],
    '单次私教': ['单次私教', '单次卡', 'single_private'],
    'single_private': ['单次私教', '单次卡', 'single_private'],
    
    // 月卡子类型专用映射
    '单次月卡': ['单次月卡', 'single_monthly'],
    'single_monthly': ['单次月卡', 'single_monthly'],
    '双次月卡': ['双次月卡', 'double_monthly'],
    'double_monthly': ['双次月卡', 'double_monthly']
  };
  
  // 如果提供了卡类型，可以进一步优化映射
  if (cardType) {
    // 针对不同卡类型的特定映射
    if ((cardType === '团课' || cardType === 'class' || cardType === 'group') && cardSubtype === '10次卡') {
      return ['10次卡', 'ten_classes', 'group_ten_class'];
    }
    
    if ((cardType === '私教课' || cardType === 'private') && cardSubtype === '10次卡') {
      return ['10次卡', 'ten_private', '10次私教'];
    }
  }
  
  return subtypeMap[cardSubtype] || [cardSubtype];
};

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

      const {
        searchTerm = '',
        cardType = '',
        cardSubtype = '',
        expiryStatus = '',
        page = 1,
        pageSize = defaultPageSize
      } = params;

      // 计算分页范围
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;

      // 基础查询
      let query = supabase
        .from('members')
        .select(`
          *,
          membership_cards (
            id,
            card_type,
            card_category,
            valid_until,
            remaining_group_sessions,
            remaining_private_sessions
          )
        `, { count: 'exact' });

      // 搜索条件
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      // 会员卡类型筛选
      if (cardType) {
        const cardTypeValues = mapCardTypeToDbValues(cardType);
        if (cardType === 'no_card') {
          query = query.not('membership_cards', 'cs', '{}');
        } else if (cardTypeValues.length > 0) {
          query = query.contains('membership_cards', [{ card_type: cardTypeValues }]);
        }
      }

      // 会员卡子类型筛选
      if (cardSubtype) {
        const cardSubtypeValues = mapCardSubtypeToDbValues(cardSubtype, cardType);
        if (cardSubtypeValues.length > 0) {
          query = query.contains('membership_cards', [{ card_category: cardSubtypeValues }]);
        }
      }

      // 到期状态筛选
      if (expiryStatus) {
        const today = new Date().toISOString().split('T')[0];
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
        const sevenDaysLaterStr = sevenDaysLater.toISOString().split('T')[0];

        if (expiryStatus === 'low_classes') {
          // 课时不足：任何卡的团课剩余次数<=2
          query = query
            .not('membership_cards', 'is', null)
            .lte('membership_cards.remaining_group_sessions', 2);
        } else if (expiryStatus === 'expired') {
          // 已过期：有效期早于今天
          query = query
            .not('membership_cards', 'is', null)
            .lte('membership_cards.valid_until', today);
        } else if (expiryStatus === 'upcoming') {
          // 即将到期：有效期在今天到7天后之间
          query = query
            .not('membership_cards', 'is', null)
            .gte('membership_cards.valid_until', today)
            .lte('membership_cards.valid_until', sevenDaysLaterStr);
        } else if (expiryStatus === 'active') {
          // 有效：有效期晚于7天后
          query = query
            .not('membership_cards', 'is', null)
            .gt('membership_cards.valid_until', sevenDaysLaterStr);
        }
      }

      // 执行查询
      const { data, error: fetchError, count } = await query
        .order('id', { ascending: false })
        .range(start, end);

      if (fetchError) throw fetchError;

      // 更新结果
      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      setResult({
        members: data || [],
        totalCount,
        currentPage: page,
        totalPages
      });

      return {
        members: data || [],
        totalCount,
        currentPage: page,
        totalPages
      };
    } catch (err) {
      console.error('搜索会员失败:', err);
      setError('搜索会员失败，请重试');
      return {
        members: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 1
      };
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