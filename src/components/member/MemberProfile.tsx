import React from 'react';
import { Member, MembershipCard } from '../../types/database';
import { formatDate } from '../../utils/formatters';
import { User, CreditCard, Calendar } from 'lucide-react';
import { getFullCardName } from '../../utils/membership/formatters';

interface Props {
  member: Member & { membership_cards?: MembershipCard[] };
}

export default function MemberProfile({ member }: Props) {
  const getCardDetails = (card: MembershipCard) => {
    const cardName = getFullCardName(card.card_type, card.card_category, card.card_subtype);

    const remaining = card.card_type === '私教课' 
      ? card.remaining_private_sessions 
      : card.remaining_group_sessions;

    return (
      <div key={card.id} className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CreditCard className="w-5 h-5 text-[#4285F4]" />
            <div>
              <h4 className="font-medium text-gray-900">{cardName}</h4>
              {card.valid_until && (
                <p className="text-sm text-gray-500">
                  到期日期: {formatDate(card.valid_until)}
                </p>
              )}
            </div>
          </div>
          {remaining !== null && (
            <div className="text-right">
              <p className="text-sm text-gray-500">剩余课时</p>
              <p className={`font-medium ${remaining <= 2 ? 'text-orange-600' : 'text-gray-900'}`}>
                {remaining}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* 基本信息 */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <User className="w-5 h-5 text-[#4285F4]" />
            <h3 className="text-lg font-medium">个人信息 Personal Info</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">姓名 Name</p>
              <p className="font-medium">{member.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">邮箱 Email</p>
              <p className="font-medium">{member.email || '-'}</p>
            </div>
          </div>
        </div>

        {/* 会员卡信息 */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="w-5 h-5 text-[#4285F4]" />
            <h3 className="text-lg font-medium">会员卡信息 Membership Cards</h3>
          </div>
          <div className="space-y-4">
            {member.membership_cards?.length ? (
              member.membership_cards.map(card => getCardDetails(card))
            ) : (
              <p className="text-gray-500">暂无会员卡 No membership cards</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}