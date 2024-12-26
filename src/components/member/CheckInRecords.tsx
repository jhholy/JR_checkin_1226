import React from 'react';
import { useCheckInRecords } from '../../hooks/useCheckInRecords';
import { useAuth } from '../../hooks/useAuth';
import { formatDateTime } from '../../utils/dateUtils';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

interface Props {
  memberId: string;
  limit?: number;
}

export default function CheckInRecords({ memberId, limit = 30 }: Props) {
  const { user } = useAuth();
  const { records, loading, error } = useCheckInRecords(memberId, limit);

  // Only show records for admin users
  if (!user) return null;
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">签到记录 Check-in Records</h3>
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
            {records.map((record) => (
              <tr key={record.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {formatDateTime(new Date(record.created_at))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {record.class_type === 'morning' ? '早课 Morning' : '晚课 Evening'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {record.is_extra ? (
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
  );
}