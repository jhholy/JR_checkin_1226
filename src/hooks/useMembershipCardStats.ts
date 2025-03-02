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
          if (card.card_type === 'group') {
            if (card.card_category === 'session') {
              cardTypeLabel = `团课${card.card_subtype}`;
            } else if (card.card_category === 'monthly') {
              cardTypeLabel = `团课${card.card_subtype}`;
            }
          } else if (card.card_type === 'private') {
            cardTypeLabel = `私教${card.card_subtype}`;
          }
          
          // 如果标签为空，使用默认标签
          if (!cardTypeLabel) {
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