import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Props {
  status: {
    success: boolean;
    isExtra?: boolean;
    message: string;
    isDuplicate?: boolean;
    isNewMember?: boolean;
    existingMember?: boolean;
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
            className="inline-block bg-muaythai-blue text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            前往会员签到 Go to Member Check-in
          </Link>
        </>
      ) : status.success ? (
        <>
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h2 className="text-xl font-semibold mb-2">
            {status.isExtra ? '新会员签到成功！' : '签到成功！'}
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
          {status.isDuplicate ? (
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          ) : (
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          )}
          <h2 className="text-xl font-semibold mb-2">
            {status.isDuplicate ? '重名会员提醒' : '签到失败'}
          </h2>
          <p className="text-gray-600 mb-6 whitespace-pre-line">{status.message}</p>
          <Link
            to="/"
            className="inline-block bg-muaythai-red text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            返回首页 Return Home
          </Link>
        </>
      )}
    </div>
  );
}