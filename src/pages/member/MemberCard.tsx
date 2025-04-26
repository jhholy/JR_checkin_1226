import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useMemberAuth } from '../../contexts/MemberAuthContext';
import { CreditCard, Calendar, AlertCircle } from 'lucide-react';

// 定义泰拳主题色
const MUAYTHAI_RED = '#D32F2F';
const MUAYTHAI_BLUE = '#1559CF';

// 卡类型映射 (与EditMemberModal.tsx一致 - 添加双语显示)
const getCardTypeDisplay = (type: string | null): string => {
  if (!type) return '未知 Unknown';
  if (type === 'class') return '团课 Group Class';
  if (type === 'private') return '私教课 Private Class';
  if (type === '团课') return '团课 Group Class';
  if (type === '私教课') return '私教课 Private Class';
  return type; // 返回原值
};

// 卡类别映射 (与EditMemberModal.tsx一致 - 添加双语显示)
const getCardCategoryDisplay = (category: string | null): string => {
  if (!category) return '';
  if (category === 'group') return '课时卡 Session';
  if (category === 'private') return '私教 Private';
  if (category === 'monthly') return '月卡 Monthly';
  if (category === '课时卡') return '课时卡 Session';
  if (category === '私教') return '私教 Private';
  if (category === '月卡') return '月卡 Monthly';
  return category; // 返回原值
};

// 卡子类型映射 (与EditMemberModal.tsx一致 - 添加双语显示)
const getCardSubtypeDisplay = (subtype: string | null): string => {
  if (!subtype) return '';
  
  // 团课卡子类型
  if (subtype === 'ten_classes' || subtype === 'group_ten_class') return '10次卡 Ten Classes';
  if (subtype === 'single_class') return '单次卡 Single Class';
  if (subtype === 'two_classes') return '两次卡 Two Classes';
  
  // 私教卡子类型
  if (subtype === 'ten_private') return '10次私教 Ten Private';
  if (subtype === 'single_private') return '单次私教 Single Private';
  
  // 月卡子类型
  if (subtype === 'single_monthly') return '单次月卡 Single Monthly';
  if (subtype === 'double_monthly') return '双次月卡 Double Monthly';
  
  // 中文类型也添加英文翻译
  if (subtype === '10次卡') return '10次卡 Ten Classes';
  if (subtype === '单次卡') return '单次卡 Single Class';
  if (subtype === '两次卡') return '两次卡 Two Classes';
  if (subtype === '10次私教') return '10次私教 Ten Private';
  if (subtype === '单次私教') return '单次私教 Single Private';
  if (subtype === '单次月卡') return '单次月卡 Single Monthly';
  if (subtype === '双次月卡') return '双次月卡 Double Monthly';
  
  return subtype; // 返回原值
};

// 教练类型映射 (与EditMemberModal.tsx一致 - 添加双语显示)
const getTrainerTypeDisplay = (type: string | null): string => {
  if (!type) return '';
  if (type === 'jr') return 'JR教练 (JR)';
  if (type === 'senior') return '高级教练 (Senior)';
  return type;
};

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

  // 获取卡片完整描述（双语显示）
  const getCardDescription = (card: MemberCard) => {
    const cardCategory = getCardCategoryDisplay(card.card_category);
    const cardSubtype = getCardSubtypeDisplay(card.card_subtype);
    const trainerInfo = card.trainer_type ? ` (${getTrainerTypeDisplay(card.trainer_type)})` : '';
    
    return `${cardCategory} ${cardSubtype}${trainerInfo}`.trim();
  };

  // 获取卡类型（已使用getCardTypeDisplay替换）
  const getCardTypeTranslation = (cardType: string) => {
    return getCardTypeDisplay(cardType);
  };

  const getRemainingClasses = (card: MemberCard) => {
    if (card.card_type === '团课' || card.card_type?.toLowerCase() === 'class') {
      return card.remaining_group_sessions;
    }
    return card.remaining_private_sessions;
  };

  // 计算会员卡有效期状态
  const getCardStatus = (validUntil: string) => {
    if (!validUntil) return { status: 'valid' as const, text: '永久有效 No Expiration' };
    
    const now = new Date();
    const expireDate = new Date(validUntil);
    const daysLeft = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { status: 'expired' as const, text: '已过期 Expired' };
    if (daysLeft < 7) return { status: 'warning' as const, text: `即将过期 Expires Soon (${daysLeft}天)` };
    return { status: 'valid' as const, text: '有效 Valid' };
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
        <h2 className="text-2xl font-bold mb-6 border-b-2 border-[#1559CF] pb-2 inline-block">会员卡 Member Cards</h2>
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-[#1559CF]" />
          <p>暂无会员卡信息</p>
          <p>No member cards found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 border-b-2 border-[#1559CF] pb-2 inline-block">会员卡 Member Cards</h2>
      
      <div className="space-y-4">
        {cards.map(card => {
          const cardStatus = getCardStatus(card.valid_until);
          const statusColors = {
            valid: 'bg-green-100 text-green-800',
            warning: 'bg-yellow-100 text-yellow-800',
            expired: 'bg-red-100 text-red-800'
          };
          
          return (
            <div key={card.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className={`p-4 ${card.card_type === '团课' ? 'bg-blue-50' : 'bg-blue-50'} border-l-4 ${card.card_type === '团课' ? `border-[${MUAYTHAI_BLUE}]` : `border-[${MUAYTHAI_BLUE}]`}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCard className={`w-6 h-6 ${card.card_type === '团课' ? `text-[${MUAYTHAI_BLUE}]` : `text-[${MUAYTHAI_BLUE}]`}`} />
                    <div>
                      <span className="font-medium">{getCardTypeDisplay(card.card_type)}</span>
                      <span className="ml-2 text-gray-500">
                        ({getCardDescription(card)})
                      </span>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[cardStatus.status]}`}>
                    {cardStatus.text}
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">剩余课时 Remaining:</span> {getRemainingClasses(card)}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {card.valid_until 
                        ? `${new Date(card.valid_until).toLocaleDateString()}`
                        : '无到期限制 No expiration'}
                    </span>
                  </div>
                </div>
                
                {card.remaining_group_sessions !== undefined && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${card.card_type === '团课' ? 'bg-blue-600' : 'bg-blue-600'} h-2 rounded-full`} 
                        style={{ width: `${Math.min(100, (card.remaining_group_sessions / 10) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {card.remaining_private_sessions !== undefined && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, (card.remaining_private_sessions / 10) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MemberCard; 