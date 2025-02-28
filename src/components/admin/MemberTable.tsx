import React from 'react';
import { Member } from '../../types/database';
import { formatMembershipType, isMonthlyMembership } from '../../utils/memberUtils';
import { formatDate, isWithinDays, isPast } from '../../utils/dateUtils';
import { Pencil, Trash2, AlertCircle } from 'lucide-react';

interface Props {
  members: Member[];
  onEdit: (member: Member) => void;
  onDelete: (memberId: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function MemberTable({ 
  members, 
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  onPageChange 
}: Props) {
  const getMembershipStatus = (member: Member) => {
    if (!member.membership) return null;

    const isExpiringSoon = member.membership_expiry && isWithinDays(new Date(member.membership_expiry), 7);
    const isExpired = member.membership_expiry && isPast(new Date(member.membership_expiry));
    const hasLowClasses = !isMonthlyMembership(member.membership) && (member.remaining_classes || 0) <= 2;

    if (isExpired) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          已过期
        </span>
      );
    }

    if (isExpiringSoon) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          即将到期
        </span>
      );
    }

    if (hasLowClasses) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          课时不足
        </span>
      );
    }

    return null;
  };

  const getRemainingClasses = (member: Member) => {
    if (isMonthlyMembership(member.membership)) {
      return 'N/A';
    }
    const remaining = member.remaining_classes || 0;
    return (
      <span className={`${remaining <= 2 ? 'text-orange-600 font-medium' : ''}`}>
        {remaining}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                会员 MEMBER
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                卡类型 MEMBERSHIP
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                剩余课时 CLASSES LEFT
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                到期日期 EXPIRY
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态 STATUS
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作 ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members.map(member => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {member.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {member.email}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {member.membership ? formatMembershipType(member.membership) : '-'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {getRemainingClasses(member)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm ${
                    member.membership_expiry && isWithinDays(new Date(member.membership_expiry), 7)
                      ? 'text-yellow-600 font-medium'
                      : 'text-gray-900'
                  }`}>
                    {member.membership_expiry 
                      ? formatDate(member.membership_expiry)
                      : '-'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getMembershipStatus(member)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(member)}
                      className="inline-flex items-center px-3 py-1.5 bg-[#4285F4] text-white rounded-lg hover:bg-blue-600 transition-colors gap-1"
                    >
                      <Pencil className="w-4 h-4" />
                      <span>编辑 Edit</span>
                    </button>
                    <button
                      onClick={() => onDelete(member.id)}
                      className="inline-flex items-center px-3 py-1.5 bg-[#EA4335] text-white rounded-lg hover:bg-red-600 transition-colors gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>删除 Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              第 {currentPage} 页，共 {totalPages} 页
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-md text-sm text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                上一页 Prev
              </button>
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-md text-sm text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                下一页 Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}