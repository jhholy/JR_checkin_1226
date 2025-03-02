import React, { useState, FormEvent } from 'react';
import type { Database } from '../../types/database';
import MemberTable from './MemberTable';
import EditMemberModal from './EditMemberModal';
import { useMemberSearch } from '../../hooks/useMemberSearch';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { supabase } from '../../lib/supabase';
import { Trash2, UserPlus } from 'lucide-react';
import AddMemberModal from './AddMemberModal';

type Member = Database['public']['Tables']['members']['Row'];
type CardType = Database['public']['Enums']['CardType'];
type ExtendedCardType = CardType | 'no_card';
type CardCategory = Database['public']['Enums']['CardCategory'];
type CardSubtype = Database['public']['Enums']['CardSubtype'];

// 卡类型和子类型的映射关系
const cardTypeToSubtypes: Record<ExtendedCardType, CardSubtype[]> = {
  'monthly': ['single_monthly', 'double_monthly'],
  'class': ['single_class', 'two_classes', 'ten_classes'],
  'private': ['single_private', 'ten_private'],
  'no_card': []
};

// 卡子类型的显示名称
const cardSubtypeLabels: Record<CardSubtype, string> = {
  'single_monthly': '团课单次月卡 Single Monthly',
  'double_monthly': '团课双次月卡 Double Monthly',
  'single_class': '团课单次卡 Single Class',
  'two_classes': '团课两次卡 Two Classes',
  'ten_classes': '团课十次卡 Ten Classes',
  'single_private': '私教单次卡 Single Private',
  'ten_private': '私教十次卡 Ten Private'
};

const PAGE_SIZE = 10;

export default function MemberList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cardTypeFilter, setCardTypeFilter] = useState<ExtendedCardType | ''>('');
  const [cardSubtypeFilter, setCardSubtypeFilter] = useState<CardSubtype | ''>('');
  const [expiryFilter, setExpiryFilter] = useState<'active' | 'upcoming' | 'expired' | ''>('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
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
    searchMembers({
      searchTerm,
      cardType: cardTypeFilter,
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

  const handleEdit = (member: Member) => {
    setSelectedMember(member);
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
    } catch (err) {
      console.error('Failed to update member:', err);
      throw err;
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

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
              姓名/微信名 Name/WeChat
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="搜索会员..."
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
              <option value="class">团课次卡 Class</option>
              <option value="monthly">团课月卡 Monthly</option>
              <option value="private">私教卡 Private</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              卡子类型 Card Subtype
            </label>
            <select
              value={cardSubtypeFilter}
              onChange={(e) => setCardSubtypeFilter(e.target.value as CardSubtype | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={cardTypeFilter === 'no_card' || !cardTypeFilter}
            >
              <option value="">全部子类型 All subtypes</option>
              {cardTypeFilter && cardTypeFilter !== 'no_card' && cardTypeToSubtypes[cardTypeFilter].map(subtype => (
                <option key={subtype} value={subtype}>
                  {cardSubtypeLabels[subtype]}
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
              onChange={(e) => setExpiryFilter(e.target.value as 'active' | 'upcoming' | 'expired' | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">全部状态 All status</option>
              <option value="active">正常 Active</option>
              <option value="upcoming">即将到期 Expiring soon</option>
              <option value="expired">已过期 Expired</option>
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
        members={members} 
        onEdit={handleEdit}
        onDelete={handleDelete}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {selectedMember && (
        <EditMemberModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onUpdate={handleUpdate}
        />
      )}

      {isAddModalOpen && (
        <AddMemberModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
}