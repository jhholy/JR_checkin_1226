import React from 'react';
import { Member } from '../../types/database';
import { formatDateTime } from '../../utils/dateUtils';
import { formatMembershipType } from '../../utils/memberUtils';
import { useCheckInRecords } from '../../hooks/useCheckInRecords';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

interface Props {
  member: Member;
}

export default function MemberDetails({ member }: Props) {
  const { records, loading, error } = useCheckInRecords(member.id, 50);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">会员详情 Member Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">姓名 Name</p>
            <p className="font-medium">{member.name}</p>
          </div>
          <div>
            <p className="text-gray-600">邮箱 Email</p>
            <p className="font-medium">{member.email || '-'}</p>
          </div>
          <div>
            <p className="text-gray-600">会员卡 Membership</p>
            <p className="font-medium">
              {member.membership ? formatMembershipType(member.membership) : '-'}
            </p>
          </div>
          <div>
            <p className="text-gray-600">剩余课时 Classes Left</p>
            <p className="font-medium">{member.remaining_classes}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">签到记录 Check-in History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  日期 Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  课程 Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  状态 Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((checkIn) => (
                <tr key={checkIn.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatDateTime(new Date(checkIn.created_at))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {checkIn.class_type === 'morning' ? '早课 Morning' : '晚课 Evening'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {checkIn.is_extra ? (
                      <span className="text-muaythai-red">额外签到 Extra</span>
                    ) : (
                      <span className="text-green-600">正常 Regular</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {records.length === 0 && (
            <p className="text-center text-gray-500 py-4">
              暂无签到记录 No check-in records
            </p>
          )}
        </div>
      </div>
    </div>
  );
}