import React from 'react';
import { useExpiringMembers } from '../../../hooks/useExpiringMembers';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorMessage from '../../common/ErrorMessage';

interface Member {
  id: number;
  name: string;
  membership_type: string;
  expiry_date: string;
}

const ExpiringMembersList: React.FC = () => {
  const { members, loading, error } = useExpiringMembers();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">即将到期会员 Expiring Memberships</h3>
      {members.length === 0 ? (
        <p className="text-gray-500">暂无即将到期的会员</p>
      ) : (
        <div className="space-y-4">
          {members.map((member: Member) => (
            <div key={member.id} className="flex justify-between items-center">
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-sm text-gray-500">{member.membership_type}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-red-600">
                  到期日期: {new Date(member.expiry_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpiringMembersList;