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

      const page = params.page || 1;
      const pageSize = params.pageSize || defaultPageSize;
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;

      console.log('搜索会员，参数:', params);

      // 清除缓存
      memberCache.clear();

      // 调试：检查是否正在查找课时不足的会员
      if (params.expiryStatus === 'low_classes') {
        console.log('正在查找课时不足的会员，详细的过滤条件将在后续代码中应用');
      }

      // 构建基础查询
      let query = supabase
        .from('members')
        .select(`
          *,
          membership_cards (
            id,
            card_type,
            card_category,
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
      if (params.cardType && params.expiryStatus !== 'low_classes') {
        // 当筛选"课时不足"时，不应该限制卡类型，以便找到所有可能的会员
        if (params.cardType === 'no_card') {
          // 筛选无卡会员
          query = query.is('membership_cards', null);
        } else if (params.cardType === 'all_cards') {
          // 筛选有卡会员，不过滤卡类型
          query = query.not('membership_cards', 'is', null);
        } else {
          // 筛选有特定卡类型的会员
          query = query.not('membership_cards', 'is', null);
          
          // 获取匹配的所有可能卡类型值
          const dbCardTypeValues = mapCardTypeToDbValues(params.cardType);
          console.log('使用卡类型过滤:', params.cardType, '映射到数据库值:', dbCardTypeValues);
          
          // 使用Supabase的in查询，更简单和稳定
          query = query.in('membership_cards.card_type', dbCardTypeValues);
          
          if (params.cardSubtype) {
            // 获取匹配的所有可能卡子类型值，考虑卡类型的影响
            const dbCardSubtypeValues = mapCardSubtypeToDbValues(params.cardSubtype, params.cardType);
            console.log('使用卡子类型过滤:', params.cardSubtype, '卡类型:', params.cardType, '映射到数据库值:', dbCardSubtypeValues);
            
            // 使用Supabase的in查询匹配卡子类型
            query = query.in('membership_cards.card_subtype', dbCardSubtypeValues);
          }
        }
      } else if (params.expiryStatus === 'low_classes') {
        // 当筛选"课时不足"时，确保至少有会员卡，但不限制卡类型
        query = query.not('membership_cards', 'is', null);
        console.log('正在查找所有有卡会员的课时不足情况，不限制卡类型');
      }

      // 首先获取总记录数，而不考虑分页限制
      let { count: totalRecords } = await query;
      
      console.log(`数据库中符合基本条件的总记录数: ${totalRecords}`);
      
      let allData;
      let filteredData;
      
      // 如果是特殊筛选条件（如课时不足），先获取所有数据
      if (params.expiryStatus === 'low_classes') {
        console.log('课时不足筛选：获取所有符合基本条件的数据');
        
        // 获取所有符合基本条件的数据，而不是仅限于当前页
        const { data: allRecords, error: allFetchError } = await query.order('id', { ascending: false });
        
        if (allFetchError) throw allFetchError;
        
        allData = allRecords || [];
        console.log(`获取到的符合基本条件的总记录数: ${allData.length}`);
        
        // 在内存中处理到期状态过滤
        filteredData = filterByExpiryStatus(allData, params.expiryStatus);
        
        console.log(`课时不足筛选后的总记录数: ${filteredData.length}`);
        console.log('课时不足的会员名单:', filteredData.map((m: any) => m.name).join(', '));
        
        // 应用分页限制
        const totalCount = filteredData.length;
        const totalPages = Math.ceil(totalCount / pageSize);
        
        // 截取当前页数据
        const pageData = filteredData.slice(start, start + pageSize);
        
        // 更新结果
        setResult({
          members: pageData,
          totalCount,
          currentPage: page,
          totalPages
        });
        
        return {
          members: pageData,
          totalCount,
          currentPage: page,
          totalPages
        };
      } else {
        // 非特殊筛选，使用常规分页查询
        const { data, error: fetchError, count } = await query
          .order('id', { ascending: false })
          .range(start, end);

        if (fetchError) throw fetchError;

        allData = data || [];
        
        // 在内存中处理到期状态过滤
        if (params.expiryStatus) {
          filteredData = filterByExpiryStatus(allData, params.expiryStatus);
        } else {
          filteredData = allData;
        }
        
        // 计算总页数
        const totalCount = params.expiryStatus ? filteredData.length : (count || 0);
        const totalPages = Math.ceil(totalCount / pageSize);

        // 更新结果
        setResult({
          members: filteredData,
          totalCount,
          currentPage: page,
          totalPages
        });

        return {
          members: filteredData,
          totalCount,
          currentPage: page,
          totalPages
        };
      }
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

// 提取到期状态过滤逻辑为独立函数，方便重用
const filterByExpiryStatus = (data: any[], expiryStatus: string | undefined) => {
  if (!expiryStatus) return data;
  
  const today = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  console.log('应用到期状态过滤:', expiryStatus);
  
  const filteredData = data.filter(member => {
    // 如果没有会员卡,不应该出现在到期筛选中
    if (!member.membership_cards || member.membership_cards.length === 0) {
      return false;
    }

    const hasValidCard = member.membership_cards.some((card: any) => {
      console.log('检查会员卡:', card.id, '类型:', card.card_type, '类别:', card.card_category, '剩余团课次数:', card.remaining_group_sessions);
      
      if (expiryStatus === 'low_classes') {
        // 大幅简化课时不足筛选逻辑：只要有任何卡的团课剩余次数<=2且是有效值，就符合条件
        // 不再考虑卡类型、卡类别等复杂条件
        console.log(`会员卡 ${card.id} - 剩余团课次数: ${card.remaining_group_sessions}, 会员名: ${member.name}`);
        
        // 简单直接地判断剩余课时是否不足（<=2且是有效数字）
        const hasLowSessions = typeof card.remaining_group_sessions === 'number' && card.remaining_group_sessions <= 2;
        
        console.log(`卡 ${card.id} 课时不足判断结果: ${hasLowSessions}, 会员名: ${member.name}`);
        
        return hasLowSessions;
      }
      
      if (!card.valid_until) return false;
      const validUntil = new Date(card.valid_until);
      
      if (expiryStatus === 'expired') {
        return validUntil < today;
      } else if (expiryStatus === 'upcoming') {
        return validUntil >= today && validUntil <= sevenDaysFromNow;
      } else if (expiryStatus === 'active') {
        return validUntil > sevenDaysFromNow;
      }
      return false;
    });
    
    return hasValidCard;
  });

  return filteredData;
}