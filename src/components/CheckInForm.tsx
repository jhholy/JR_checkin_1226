import React, { useState } from 'react';
import { CheckInFormData, ClassType } from '../types/database';
import { validateCheckInForm } from '../utils/validation/formValidation';
import EmailVerification from './member/EmailVerification';
import CheckInFormFields from './member/CheckInFormFields';

interface Props {
  onSubmit: (data: CheckInFormData) => Promise<void>;
  isNewMember?: boolean;
  requireEmail?: boolean;
}

export default function CheckInForm({ onSubmit, isNewMember = false, requireEmail = false }: Props) {
  const [formData, setFormData] = useState<CheckInFormData>({
    name: '',
    email: '',
    classType: 'morning'
  });
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateCheckInForm(formData.name, formData.email, needsEmailVerification || requireEmail);
    if (!validation.isValid) {
      setError(validation.error || '验证失败。Validation failed.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('duplicate_name')) {
          setNeedsEmailVerification(true);
        } else {
          setError(err.message);
        }
      } else {
        setError('签到失败，请重试。Check-in failed, please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerification = async (email: string) => {
    setFormData(prev => ({ ...prev, email }));
    await onSubmit({ ...formData, email });
  };

  if (needsEmailVerification) {
    return (
      <EmailVerification
        memberName={formData.name.trim()}
        onSubmit={handleEmailVerification}
        onCancel={() => {
          setNeedsEmailVerification(false);
          setFormData(prev => ({ ...prev, email: '' }));
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <CheckInFormFields
        name={formData.name}
        email={formData.email}
        classType={formData.classType}
        loading={loading}
        isNewMember={isNewMember}
        requireEmail={requireEmail}
        onChange={handleFieldChange}
      />

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <button
        type="submit"
        className="w-full bg-[#4285F4] text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={loading}
      >
        {loading ? '签到中... Checking in...' : '签到 Check-in'}
      </button>
    </form>
  );
}