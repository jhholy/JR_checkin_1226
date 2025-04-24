import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckInFormData } from '../types/database';
import { useCheckIn } from '../hooks/useCheckIn';
import CheckInForm from '../components/CheckInForm';
import { MuayThaiIcon } from '../components/icons/MuayThaiIcon';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import CheckInResult from '../components/member/CheckInResult';
import NetworkError from '../components/common/NetworkError';
import { CheckInResult as CheckInResultType } from '../types/checkIn';

interface CheckInStatus {
  success: boolean;
  isExtra?: boolean;
  message: string;
  isDuplicate?: boolean;
  isNewMember?: boolean;
  courseType: 'private' | 'group';
  needsEmailVerification?: boolean;
  existingMember?: boolean;
}

export default function PrivateClassCheckIn() {
  const navigate = useNavigate();
  const { submitCheckIn, loading, error } = useCheckIn();
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus | null>(null);
  const [networkError, setNetworkError] = useState(false);

  const handleSubmit = async (formData: CheckInFormData): Promise<CheckInResultType> => {
    try {
      const result = await submitCheckIn({
        ...formData,
        courseType: 'private'  // 标记为私教签到
      });
      
      // 确保结果包含courseType
      const finalResult = {
        ...result,
        courseType: 'private' as const
      };
      
      setCheckInStatus(finalResult);

      if (finalResult.success && !finalResult.isExtra) {
        // 成功且不是额外签到时，3秒后返回首页
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
      
      return finalResult;
    } catch (err) {
      if (err instanceof Error && 
          (err.message.includes('Failed to fetch') || 
           err.message.includes('Network error'))) {
        setNetworkError(true);
      }
      
      // 返回一个错误结果
      return {
        success: false,
        message: err instanceof Error ? err.message : '签到失败，请重试。Check-in failed, please try again.',
        courseType: 'private'
      };
    }
  };

  if (networkError) {
    return <NetworkError onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <MuayThaiIcon className="w-32 h-32 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-2">私教签到 Private Class Check-in</h1>
          <p className="text-gray-600">
            请输入姓名和邮箱进行签到
            <br />
            Please enter your name and email to check in
          </p>
        </div>

        {error && <ErrorMessage message={error} />}
        {checkInStatus ? (
          <CheckInResult status={checkInStatus} />
        ) : (
          loading ? <LoadingSpinner /> : (
            <CheckInForm 
              onSubmit={handleSubmit}
              courseType="private"
              requireEmail={true}
            />
          )
        )}

        {/* 额外签到时显示返回首页按钮 */}
        {checkInStatus?.success && checkInStatus.isExtra && (
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/')}
              className="inline-block px-4 py-2 bg-[#4285F4] text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              返回首页 Return Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 