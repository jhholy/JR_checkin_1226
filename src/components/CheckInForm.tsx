import React, { useState } from 'react';
import { CheckInFormData } from '../types/database';
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
  const [formData, setFormData] = useState<CheckInFormData>(() => ({
    name: '',
    email: '',
    timeSlot: '',
    courseType,
    trainerId: '',
    is1v2: false
  }));
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
      console.error('表单基本验证失败:', validation.error);
      setError(validation.error || '验证失败。Validation failed.');
      return;
    }

    if (!formData.timeSlot) {
      console.error('时间段未选择');
      setError('请选择时间段。Please select a time slot.');
      return;
    }

    if (courseType === 'private') {
      if (!formData.trainerId) {
        console.error('私教课程未选择教练');
        setError('请选择教练。Please select a trainer.');
        return;
      }
      
      const timeSlotPattern = /^\d{2}:\d{2}-\d{2}:\d{2}$/;
      if (!timeSlotPattern.test(formData.timeSlot)) {
        console.error('时间段格式无效:', formData.timeSlot);
        setError('时间段格式无效。Invalid time slot format.');
        return;
      }
    }

    setError('');
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        courseType,
        trainerId: courseType === 'private' ? formData.trainerId : null,
        is1v2: courseType === 'private' ? formData.is1v2 : false
      };

      console.log('提交签到表单:', {
        ...submitData,
        isNewMember
      });

      const result = await onSubmit(submitData);

      if (!result) {
        throw new Error('签到失败：未收到有效响应');
      }

      console.log('签到结果:', result);

      if (result.isDuplicate) {
        setError(result.message || '今天已经签到过了。Already checked in today.');
      } else if (result.needsEmailVerification) {
        setNeedsEmailVerification(true);
        setError('');
      } else if (!result.success) {
        setError(result.message || '签到失败。Check-in failed.');
      }
    } catch (err) {
      console.error('表单提交错误:', {
        error: err,
        formData: {
          ...formData,
          courseType
        }
      });

      let errorMessage = '签到失败，请重试。Check-in failed, please try again.';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = (err as any).message || errorMessage;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerification = async (email: string) => {
    setFormData(prev => ({ ...prev, email }));
    try {
      const result = await onSubmit({
        ...formData,
        email,
        courseType,
        trainerId: courseType === 'private' ? formData.trainerId : null,
        is1v2: courseType === 'private' ? formData.is1v2 : false
      });

      if (!result || !result.success) {
        setError(result?.message || '邮箱验证失败。Email verification failed.');
        if (result?.needsEmailVerification) {
          setNeedsEmailVerification(true);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '邮箱验证失败，请重试。Email verification failed, please try again.';
      setError(errorMessage);
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
      <CheckInFormFields
        name={formData.name}
        email={formData.email}
        timeSlot={formData.timeSlot}
        loading={loading}
        isNewMember={isNewMember}
        onChange={handleFieldChange}
        showTimeSlot={courseType === 'group'}
      />

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