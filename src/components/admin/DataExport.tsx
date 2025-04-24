import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Member, CheckIn, MembershipCard } from '../../types/database';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

type MemberRecord = {
  [key: string]: string;
  姓名: string;
  邮箱: string;
  会员卡类型: string;
  剩余团课课时: string;
  剩余私教课时: string;
  会员卡到期日: string;
  注册时间: string;
  最后签到时间: string;
};

type CheckInRecord = {
  [key: string]: string;
  会员姓名: string;
  会员邮箱: string;
  课程类型: string;
  课程性质: string;
  签到类型: string;
  教练: string;
  签到时间: string;
};

export default function DataExport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCardTypeText = (card: MembershipCard) => {
    switch (card.card_subtype) {
      case 'single_class':
        return '团课单次卡 Single Class';
      case 'two_classes':
        return '团课两次卡 Two Classes';
      case 'ten_classes':
        return '团课十次卡 Ten Classes';
      case 'single_monthly':
        return '团课单次月卡 Single Monthly';
      case 'double_monthly':
        return '团课双次月卡 Double Monthly';
      case 'single_private':
        return '单次私教卡 Single Private';
      case 'ten_private':
        return '十次私教卡 Ten Private';
      default:
        return card.card_subtype;
    }
  }

  const formatDateSafe = (date: string | null): string => {
    if (!date) return '';
    try {
      return format(new Date(date), 'yyyy-MM-dd');
    } catch {
      return '';
    }
  };

  const formatDateTimeSafe = (date: string | null): string => {
    if (!date) return '';
    try {
      return format(new Date(date), 'yyyy-MM-dd HH:mm:ss');
    } catch {
      return '';
    }
  };

  const exportMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取所有会员数据
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select(`
          *,
          membership_cards (
            card_type,
            card_category,
            card_subtype,
            remaining_group_sessions,
            remaining_private_sessions,
            valid_until
          )
        `);

      if (membersError) throw membersError;

      // 检查是否有数据
      if (!members || members.length === 0) {
        setError('没有可导出的会员数据 No member data to export');
        return;
      }

      // 转换为CSV格式
      const records: MemberRecord[] = members.map((member: Member & { membership_cards: MembershipCard[] }) => ({
        '姓名': member.name,
        '邮箱': member.email || '',
        '会员卡类型': member.membership_cards.map(card => getCardTypeText(card)).join(', '),
        '剩余团课课时': member.membership_cards
          .filter(card => card.card_category === 'group')
          .map(card => card.remaining_group_sessions?.toString() || '0')
          .join(', '),
        '剩余私教课时': member.membership_cards
          .filter(card => card.card_category === 'private')
          .map(card => card.remaining_private_sessions?.toString() || '0')
          .join(', '),
        '会员卡到期日': member.membership_cards
          .filter(card => card.valid_until)
          .map(card => formatDateSafe(card.valid_until))
          .join(', '),
        '注册时间': formatDateSafe(member.created_at),
        '最后签到时间': formatDateSafe(member.last_check_in_date)
      }));

      // 生成CSV文件
      const headers = Object.keys(records[0]);
      const csv = [
        headers.join(','),
        ...records.map(row => headers.map(header => `"${row[header]}"`).join(','))
      ].join('\n');

      // 下载文件
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `members_${format(new Date(), 'yyyyMMdd')}.csv`;
      link.click();

    } catch (err) {
      console.error('Failed to export members:', err);
      setError('导出失败，请重试 Export failed, please try again');
    } finally {
      setLoading(false);
    }
  };

  const exportCheckIns = async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取所有签到记录
      const { data: checkIns, error: checkInsError } = await supabase
        .from('check_ins')
        .select(`
          *,
          members (
            name,
            email
          ),
          trainer:trainers (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (checkInsError) throw checkInsError;

      // 检查是否有数据
      if (!checkIns || checkIns.length === 0) {
        setError('没有可导出的签到记录 No check-in records to export');
        return;
      }

      // 转换为CSV格式
      const records: CheckInRecord[] = checkIns.map((record: CheckIn & { 
        members: Member;
        trainer: { name: string } | null;
      }) => ({
        '会员姓名': record.members?.name || '',
        '会员邮箱': record.members?.email || '',
        '课程类型': record.class_type === 'morning' ? '早课' : '晚课',
        '课程性质': record.is_private ? '私教课' : '团课',
        '签到类型': record.is_extra ? '额外签到' : '正常签到',
        '教练': record.trainer?.name || '',
        '签到时间': formatDateTimeSafe(record.created_at)
      }));

      // 生成CSV文件
      const headers = Object.keys(records[0]);
      const csv = [
        headers.join(','),
        ...records.map(row => headers.map(header => `"${row[header]}"`).join(','))
      ].join('\n');

      // 下载文件
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `check_ins_${format(new Date(), 'yyyyMMdd')}.csv`;
      link.click();

    } catch (err) {
      console.error('Failed to export check-ins:', err);
      setError('导出失败，请重试 Export failed, please try again');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-4">数据导出 Data Export</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              会员数据 Member Data
            </h4>
            <button
              onClick={exportMembers}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#4285F4] hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="w-4 h-4 mr-2" />
              导出会员数据 Export Members
            </button>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              签到记录 Check-in Records
            </h4>
            <button
              onClick={exportCheckIns}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#4285F4] hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="w-4 h-4 mr-2" />
              导出签到记录 Export Check-ins
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}