import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Props {
  status: {
    success: boolean;
    isExtra?: boolean;
    message: string;
    existingMember?: boolean;
    isDuplicate?: boolean;
    needsEmailVerification?: boolean;
    isNewMember?: boolean;
  };
}

export default function CheckInResult({ status }: Props) {
  return (
    <div className="text-center py-8">
      {status.existingMember ? (
        <>
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-xl font-semibold mb-2">会员已存在</h2>
          <p className="text-gray-600 mb-6 whitespace-pre-line">{status.message}</p>
          <Link
            to="/member"
            className="inline-block px-4 py-2 bg-[#4285F4] text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            前往会员签到 Go to Member Check-in
          </Link>
        </>
      ) : status.success ? (
        <>
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h2 className="text-xl font-semibold mb-2">
            {status.isNewMember ? '新会员签到成功！' : 
             status.isExtra ? '额外签到成功！' : '签到成功！'}
          </h2>
          <p className="text-gray-600 mb-6 whitespace-pre-line">{status.message}</p>
          <p className="text-sm text-gray-500">
            页面将在3秒后自动返回首页...
            <br />
            Redirecting to home page in 3 seconds...
          </p>
        </>
      ) : (
        <>
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-xl font-semibold mb-2">
            {status.needsEmailVerification ? '重名会员提醒' : 
             status.isDuplicate ? '重复签到提醒' : '签到失败'}
          </h2>
          <p className="text-gray-600 mb-6 whitespace-pre-line">{status.message}</p>
          <Link
            to="/"
            className="inline-block px-4 py-2 bg-[#EA4335] text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            返回首页 Return Home
          </Link>
        </>
      )}
    </div>
  );
}