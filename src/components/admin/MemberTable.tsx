import React from 'react';
import { Member } from '../../types/database';
import { formatMembershipType, isMonthlyMembership } from '../../utils/memberUtils';
import { formatDateTime } from '../../utils/dateUtils';
import { Pencil, Trash2 } from 'lucide-react';

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
  const getRemainingClasses = (member: Member) => {
    if (isMonthlyMembership(member.membership)) {
      return 'N/A';
    }
    return member.remaining_classes || 0;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                会员 Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                卡类型 Membership
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                剩余课时 Classes Left
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                到期日期 Expiry
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作 Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members.map(member => (
              <tr key={member.id}>
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
                  <span className="text-sm text-gray-900">
                    {member.membership_expiry 
                      ? formatDateTime(new Date(member.membership_expiry))
                      : '-'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => onEdit(member)}
                      className="text-muaythai-blue hover:text-blue-700 flex items-center"
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      编辑 Edit
                    </button>
                    <button
                      onClick={() => onDelete(member.id)}
                      className="text-muaythai-red hover:text-red-700 flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      删除 Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            第 {currentPage} 页，共 {totalPages} 页
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
            >
              上一页 Prev
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
            >
              下一页 Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}