import React, { useState } from 'react';
import { Member, MembershipType, MembershipCard } from '../../types/database';
import { formatDateForDB } from '../../utils/dateUtils';
import { isMonthlyMembership } from '../../utils/memberUtils';
import { validateName } from '../../utils/nameValidation';
import { validateEmail } from '../../utils/validation/emailValidation';
import { addDays } from 'date-fns';
import { Plus, X, AlertCircle, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  member: Member & { membership_cards?: MembershipCard[] };
  onClose: () => void;
  onUpdate: (memberId: string, updates: Partial<Member>) => Promise<void>;
}

interface MembershipCardForm {
  id?: string;
  card_type: string;
  card_category?: string;
  card_subtype: string;
  trainer_type?: string;
  remaining_group_sessions?: number;
  remaining_private_sessions?: number;
  valid_until: string;
}

export default function EditMemberModal({ member, onClose, onUpdate }: Props) {
  const [basicInfo, setBasicInfo] = useState({
    name: member.name,
    email: member.email || '',
  });
  
  const [membershipCards, setMembershipCards] = useState<MembershipCardForm[]>(
    member.membership_cards?.map(card => ({
      id: card.id,
      card_type: card.card_type,
      card_category: card.card_category,
      card_subtype: card.card_subtype,
      trainer_type: card.trainer_type,
      remaining_group_sessions: card.remaining_group_sessions,
      remaining_private_sessions: card.remaining_private_sessions,
      valid_until: card.valid_until?.split('T')[0] || ''
    })) || []
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // 添加新会员卡
  const handleAddCard = () => {
    setMembershipCards(prev => [...prev, {
      card_type: '',
      card_subtype: '',
      valid_until: ''
    }]);
  };

  // 删除会员卡
  const handleRemoveCard = (index: number) => {
    setMembershipCards(prev => prev.filter((_, i) => i !== index));
  };

  // 更新会员卡信息
  const handleCardChange = (index: number, updates: Partial<MembershipCardForm>) => {
    setMembershipCards(prev => prev.map((card, i) => 
      i === index ? { ...card, ...updates } : card
    ));
  };

  // 快捷操作函数
  const quickActions = {
    extendOneMonth: (index: number) => {
      const card = membershipCards[index];
      const currentExpiry = card.valid_until 
        ? new Date(card.valid_until)
        : new Date();
      const newExpiry = addDays(currentExpiry, 30);
      handleCardChange(index, {
        valid_until: newExpiry.toISOString().split('T')[0]
      });
    },

    addTenClasses: (index: number) => {
      const card = membershipCards[index];
      const current = card.remaining_group_sessions || 0;
      handleCardChange(index, {
        remaining_group_sessions: current + 10
      });
    },

    upgradeToDouble: (index: number) => {
      handleCardChange(index, {
        card_type: 'monthly',
        card_subtype: 'double_monthly'
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!validateName(basicInfo.name)) {
      newErrors.name = '无效的姓名格式 Invalid name format';
    }

    if (basicInfo.email && !validateEmail(basicInfo.email)) {
      newErrors.email = '无效的邮箱格式 Invalid email format';
    }

    membershipCards.forEach((card, index) => {
      if (!card.card_type) {
        newErrors[`card_${index}_type`] = '请选择卡类型';
      }
      if (!card.card_subtype) {
        newErrors[`card_${index}_subtype`] = '请选择具体类型';
      }
      if (!card.valid_until) {
        newErrors[`card_${index}_valid_until`] = '请设置有效期';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setErrors({});

      // 更新现有卡
      const updatePromises = membershipCards
        .filter(card => card.id) // 只处理已有ID的卡
        .map(card => {
          return supabase
            .from('membership_cards')
            .update({
              card_type: card.card_type,
              card_category: card.card_category || null,
              card_subtype: card.card_subtype,
              trainer_type: card.trainer_type || null,
              remaining_group_sessions: card.remaining_group_sessions || null,
              remaining_private_sessions: card.remaining_private_sessions || null,
              valid_until: card.valid_until || null,
            })
            .eq('id', card.id);
        });

      const updateResults = await Promise.all(updatePromises);
      const updateError = updateResults.find(result => result.error);
      if (updateError?.error) {
        console.error('更新会员卡失败:', updateError.error);
        throw new Error(`更新会员卡失败: ${updateError.error.message}`);
      }

      // 插入新卡
      const newCards = membershipCards.filter(card => !card.id);
      if (newCards.length > 0) {
        const { error: insertError } = await supabase
          .from('membership_cards')
          .insert(
            newCards.map(card => ({
              member_id: member.id,
              card_type: card.card_type,
              card_category: card.card_category || null,
              card_subtype: card.card_subtype,
              trainer_type: card.trainer_type || null,
              remaining_group_sessions: card.remaining_group_sessions || null,
              remaining_private_sessions: card.remaining_private_sessions || null,
              valid_until: card.valid_until || null,
              created_at: new Date().toISOString()
            }))
          );

        if (insertError) {
          console.error('插入新会员卡失败:', insertError);
          throw new Error(`插入新会员卡失败: ${insertError.message}`);
        }
      }

      // 更新会员基本信息
      await onUpdate(member.id, {
        name: basicInfo.name,
        email: basicInfo.email || null,
      });

      onClose();
    } catch (err) {
      console.error('提交表单时出错:', err);
      setErrors({ submit: err instanceof Error ? err.message : '保存失败' });
    } finally {
      setLoading(false);
    }
  };

  // 添加单独的删除卡片方法
  const handleDeleteCard = async (cardId: string) => {
    if (!window.confirm('确定要删除这张会员卡吗？此操作不可撤销。\nAre you sure you want to delete this membership card? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);

      // 1. 先删除关联的签到记录
      const { error: checkInsError } = await supabase
        .from('check_ins')
        .delete()
        .eq('card_id', cardId);

      if (checkInsError) {
        console.error('删除签到记录失败:', checkInsError);
        throw new Error(`删除签到记录失败: ${checkInsError.message}`);
      }

      // 2. 再删除会员卡
      const { error } = await supabase
        .from('membership_cards')
        .delete()
        .eq('id', cardId);

      if (error) {
        console.error('删除会员卡失败:', error);
        throw new Error(`删除会员卡失败: ${error.message}`);
      }

      // 3. 从本地状态中移除该卡
      setMembershipCards(cards => cards.filter(card => card.id !== cardId));
    } catch (err) {
      console.error('删除会员卡时出错:', err);
      setErrors({ submit: err instanceof Error ? err.message : '删除失败' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">编辑会员 Edit Member</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 基本信息 */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              姓名 Name
            </label>
            <input
              type="text"
              value={basicInfo.name}
              onChange={(e) => setBasicInfo(prev => ({ ...prev, name: e.target.value }))}
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
              value={basicInfo.email}
              onChange={(e) => setBasicInfo(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
          </div>
        </div>

        {/* 会员卡列表 */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">会员卡管理 Membership Cards</h3>
            <button
              onClick={handleAddCard}
              className="inline-flex items-center px-3 py-1.5 bg-[#4285F4] text-white rounded-lg hover:bg-blue-600 transition-colors gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>添加会员卡 Add Card</span>
            </button>
          </div>

          {membershipCards.map((card, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">会员卡 #{index + 1}</h4>
                <div className="flex gap-2">
                  {card.id && (
                    <button
                      onClick={() => handleDeleteCard(card.id as string)}
                      className="text-red-600 hover:text-red-800"
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveCard(index)}
                    className="text-gray-500 hover:text-gray-700"
                    disabled={loading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    卡类型 Card Type
                  </label>
                  <select
                    value={card.card_type}
                    onChange={(e) => {
                      const type = e.target.value;
                      handleCardChange(index, { 
                        card_type: type,
                        card_category: type === 'private' ? 'private' : 'group',
                        remaining_group_sessions: type === 'private' ? undefined : 0,
                        remaining_private_sessions: type === 'private' ? 0 : undefined
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">选择卡类型 Select Type</option>
                    <option value="class">课时卡 Class Card</option>
                    <option value="monthly">月卡 Monthly Card</option>
                    <option value="private">私教卡 Private Card</option>
                  </select>
                  {errors[`card_${index}_type`] && (
                    <p className="text-red-600 text-sm mt-1">{errors[`card_${index}_type`]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    具体类型 Subtype
                  </label>
                  <select
                    value={card.card_subtype}
                    onChange={(e) => handleCardChange(index, { card_subtype: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">选择具体类型 Select Subtype</option>
                    {card.card_type === 'class' && (
                      <>
                        <option value="single_class">单次卡 Single Class</option>
                        <option value="two_classes">两次卡 Two Classes</option>
                        <option value="ten_classes">10次卡 Ten Classes</option>
                      </>
                    )}
                    {card.card_type === 'monthly' && (
                      <>
                        <option value="single_monthly">单次月卡 Single Monthly</option>
                        <option value="double_monthly">双次月卡 Double Monthly</option>
                      </>
                    )}
                    {card.card_type === 'private' && (
                      <>
                        <option value="single_private">单次私教 Single Private</option>
                        <option value="ten_private">10次私教 Ten Private</option>
                      </>
                    )}
                  </select>
                  {errors[`card_${index}_subtype`] && (
                    <p className="text-red-600 text-sm mt-1">{errors[`card_${index}_subtype`]}</p>
                  )}
                </div>

                {card.card_type === 'private' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      教练等级 Trainer Type
                    </label>
                    <select
                      value={card.trainer_type}
                      onChange={(e) => handleCardChange(index, { trainer_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">选择教练等级 Select Trainer Type</option>
                      <option value="jr">JR教练</option>
                      <option value="senior">高级教练</option>
                    </select>
                  </div>
                )}

                {card.card_type === 'class' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      剩余课时 Remaining Classes
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={card.remaining_group_sessions || 0}
                      onChange={(e) => handleCardChange(index, { 
                        remaining_group_sessions: parseInt(e.target.value) || 0 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                )}

                {card.card_type === 'private' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      剩余私教课时 Remaining Private Classes
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={card.remaining_private_sessions || 0}
                      onChange={(e) => handleCardChange(index, { 
                        remaining_private_sessions: parseInt(e.target.value) || 0 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    有效期 Valid Until
                  </label>
                  <input
                    type="date"
                    value={card.valid_until}
                    onChange={(e) => handleCardChange(index, { valid_until: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {errors[`card_${index}_valid_until`] && (
                    <p className="text-red-600 text-sm mt-1">{errors[`card_${index}_valid_until`]}</p>
                  )}
                </div>
              </div>

              {/* 快捷操作按钮 */}
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  onClick={() => quickActions.extendOneMonth(index)}
                  className="px-3 py-1.5 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200"
                >
                  续期一个月 +1 Month
                </button>
                {card.card_type !== 'monthly' && (
                  <button
                    onClick={() => quickActions.addTenClasses(index)}
                    className="px-3 py-1.5 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200"
                  >
                    补充10次课时 +10 Classes
                  </button>
                )}
                {card.card_type === 'monthly' && card.card_subtype !== 'double_monthly' && (
                  <button
                    onClick={() => quickActions.upgradeToDouble(index)}
                    className="px-3 py-1.5 text-sm bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200"
                  >
                    升级双次卡 Upgrade to Double
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {errors.submit && (
          <p className="text-red-600 text-sm mb-4">{errors.submit}</p>
        )}

        <div className="flex justify-end space-x-3">
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