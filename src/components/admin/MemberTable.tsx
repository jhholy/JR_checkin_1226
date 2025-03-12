import React, { useState } from 'react';
import { Database } from '../../types/database';
import { formatCardType, formatCardValidity, formatRemainingClasses } from '../../utils/membership/formatters';
import EditMemberModal from './EditMemberModal';
import { supabase } from '../../lib/supabase';

type Member = Database['public']['Tables']['members']['Row'];
type MembershipCard = Database['public']['Tables']['membership_cards']['Row'];

interface MemberTableProps {
  members: (Member & { membership_cards: MembershipCard[] })[];
  onMemberUpdated: () => void;
  onEdit: (member: Member & { membership_cards: MembershipCard[] }) => void;
  onDelete: (memberId: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function MemberTable({ 
  members, 
  onMemberUpdated, 
  onEdit, 
  onDelete,
  currentPage,
  totalPages,
  onPageChange
}: MemberTableProps) {
  const [editingMember, setEditingMember] = useState<Member & { membership_cards: MembershipCard[] } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEditClick = (member: Member & { membership_cards: MembershipCard[] }) => {
    onEdit(member);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
  };

  const handleMemberUpdated = () => {
    setIsModalOpen(false);
    setEditingMember(null);
    onMemberUpdated();
  };

  const handleDeleteMember = async (memberId: string) => {
    onDelete(memberId);
  };

  // 分页控件
  const Pagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-center mt-4 space-x-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 rounded ${
              currentPage === page
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {page}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              姓名
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              邮箱
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              到期状态
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              会员卡
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {members.map((member) => (
            <tr key={member.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{member.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{member.email || '-'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm">
                  {member.membership_cards && member.membership_cards.length > 0 ? (
                    member.membership_cards.some(card => {
                      const validUntil = card.valid_until ? new Date(card.valid_until) : null;
                      const now = new Date();
                      if (!validUntil) return false;
                      
                      // 已过期
                      if (validUntil < now) {
                        return true;
                      }
                      
                      // 即将过期（7天内）
                      const diffTime = validUntil.getTime() - now.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return diffDays <= 7;
                    }) ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        即将过期/已过期
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        正常
                      </span>
                    )
                  ) : (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      无会员卡
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  {member.membership_cards && member.membership_cards.length > 0 ? (
                    <ul className="list-disc pl-5">
                      {member.membership_cards.map((card) => (
                        <li key={card.id} className="mb-1">
                          <span className="font-medium">{formatCardType(card)}</span>
                          <br />
                          <span className="text-xs text-gray-500">
                            {formatRemainingClasses(card)} | {formatCardValidity(card)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-500">无会员卡</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => handleEditClick(member)}
                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDeleteMember(member.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  删除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination />
    </div>
  );
}