import React, { useState } from 'react';
import { CheckInFormData, ClassType } from '../types/database';
import { validateCheckInForm } from '../utils/validation/formValidation';
import EmailVerification from './member/EmailVerification';
import CheckInFormFields from './member/CheckInFormFields';
import PrivateClassFields from './member/PrivateClassFields';
import { CheckInResult } from '../types/checkIn';

interface Props {
  onSubmit: (data: CheckInFormData) => Promise<CheckInResult>;
  courseType: 'group' | 'private';
  isNewMember?: boolean;
  requireEmail?: boolean;
}

export default function CheckInForm({ onSubmit, courseType, isNewMember = false, requireEmail = true }: Props) {
  const [formData, setFormData] = useState<CheckInFormData>({
    name: '',
    email: '',
    classType: 'morning',
    // 私教课程特有字段
    trainerId: '',
    timeSlot: '',
    is1v2: false
  });
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFieldChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    if (needsEmailVerification) {
      setNeedsEmailVerification(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateCheckInForm(formData.name, formData.email);
    if (!validation.isValid) {
      setError(validation.error || '验证失败。Validation failed.');
      return;
    }

    // 私教课程的额外验证
    if (courseType === 'private') {
      if (!formData.trainerId) {
        setError('请选择教练。Please select a trainer.');
        return;
      }
      if (!formData.timeSlot) {
        setError('请选择时段。Please select a time slot.');
        return;
      }
    }

    setError('');
    setLoading(true);

    try {
      const result = await onSubmit({
        ...formData,
        courseType // 添加课程类型
      });
      if (result.isDuplicate) {
        setError(result.message);
      } else if (result.needsEmailVerification) {
        setNeedsEmailVerification(true);
        setError('');
      } else if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('签到失败，请重试。Check-in failed, please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerification = async (email: string) => {
    setFormData(prev => ({ ...prev, email }));
    try {
      const result = await onSubmit({ ...formData, email });
      if (!result.success) {
        setError(result.message);
        if (result.needsEmailVerification) {
          setNeedsEmailVerification(true);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '邮箱验证失败，请重试。Email verification failed, please try again.');
      setNeedsEmailVerification(true);
    }
  };

  if (needsEmailVerification) {
    return (
      <EmailVerification
        memberName={formData.name.trim()}
        onSubmit={handleEmailVerification}
        onCancel={() => {
          setNeedsEmailVerification(false);
          setFormData(prev => ({ ...prev, email: '' }));
          setError('');
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本信息字段 */}
      <CheckInFormFields
        name={formData.name}
        email={formData.email}
        classType={formData.classType}
        loading={loading}
        isNewMember={isNewMember}
        onChange={handleFieldChange}
        showClassType={courseType === 'group'} // 只在团课时显示早课/晚课选择
      />

      {/* 私教课程特有字段 */}
      {courseType === 'private' && (
        <PrivateClassFields
          trainerId={formData.trainerId}
          timeSlot={formData.timeSlot}
          is1v2={formData.is1v2}
          loading={loading}
          onChange={handleFieldChange}
        />
      )}

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 px-4 rounded-lg text-white transition-colors ${
          loading ? 'bg-gray-400 cursor-not-allowed' : 
          courseType === 'private' ? 'bg-[#EA4335] hover:bg-red-600' : 'bg-[#4285F4] hover:bg-blue-600'
        }`}
      >
        {loading ? '签到中... Checking in...' : '签到 Check-in'}
      </button>
    </form>
  );
}