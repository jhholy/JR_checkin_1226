import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useMemberAuth } from '../../contexts/MemberAuthContext';
import { ClipboardCheck, AlertCircle, Clock, User } from 'lucide-react';

interface CheckInRecord {
  id: string;                              // UUID 主键
  member_id: string;                       // 会员ID
  check_in_date: string;                   // 签到日期
  created_at?: string;                     // 创建时间
  is_extra: boolean;                       // 是否额外课时
  trainer_id?: string;                     // 教练ID
  is_1v2: boolean;                         // 是否1对2课程
  class_time: string;                      // 上课时间
  card_id?: string;                        // 会员卡ID
  is_private: boolean;                     // 是否私教课
  time_slot: string;                       // 时间段
  class_type?: string;                     // 课程类型
  trainer?: {                              // 关联的教练信息
    name: string;
    type: string;
  };
}

const MemberRecords: React.FC = () => {
  const { member } = useMemberAuth();
  const [records, setRecords] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!member?.id) return;

    async function fetchRecords() {
      try {
        if (!member) return;
        
        const { data, error } = await supabase
          .from('check_ins')
          .select(`
            *,
            trainer:trainers!trainer_id(name, type)
          `)
          .eq('member_id', member.id)
          .order('check_in_date', { ascending: false })
          .limit(20);

        if (error) throw error;
        setRecords(data || []);
      } catch (err) {
        console.error('Error fetching records:', err);
        setError('获取签到记录失败');
      } finally {
        setLoading(false);
      }
    }

    fetchRecords();

    const subscription = supabase
      .channel('check_ins_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'check_ins',
          filter: `member_id=eq.${member?.id}`
        },
        fetchRecords
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [member?.id]);

  if (loading) {
    return <div className="p-4">加载中... Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  if (records.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <h2 className="text-2xl font-bold mb-6">签到记录 Check-in Records</h2>
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>暂无签到记录</p>
          <p>No check-in records found</p>
        </div>
      </div>
    );
  }

  const getClassTypeTranslation = (isPrivate: boolean) => {
    return isPrivate ? '私教课 Private Class' : '团课 Group Class';
  };

  const getExtraCheckInText = () => {
    return '额外课时 Extra Check-in';
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">签到记录 Check-in Records</h2>
      
      <div className="space-y-4">
        {records.map(record => (
          <div key={record.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <ClipboardCheck className="w-6 h-6 text-[#1559CF]" />
                <div>
                  <span className="font-medium">
                    {getClassTypeTranslation(record.is_private)}
                  </span>
                  {record.class_type && record.class_type !== 'private' && (
                    <span className="ml-2 text-gray-500">({record.class_type})</span>
                  )}
                  {record.is_extra && (
                    <span className="ml-2 text-orange-500">({getExtraCheckInText()})</span>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {new Date(record.check_in_date).toLocaleDateString()}
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>上课时段 Time Slot: {record.time_slot}</span>
              </div>

              {record.trainer && (
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>
                    教练 Trainer: {record.trainer.name} ({record.trainer.type})
                    {record.is_1v2 && ' - 1对2课程 1-on-2 Class'}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemberRecords; 