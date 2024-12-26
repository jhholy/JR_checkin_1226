import React from 'react';
import { CheckIn } from '../../types/database';
import { formatDate } from '../../utils/dateUtils';

interface Props {
  records: CheckIn[];
  totalCount: number;
  filters: {
    memberName?: string;
    startDate?: string;
    endDate?: string;
  };
}

export default function CheckInSummary({ records, totalCount, filters }: Props) {
  const regularCheckIns = records.filter(r => !r.is_extra).length;
  const extraCheckIns = records.filter(r => r.is_extra).length;
  
  const memberName = filters.memberName ? `${filters.memberName}` : '所有会员';
  const dateRange = filters.startDate && filters.endDate
    ? `${formatDate(filters.startDate)}至${formatDate(filters.endDate)}期间`
    : '所有时间';

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <p className="text-gray-700">
        {memberName}在{dateRange}共签到<span className="font-semibold text-muaythai-blue">{totalCount}</span>次，
        其中正常签到<span className="font-semibold text-green-600">{regularCheckIns}</span>次，
        额外签到<span className="font-semibold text-muaythai-red">{extraCheckIns}</span>次。
      </p>
    </div>
  );
}