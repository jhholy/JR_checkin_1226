import React from 'react';

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
  // 根据readme中的教练列表
  const trainers = [
    { id: 'jr', name: 'JR', type: 'JR' },
    { id: 'da', name: 'Da', type: 'Senior' },
    { id: 'ming', name: 'Ming', type: 'Senior' },
    { id: 'big', name: 'Big', type: 'Senior' },
    { id: 'bas', name: 'Bas', type: 'Senior' },
    { id: 'sumay', name: 'Sumay', type: 'Senior' },
    { id: 'first', name: 'First', type: 'Senior' }
  ];

  // 根据readme中的时段设置
  const timeSlots = [
    // 早课
    { id: '7-8', label: '7:00-8:00' },
    { id: '8-9', label: '8:00-9:00' },
    { id: '10:30-11:30', label: '10:30-11:30' },
    // 下午
    { id: '14-15', label: '14:00-15:00' },
    { id: '15-16', label: '15:00-16:00' },
    { id: '16-17', label: '16:00-17:00' },
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