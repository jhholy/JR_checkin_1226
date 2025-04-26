import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';
import CardForm from './CardForm';
import { XCircle, CheckCircle } from 'lucide-react';

// 卡类型映射
const getCardTypeDisplay = (type: string | null): string => {
  if (!type) return '未知';
  if (type === 'class') return '团课';
  if (type === 'private') return '私教课';
  return type; // 返回原值，以防已经是中文
};

// 卡类别映射
const getCardCategoryDisplay = (category: string | null): string => {
  if (!category) return '';
  if (category === 'group') return '课时卡';
  if (category === 'private') return '私教';
  if (category === 'monthly') return '月卡';
  return category; // 返回原值，以防已经是中文
};

// 卡子类型映射
const getCardSubtypeDisplay = (subtype: string | null): string => {
  if (!subtype) return '';
  
  // 团课卡子类型
  if (subtype === 'ten_classes' || subtype === 'group_ten_class') return '10次卡';
  if (subtype === 'single_class') return '单次卡';
  if (subtype === 'two_classes') return '两次卡';
  
  // 私教卡子类型
  if (subtype === 'ten_private') return '10次私教';
  if (subtype === 'single_private') return '单次私教';
  
  // 月卡子类型
  if (subtype === 'single_monthly') return '单次月卡';
  if (subtype === 'double_monthly') return '双次月卡';
  
  return subtype; // 返回原值，以防已经是中文
};

// 教练类型映射
const getTrainerTypeDisplay = (type: string | null): string => {
  if (!type) return '';
  if (type === 'jr') return 'JR教练';
  if (type === 'senior') return '高级教练';
  return type;
};
type Member = Database['public']['Tables']['members']['Row'];
type MembershipCard = Database['public']['Tables']['membership_cards']['Row'];

interface EditMemberModalProps {
  member: Member & { membership_cards: MembershipCard[] };
  onClose: () => void;
  onUpdate: (memberId: string, updates: Partial<Member>) => Promise<void>;
  refreshMemberList: () => void;
}


export default function EditMemberModal({ member, onClose, onUpdate, refreshMemberList }: EditMemberModalProps) {
  const [formData, setFormData] = useState({
    name: member.name || '',
    email: member.email || '',
    phone: member.phone || ''
  });
  
  const [cards, setCards] = useState<MembershipCard[]>(member.membership_cards || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // 显示成功消息的函数
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    // 3秒后自动清除成功消息
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await onUpdate(member.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      });
      
      // 更新本地member对象，确保页面立即显示更新的内容
      member.name = formData.name;
      member.email = formData.email;
      member.phone = formData.phone;
      
      // 显示成功消息
      showSuccessMessage('保存会员信息成功');
      
      // 刷新会员列表
      refreshMemberList();
    } catch (error) {
      console.error('更新会员信息失败:', error);
      setError('更新会员信息失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = () => {
    setIsAddingCard(true);
    setEditingCardId(null);
  };

  const handleEditCard = (cardId: string) => {
    setEditingCardId(cardId);
    setIsAddingCard(false);
  };

  const handleCancelAddCard = () => {
    setIsAddingCard(false);
  };

  const handleCancelEditCard = () => {
    setEditingCardId(null);
  };

  const handleSaveCard = async (card: MembershipCard) => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // 标准化卡类型
      let standardizedCard = { ...card };
      
      // 根据readme.md中的定义标准化卡类型
      if (card.card_type === '团课' || card.card_type?.toLowerCase() === 'class' || card.card_type?.toLowerCase() === 'group') {
        standardizedCard.card_type = '团课';
        
        if (card.card_category?.toLowerCase() === 'session' || card.card_category?.toLowerCase() === 'sessions') {
          standardizedCard.card_category = '课时卡';
        } else if (card.card_category?.toLowerCase() === 'monthly') {
          standardizedCard.card_category = '月卡';
        }
        
        // 标准化子类型
        if (card.card_subtype?.toLowerCase().includes('single') && card.card_category?.toLowerCase() !== 'monthly') {
          standardizedCard.card_subtype = '单次卡';
        } else if (card.card_subtype?.toLowerCase().includes('two') && card.card_category?.toLowerCase() !== 'monthly') {
          standardizedCard.card_subtype = '两次卡';
        } else if (card.card_subtype?.toLowerCase().includes('ten') || card.card_subtype?.toLowerCase().includes('10')) {
          standardizedCard.card_subtype = '10次卡';
        } else if (card.card_subtype?.toLowerCase().includes('single') && card.card_category?.toLowerCase() === 'monthly') {
          standardizedCard.card_subtype = '单次月卡';
        } else if (card.card_subtype?.toLowerCase().includes('double')) {
          standardizedCard.card_subtype = '双次月卡';
        }
      } else if (card.card_type === '私教课' || card.card_type === '私教' || card.card_type?.toLowerCase() === 'private') {
        standardizedCard.card_type = '私教课';
        
        // 标准化子类型
        if (card.card_subtype?.toLowerCase().includes('single')) {
          standardizedCard.card_subtype = '单次卡';
        } else if (card.card_subtype?.toLowerCase().includes('ten') || card.card_subtype?.toLowerCase().includes('10')) {
          standardizedCard.card_subtype = '10次卡';
        }
      }
      
      console.log('保存标准化后的会员卡:', standardizedCard);

      if (editingCardId) {
        // 更新现有卡
        const { error } = await supabase
          .from('membership_cards')
          .update(standardizedCard)
          .eq('id', editingCardId);

        if (error) {
          if (error.message.includes('会员已有相同类型和子类型的卡')) {
            throw new Error('会员已有相同类型和子类型的卡，请更新现有卡或选择不同的卡类型');
          }
          throw error;
        }
        console.log('更新会员卡成功:', editingCardId);
        showSuccessMessage('更新会员卡成功');
      } else {
        // 添加新卡
        const { data, error } = await supabase
          .from('membership_cards')
          .insert({
            ...standardizedCard,
            member_id: member.id
          })
          .select();

        if (error) {
          if (error.message.includes('会员已有相同类型和子类型的卡')) {
            throw new Error('会员已有相同类型和子类型的卡，请更新现有卡或选择不同的卡类型');
          }
          throw error;
        }
        console.log('添加新会员卡成功:', data);
        showSuccessMessage('添加新会员卡成功');
      }

      // 重新获取会员卡列表
      const { data, error } = await supabase
        .from('membership_cards')
        .select('*')
        .eq('member_id', member.id);

      if (error) throw error;
      console.log('重新获取会员卡列表成功:', data);

      // 更新本地cards状态，确保页面立即显示更新的内容
      setCards(data || []);
      // 同时更新member对象中的membership_cards，确保数据一致性
      member.membership_cards = data || [];
      
      setIsAddingCard(false);
      setEditingCardId(null);
      
      // 确保刷新会员列表
      refreshMemberList();
    } catch (error) {
      console.error('保存会员卡失败:', error);
      setError(error instanceof Error ? error.message : '保存会员卡失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('确定要删除此会员卡吗？此操作不可撤销。')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // 先检查是否有签到记录引用了该会员卡
      const { data: checkInsData, error: checkInsError } = await supabase
        .from('check_ins')
        .select('id, check_in_date')
        .eq('card_id', cardId);

      if (checkInsError) throw checkInsError;

      // 如果有签到记录引用了该会员卡，询问用户是否同时删除这些记录
      if (checkInsData && checkInsData.length > 0) {
        const confirmDelete = confirm(`此会员卡已被用于${checkInsData.length}条签到记录。要删除此会员卡，需要先删除这些签到记录。是否继续？`);
        
        if (!confirmDelete) {
          setLoading(false);
          return;
        }
        
        // 用户确认删除，先删除所有引用该会员卡的签到记录
        const { error: deleteCheckInsError } = await supabase
          .from('check_ins')
          .delete()
          .eq('card_id', cardId);
          
        if (deleteCheckInsError) throw deleteCheckInsError;
        
        showSuccessMessage(`已删除${checkInsData.length}条相关签到记录`);
      }

      // 删除会员卡
      const { error } = await supabase
        .from('membership_cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;

      // 更新本地cards状态，确保页面立即显示更新的内容
      const updatedCards = cards.filter(card => card.id !== cardId);
      setCards(updatedCards);
      // 同时更新member对象中的membership_cards，确保数据一致性
      member.membership_cards = updatedCards;
      
      showSuccessMessage('删除会员卡成功');
      refreshMemberList();
    } catch (error) {
      console.error('删除会员卡失败:', error);
      setError('删除会员卡失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">编辑会员信息</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          {/* 成功消息提示 */}
          {successMessage && (
            <div className="mb-4 rounded-md bg-green-50 p-4">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  姓名 Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  邮箱 Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  电话 Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                disabled={loading}
              >
                {loading ? '保存中...' : '保存会员信息'}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">会员卡</h3>
              <button
                onClick={handleAddCard}
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                disabled={isAddingCard || editingCardId !== null}
              >
                添加会员卡
              </button>
            </div>

            {isAddingCard && (
              <div className="mb-6 p-4 border border-gray-200 rounded-md">
                <h4 className="text-md font-medium text-gray-900 mb-4">添加新会员卡</h4>
                <CardForm
                  memberId={member.id}
                  onSave={handleSaveCard}
                  onCancel={handleCancelAddCard}
                />
              </div>
            )}

            {cards.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {cards.map(card => (
                  <li key={card.id} className="py-4">
                    {editingCardId === card.id ? (
                      <div className="p-4 border border-gray-200 rounded-md">
                        <h4 className="text-md font-medium text-gray-900 mb-4">编辑会员卡</h4>
                        <CardForm
                          memberId={member.id}
                          card={card}
                          onSave={handleSaveCard}
                          onCancel={handleCancelEditCard}
                        />
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {getCardTypeDisplay(card.card_type)} {getCardCategoryDisplay(card.card_category)} {getCardSubtypeDisplay(card.card_subtype)}
                            {card.trainer_type && ` (${getTrainerTypeDisplay(card.trainer_type)})`}
                          </p>
                          <p className="text-sm text-gray-500">
                            {card.card_type === '团课' ? 
                              `剩余团课: ${card.remaining_group_sessions ?? '未设置'}` : 
                              card.card_type === '私教课' ? 
                              `剩余私教: ${card.remaining_private_sessions ?? '未设置'}` :
                              `剩余课时: ${card.remaining_group_sessions ?? card.remaining_private_sessions ?? '未设置'}`}
                            {card.valid_until && ` | 有效期至: ${new Date(card.valid_until).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditCard(card.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                            disabled={isAddingCard || editingCardId !== null}
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDeleteCard(card.id)}
                            className="text-red-600 hover:text-red-900"
                            disabled={loading}
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">该会员暂无会员卡</p>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">错误</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}