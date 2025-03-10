import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface CardStat {
  cardType: string;
  count: number;
}

export const useMembershipCardStats = () => {
  const [cardStats, setCardStats] = useState<CardStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCardStats = async () => {
      try {
        setLoading(true);
        
        // 获取会员卡类型分布
        const { data, error: fetchError } = await supabase
          .from('membership_cards')
          .select('card_type, card_category, card_subtype');

        if (fetchError) throw fetchError;

        // 处理数据分组
        const cardTypeMap = new Map<string, number>();
        
        data?.forEach(card => {
          let cardTypeLabel = '';
          
          // 根据卡类型、类别和子类型生成标签
          if (card.card_type === '团课') {
            if (card.card_category === '课时卡') {
              // 团课课时卡：单次卡、两次卡、10次卡
              if (card.card_subtype === '单次卡') {
                cardTypeLabel = '团课-单次卡';
              } else if (card.card_subtype === '两次卡') {
                cardTypeLabel = '团课-两次卡';
              } else if (card.card_subtype === '10次卡') {
                cardTypeLabel = '团课-10次卡';
              } else {
                cardTypeLabel = `团课${card.card_subtype}`;
              }
            } else if (card.card_category === '月卡') {
              // 团课月卡：单次月卡、双次月卡
              if (card.card_subtype === '单次月卡') {
                cardTypeLabel = '团课-单次月卡';
              } else if (card.card_subtype === '双次月卡') {
                cardTypeLabel = '团课-双次月卡';
              } else {
                cardTypeLabel = `团课${card.card_subtype}`;
              }
            } else {
              // 其他团课卡
              cardTypeLabel = `团课卡`;
            }
          } else if (card.card_type === '私教课') {
            // 私教课：单次卡、10次卡
            if (card.card_subtype === '单次卡') {
                cardTypeLabel = '私教-单次卡';
            } else if (card.card_subtype === '10次卡') {
                cardTypeLabel = '私教-10次卡';
            } else {
                cardTypeLabel = `私教${card.card_subtype}`;
            }
          } else {
            // 其他类型卡（不应该存在，因为已经标准化）
            cardTypeLabel = `${card.card_type || '未知'}卡`;
          }
          
          // 更新计数
          cardTypeMap.set(
            cardTypeLabel, 
            (cardTypeMap.get(cardTypeLabel) || 0) + 1
          );
        });
        
        // 转换为数组并排序
        const statsArray: CardStat[] = Array.from(cardTypeMap.entries())
          .map(([cardType, count]) => ({ cardType, count }))
          .sort((a, b) => b.count - a.count);
        
        setCardStats(statsArray);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchCardStats();
  }, []);

  return { cardStats, loading, error };
}; 