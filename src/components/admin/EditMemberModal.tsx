import React, { useState } from 'react';
import { Member, MembershipType } from '../../types/database';
import { formatDateForDB } from '../../utils/dateUtils';
import { isMonthlyMembership } from '../../utils/memberUtils';
import { validateName } from '../../utils/nameValidation';
import { validateEmail } from '../../utils/validation/emailValidation';

interface Props {
  member: Member;
  onClose: () => void;
  onUpdate: (memberId: string, updates: Partial<Member>) => Promise<void>;
}

export default function EditMemberModal({ member, onClose, onUpdate }: Props) {
  const [formData, setFormData] = useState({
    name: member.name,
    email: member.email || '',
    membership: member.membership || '',
    remaining_classes: member.remaining_classes?.toString() || '0',
    membership_expiry: member.membership_expiry?.split('T')[0] || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!validateName(formData.name)) {
      newErrors.name = '无效的姓名格式 Invalid name format';
    }

    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = '无效的邮箱格式 Invalid email format';
    }

    if (formData.membership) {
      if (isMonthlyMembership(formData.membership as MembershipType)) {
        if (!formData.membership_expiry) {
          newErrors.membership_expiry = '月卡需要设置到期日期 Monthly membership requires expiry date';
        }
      } else {
        const classes = parseInt(formData.remaining_classes);
        if (isNaN(classes) || classes < 0) {
          newErrors.remaining_classes = '请输入有效的剩余课时 Please enter valid remaining classes';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const updates: Partial<Member> = {
        name: formData.name,
        email: formData.email || null,
        membership: (formData.membership || null) as MembershipType | null,
        remaining_classes: parseInt(formData.remaining_classes) || 0,
        membership_expiry: formData.membership_expiry ? 
          formatDateForDB(formData.membership_expiry) : null
      };

      await onUpdate(member.id, updates);
      onClose();
    } catch (error) {
      console.error('Failed to update member:', error);
      setErrors({ submit: '更新失败，请重试 Update failed, please try again' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
        <h2 className="text-xl font-bold mb-4">
          编辑会员 Edit Member
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              姓名 Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              邮箱 Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              卡类型 Membership Type
            </label>
            <select
              value={formData.membership}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                membership: e.target.value,
                remaining_classes: isMonthlyMembership(e.target.value as MembershipType) ? '0' : prev.remaining_classes
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">无卡 None</option>
              <option value="single_class">单次卡 Single Class</option>
              <option value="two_classes">两次卡 Two Classes</option>
              <option value="ten_classes">10次卡 Ten Classes</option>
              <option value="single_monthly">单次月卡 Single Monthly</option>
              <option value="double_monthly">双次月卡 Double Monthly</option>
            </select>
          </div>

          {formData.membership && !isMonthlyMembership(formData.membership as MembershipType) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                剩余课时 Remaining Classes
              </label>
              <input
                type="number"
                min="0"
                value={formData.remaining_classes}
                onChange={(e) => setFormData(prev => ({ ...prev, remaining_classes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {errors.remaining_classes && (
                <p className="text-red-600 text-sm mt-1">{errors.remaining_classes}</p>
              )}
            </div>
          )}

          {formData.membership && isMonthlyMembership(formData.membership as MembershipType) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                到期日期 Expiry Date
              </label>
              <input
                type="date"
                value={formData.membership_expiry}
                onChange={(e) => setFormData(prev => ({ ...prev, membership_expiry: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {errors.membership_expiry && (
                <p className="text-red-600 text-sm mt-1">{errors.membership_expiry}</p>
              )}
            </div>
          )}
        </div>

        {errors.submit && (
          <p className="text-red-600 text-sm mt-4">{errors.submit}</p>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={loading}
          >
            取消 Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-[#4285F4] text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? '保存中... Saving...' : '保存 Save'}
          </button>
        </div>
      </div>
    </div>
  );
}