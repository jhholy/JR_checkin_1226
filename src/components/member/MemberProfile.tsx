import React from 'react';
import { Member } from '../../types/database';
import { formatMembershipType } from '../../utils/memberUtils';
import { formatDateTime } from '../../utils/dateUtils';

interface Props {
  member: Member;
}

export default function MemberProfile({ member }: Props) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">会员信息 Member Profile</h2>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">姓名 Name:</span>
          <span className="font-medium">{member.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">会员卡 Membership:</span>
          <span className="font-medium">
            {member.membership ? formatMembershipType(member.membership) : '无 None'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">剩余课时 Classes Left:</span>
          <span className="font-medium">{member.remaining_classes}</span>
        </div>
        {member.membership_expiry && (
          <div className="flex justify-between">
            <span className="text-gray-600">到期日期 Expiry:</span>
            <span className="font-medium">
              {formatDateTime(new Date(member.membership_expiry))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}