import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useMemberAuth } from '../../contexts/MemberAuthContext';
import { CreditCard, Calendar, AlertCircle } from 'lucide-react';

interface MemberCard {
  id: string;
  member_id: string;
  card_type: string;
  card_category: string | null;
  card_subtype: string;
  trainer_type?: string;
  remaining_group_sessions?: number;
  remaining_private_sessions?: number;
  valid_until: string;
  created_at: string;
}

const MemberCard: React.FC = () => {
  const { member } = useMemberAuth();
  const [cards, setCards] = useState<MemberCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!member?.id) return;

    const memberId = member.id;

    async function fetchCards() {
      try {
        const { data, error } = await supabase
          .from('membership_cards')
          .select('*')
          .eq('member_id', memberId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCards(data || []);
      } catch (err) {
        console.error('Error fetching cards:', err);
        setError('获取会员卡信息失败 Failed to fetch membership cards');
      } finally {
        setLoading(false);
      }
    }

    fetchCards();

    const subscription = supabase
      .channel('membership_cards_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'membership_cards',
          filter: `member_id=eq.${memberId}`
        },
        async () => {
          const { data } = await supabase
            .from('membership_cards')
            .select('*')
            .eq('member_id', memberId)
            .order('created_at', { ascending: false });
          
          setCards(data || []);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [member?.id]);

  const getCardDescription = (card: MemberCard) => {
    if (card.card_type === '团课') {
      return `${card.card_category || ''} ${card.card_subtype}`;
    }
    return `${card.card_subtype}${card.trainer_type ? ` (${card.trainer_type})` : ''}`;
  };

  const getCardTypeTranslation = (cardType: string) => {
    if (cardType === '团课') return '团课 Group Class';
    if (cardType === '私教课') return '私教课 Private Class';
    return cardType;
  };

  const getRemainingClasses = (card: MemberCard) => {
    if (card.card_type === '团课') {
      return card.remaining_group_sessions;
    }
    return card.remaining_private_sessions;
  };

  if (loading) {
    return <div className="p-4">加载中... Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  if (cards.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <h2 className="text-2xl font-bold mb-6">会员卡 Member Cards</h2>
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>暂无会员卡信息</p>
          <p>No member cards found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">会员卡 Member Cards</h2>
      
      <div className="space-y-4">
        {cards.map(card => (
          <div key={card.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-6 h-6 text-[#1559CF]" />
                <div>
                  <span className="font-medium">{getCardTypeTranslation(card.card_type)}</span>
                  <span className="ml-2 text-gray-500">
                    ({getCardDescription(card)})
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                剩余课时 Remaining: {getRemainingClasses(card)}
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <Calendar className="w-5 h-5" />
              <span>
                到期时间 Valid until: {
                  card.valid_until 
                    ? new Date(card.valid_until).toLocaleDateString()
                    : '无到期限制 No expiration'
                }
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemberCard; 