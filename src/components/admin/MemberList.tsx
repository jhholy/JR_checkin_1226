import React, { useState, FormEvent } from 'react';
import type { Database } from '../../types/database';
import MemberTable from './MemberTable';
import EditMemberModal from './EditMemberModal';
import { useMemberSearch } from '../../hooks/useMemberSearch';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { supabase } from '../../lib/supabase';
import { Trash2 } from 'lucide-react';

type Member = Database['public']['Tables']['members']['Row'];
type CardType = Database['public']['Enums']['CardType'];
type CardCategory = Database['public']['Enums']['CardCategory'];
type CardSubtype = Database['public']['Enums']['CardSubtype'];

const PAGE_SIZE = 10;

export default function MemberList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cardTypeFilter, setCardTypeFilter] = useState<CardType | ''>('');
  const [cardSubtypeFilter, setCardSubtypeFilter] = useState<CardSubtype | ''>('');
  const [expiryFilter, setExpiryFilter] = useState<'upcoming' | 'expired' | ''>('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
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
    <div className="space-y-4">
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
              onChange={(e) => setCardTypeFilter(e.target.value as CardType | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">全部 All</option>
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
            >
              <option value="">全部 All</option>
              <option value="single_class">团课单次卡 Single Class</option>
              <option value="two_classes">团课两次卡 Two Classes</option>
              <option value="ten_classes">团课十次卡 Ten Classes</option>
              <option value="single_monthly">团课单次月卡 Single Monthly</option>
              <option value="double_monthly">团课双次月卡 Double Monthly</option>
              <option value="single_private">单次私教卡 Single Private</option>
              <option value="ten_private">十次私教卡 Ten Private</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              到期状态 Expiry Status
            </label>
            <select
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value as 'upcoming' | 'expired' | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">全部 All</option>
              <option value="upcoming">即将到期 Expiring Soon</option>
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
    </div>
  );
}