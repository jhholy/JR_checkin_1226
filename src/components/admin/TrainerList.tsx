import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

type Trainer = {
  id: string;
  name: string;
  type: 'jr' | 'senior';
  notes: string | null;
};

type TrainerStats = {
  totalClasses: number;
  privateClasses: number;
  groupClasses: number;
};

export default function TrainerList() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, TrainerStats>>({});

  useEffect(() => {
    fetchTrainers();
    fetchTrainerStats();
  }, []);

  const fetchTrainers = async () => {
    try {
      const { data, error } = await supabase
        .from('trainers')
        .select('*')
        .order('name');

      if (error) throw error;
      setTrainers(data || []);
    } catch (err) {
      console.error('Error fetching trainers:', err);
      setError('获取教练列表失败 Failed to fetch trainers');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainerStats = async () => {
    try {
      // 获取今日日期
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // 获取本月第一天
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const { data: checkIns, error } = await supabase
        .from('check_ins')
        .select('trainer_id, is_private')
        .gte('created_at', firstDayOfMonth.toISOString());

      if (error) throw error;

      // 统计每个教练的课程数据
      const trainerStats: Record<string, TrainerStats> = {};
      checkIns?.forEach(checkIn => {
        if (!checkIn.trainer_id) return;

        if (!trainerStats[checkIn.trainer_id]) {
          trainerStats[checkIn.trainer_id] = {
            totalClasses: 0,
            privateClasses: 0,
            groupClasses: 0
          };
        }

        trainerStats[checkIn.trainer_id].totalClasses++;
        if (checkIn.is_private) {
          trainerStats[checkIn.trainer_id].privateClasses++;
        } else {
          trainerStats[checkIn.trainer_id].groupClasses++;
        }
      });

      setStats(trainerStats);
    } catch (err) {
      console.error('Error fetching trainer stats:', err);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-4">教练管理 Trainer Management</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  教练姓名 Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  等级 Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  本月总课时 Total Classes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  私教课时 Private Classes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  团课课时 Group Classes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  备注 Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trainers.map(trainer => {
                const trainerStats = stats[trainer.id] || {
                  totalClasses: 0,
                  privateClasses: 0,
                  groupClasses: 0
                };

                return (
                  <tr key={trainer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {trainer.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        trainer.type === 'senior'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {trainer.type === 'senior' ? '高级教练' : 'JR教练'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {trainerStats.totalClasses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {trainerStats.privateClasses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {trainerStats.groupClasses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {trainer.notes || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 