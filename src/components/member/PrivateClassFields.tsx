import React from 'react';
import { TrainerType } from '../../types/database';

interface Props {
  trainerId: string;
  timeSlot: string;
  is1v2: boolean;
  loading: boolean;
  onChange: (field: string, value: string | boolean) => void;
}

export default function PrivateClassFields({
  trainerId,
  timeSlot,
  is1v2,
  loading,
  onChange
}: Props) {
  // 教练列表
  const trainers = [
    { id: '71f17e43-8463-4e8c-a2fe-d3ab9b0198ef', name: 'Big', type: 'senior' as TrainerType },
    { id: '7a029490-917d-47d7-b222-b81f634d46ec', name: 'JR', type: 'jr' as TrainerType },
    { id: '5e9a09da-01ed-4792-b661-d44562aa3393', name: 'Da', type: 'senior' as TrainerType },
    { id: 'cfa14eba-75d8-4e46-a764-c486ccdaa187', name: 'Ming', type: 'senior' as TrainerType },
    { id: '08b82c89-770c-4392-bd17-75a62fcc9eb1', name: 'Bas', type: 'senior' as TrainerType },
    { id: 'a4fec13a-5ae2-48ac-a675-815940fbbf5f', name: 'Sumay', type: 'senior' as TrainerType },
    { id: '48dec2e7-1c37-4a90-b9d6-b252e1b91a14', name: 'First', type: 'senior' as TrainerType }
  ];

  // 私教课时间段
  const timeSlots = [
    // 早课
    { id: '07:00-08:00', label: '07:00-08:00' },
    { id: '08:00-09:00', label: '08:00-09:00' },
    { id: '10:30-11:30', label: '10:30-11:30' },
    // 下午
    { id: '14:00-15:00', label: '14:00-15:00' },
    { id: '15:00-16:00', label: '15:00-16:00' },
    { id: '16:00-17:00', label: '16:00-17:00' },
    // 晚课
    { id: '18:30-19:30', label: '18:30-19:30' }
  ];

  return (
    <div className="space-y-4">
      {/* 教练选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          教练 Trainer
        </label>
        <select
          value={trainerId}
          onChange={(e) => onChange('trainerId', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
          disabled={loading}
        >
          <option value="">请选择教练 Select trainer</option>
          {trainers.map(trainer => (
            <option key={trainer.id} value={trainer.id}>
              {trainer.name} ({trainer.type})
            </option>
          ))}
        </select>
      </div>

      {/* 时段选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          时段 Time Slot
        </label>
        <select
          value={timeSlot}
          onChange={(e) => onChange('timeSlot', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
          disabled={loading}
        >
          <option value="">请选择时段 Select time slot</option>
          {timeSlots.map(slot => (
            <option key={slot.id} value={slot.id}>
              {slot.label}
            </option>
          ))}
        </select>
      </div>

      {/* 1对1/1对2选择 */}
      <div>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={is1v2}
            onChange={(e) => onChange('is1v2', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            disabled={loading}
          />
          <span className="text-sm text-gray-700">
            1对2课程 1-on-2 Class
          </span>
        </label>
        <p className="mt-1 text-sm text-gray-500">
          1对2课程需要线下额外收费
          <br />
          Additional fee required for 1-on-2 class
        </p>
      </div>
    </div>
  );
} 