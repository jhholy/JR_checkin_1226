import React, { useState, FormEvent } from 'react';
import type { Database } from '../../types/database';
import MemberTable from './MemberTable';
import EditMemberModal from './EditMemberModal';
import { useMemberSearch } from '../../hooks/useMemberSearch';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { UserPlus } from 'lucide-react';
import AddMemberModal from './AddMemberModal';

type Member = Database['public']['Tables']['members']['Row'];
type MembershipCard = Database['public']['Tables']['membership_cards']['Row'];
type MemberWithCards = Member & { membership_cards: MembershipCard[] };
type CardType = Database['public']['Enums']['CardType'];
type ExtendedCardType = CardType | 'no_card' | '团课' | '私教课' | 'all_cards' | '';
type CardSubtype = Database['public']['Enums']['CardSubtype'];

// 增强卡类型映射函数
const getCardTypeDisplay = (type: string | null): string => {
  if (!type) return '未知';
  
  // 转为小写处理
  const normalizedType = typeof type === 'string' ? type.toLowerCase() : '';
  
  if (normalizedType === 'class' || normalizedType.includes('团课')) {
    return '团课';
  }
  if (normalizedType === 'private' || normalizedType.includes('私教')) {
    return '私教课';
  }
  
  return type; // 返回原值
};

// 卡类别映射 - 与EditMemberModal中保持一致
const getCardCategoryDisplay = (category: string | null): string => {
  if (!category) return '';
  if (category === 'group') return '课时卡';
  if (category === 'private') return '私教';
  if (category === 'monthly') return '月卡';
  return category;
};

// 卡子类型映射 - 与EditMemberModal中保持一致
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
  
  return subtype;
};

// 教练类型映射 - 与EditMemberModal中保持一致
const getTrainerTypeDisplay = (type: string | null): string => {
  if (!type) return '';
  if (type === 'jr') return 'JR教练';
  if (type === 'senior') return '高级教练';
  return type;
};

// 卡类型和子类型的映射关系 - 保留原有逻辑，但使用中文名称
const cardTypeToSubtypes: Record<ExtendedCardType, string[]> = {
  'monthly': ['单次月卡', '双次月卡'],
  'class': ['单次卡', '两次卡', '10次卡'],
  'private': ['单次卡', '10次卡'],
  '团课': ['单次卡', '两次卡', '10次卡', '单次月卡', '双次月卡'],
  '私教课': ['单次卡', '10次卡'],
  'no_card': [],
  'all_cards': [],
  '': []
};

// 修改后的卡子类型的显示名称
const cardSubtypeLabels: Record<string, string> = {
  '单次月卡': '团课单次月卡 Single Monthly',
  '双次月卡': '团课双次月卡 Double Monthly',
  '单次卡': '单次卡 Single Class/Private',
  '两次卡': '团课两次卡 Two Classes',
  '10次卡': '10次卡 Ten Classes/Private'
};

// 卡子类型的数据库存储值映射 - 不再需要，直接使用中文值
const cardSubtypeToDbValue: Record<string, string> = {
  'single_monthly': '单次月卡',
  'double_monthly': '双次月卡',
  'single_class': '单次卡',
  'two_classes': '两次卡',
  'ten_classes': '10次卡',
  'single_private': '单次卡',
  'ten_private': '10次卡'
};

const PAGE_SIZE = 10;

// 计算会员卡有效期状态
const getCardStatus = (validUntil: string | null) => {
  if (!validUntil) return { status: 'valid' as const, text: '无有效期限制' };
  
  const now = new Date();
  const expireDate = new Date(validUntil);
  const daysLeft = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysLeft < 0) return { status: 'expired' as const, text: '已过期' };
  if (daysLeft < 7) return { status: 'warning' as const, text: `即将过期 (${daysLeft}天)` };
  return { status: 'valid' as const, text: '有效' };
};

// 导出统一的卡信息格式化函数，供MemberTable使用
export const formatCardInfo = (card: MembershipCard): React.ReactNode => {
  // 调试输出，查看卡信息的原始值
  console.log('Card info in list:', {
    type: card.card_type,
    category: card.card_category,
    subtype: card.card_subtype,
    trainer: card.trainer_type
  });
  
  // 计算有效期状态 - 仍然保留计算逻辑，以便未来需要使用
  const cardStatus = card.valid_until ? getCardStatus(card.valid_until) : { status: 'valid', text: '无有效期限制' };
  
  return (
    <div>
      <div className="font-medium">
        {getCardTypeDisplay(card.card_type)} {getCardCategoryDisplay(card.card_category)} {getCardSubtypeDisplay(card.card_subtype)}
        {card.trainer_type && ` (${getTrainerTypeDisplay(card.trainer_type)})`}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {card.card_type === '团课' || card.card_type === 'class' ? 
          `剩余团课: ${card.remaining_group_sessions ?? '未设置'}` : 
          card.card_type === '私教课' || card.card_type === 'private' ? 
          `剩余私教: ${card.remaining_private_sessions ?? '未设置'}` :
          `剩余课时: ${card.remaining_group_sessions ?? card.remaining_private_sessions ?? '未设置'}`}
        {card.valid_until && 
          <span>
            {' | '}有效期至: {new Date(card.valid_until).toLocaleDateString('zh-CN')}
          </span>}
        {!card.valid_until && <span>{' | '}无有效期限制</span>}
      </div>
    </div>
  );
};

export default function MemberList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cardTypeFilter, setCardTypeFilter] = useState<ExtendedCardType | ''>('');
  const [cardSubtypeFilter, setCardSubtypeFilter] = useState<string>('');
  const [expiryFilter, setExpiryFilter] = useState<'active' | 'upcoming' | 'expired' | 'low_classes' | ''>('');
  const [selectedMember, setSelectedMember] = useState<MemberWithCards | null>(null);
  const [_showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const { 
    members, 
    totalCount,
    currentPage,
    totalPages,
    loading, 
    error,
    searchMembers,
    deleteMember,
    updateMember
  } = useMemberSearch(PAGE_SIZE);

  const handleSearch = (page: number = 1) => {
    // 直接使用选择的卡类型和卡子类型进行搜索
    // 数据库中存储的就是中文值
    searchMembers({
      searchTerm,
      cardType: cardTypeFilter as CardType | 'no_card' | '团课' | '私教课' | 'all_cards' | '',
      cardSubtype: cardSubtypeFilter,
      expiryStatus: expiryFilter,
      page,
      pageSize: PAGE_SIZE
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSearch(1);
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(1);
    }
  };

  const handlePageChange = (page: number) => {
    handleSearch(page);
  };

  const handleEdit = (member: MemberWithCards) => {
    setSelectedMember(member);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (memberId: string) => {
    if (!window.confirm('确定要删除该会员吗？此操作不可撤销。\nAre you sure you want to delete this member? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteMember(memberId);
      setShowDeleteConfirm(null);
      alert('会员删除成功！\nMember deleted successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败 Delete failed');
    }
  };

  const handleUpdate = async (memberId: string, updates: Partial<Member>) => {
    try {
      await updateMember(memberId, updates);
      setSelectedMember(null);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Failed to update member:', err);
      throw err;
    }
  };

  // 添加刷新会员列表的方法
  const refreshMemberList = () => {
    console.log('执行刷新会员列表...');
    // 清除搜索条件，确保获取最新数据
    setSearchTerm('');
    setCardTypeFilter('');
    setCardSubtypeFilter('');
    setExpiryFilter('');
    // 重新搜索
    handleSearch(currentPage);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  // 确保members数组中的每个成员都有membership_cards属性
  // 由于useMemberSearch返回的members已经包含membership_cards属性
  // 这里只需要进行类型断言
  const membersWithCards = members as unknown as MemberWithCards[];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">会员列表 Member List</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-[#4285F4] text-white rounded-lg hover:bg-blue-600 transition-colors gap-2"
        >
          <UserPlus className="w-5 h-5" />
          <span>添加会员 Add Member</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">搜索筛选 Search Filters</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              姓名/邮箱 Name/Email
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="搜索会员姓名或邮箱..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              卡类型 Card Type
            </label>
            <select
              value={cardTypeFilter}
              onChange={(e) => {
                const newType = e.target.value as ExtendedCardType | '';
                setCardTypeFilter(newType);
                setCardSubtypeFilter(''); // 重置子类型
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">全部 All</option>
              <option value="no_card">无会员卡 No Card</option>
              <option value="团课">团课 Group Class</option>
              <option value="私教课">私教课 Private Class</option>
              <option value="all_cards">全部卡类型 All Card Types</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              卡子类型 Card Subtype
            </label>
            <select
              value={cardSubtypeFilter}
              onChange={(e) => setCardSubtypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={cardTypeFilter === 'no_card' || !cardTypeFilter}
            >
              <option value="">全部子类型 All subtypes</option>
              {cardTypeFilter && cardTypeFilter !== 'no_card' && cardTypeToSubtypes[cardTypeFilter].map(subtype => (
                <option key={subtype} value={subtype}>
                  {cardSubtypeLabels[subtype] || subtype}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              到期状态 Expiry Status
            </label>
            <select
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value as 'active' | 'upcoming' | 'expired' | 'low_classes' | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">全部状态 All status</option>
              <option value="active">正常 Active</option>
              <option value="upcoming">即将到期 Expiring soon</option>
              <option value="expired">已过期 Expired</option>
              <option value="low_classes">课时不足 Low Classes</option>
            </select>
          </div>

          <div className="md:col-span-3 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              共 {totalCount} 条记录
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[#4285F4] text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              搜索 Search
            </button>
          </div>
        </form>
      </div>

      <MemberTable 
        members={membersWithCards} 
        onMemberUpdated={refreshMemberList}
        onEdit={handleEdit}
        onDelete={handleDelete}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* 会员编辑模态框 */}
      {isEditModalOpen && selectedMember && (
        <EditMemberModal
          member={selectedMember}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleUpdate}
          refreshMemberList={refreshMemberList}
        />
      )}

      {/* 添加会员模态框 */}
      {isAddModalOpen && (
        <AddMemberModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={() => {
            setIsAddModalOpen(false);
            refreshMemberList(); // 添加会员后也刷新列表
          }}
        />
      )}
    </div>
  );
}
