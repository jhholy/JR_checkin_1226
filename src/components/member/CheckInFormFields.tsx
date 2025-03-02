import React from 'react';

interface Props {
  name: string;
  email: string;
  timeSlot: string;
  loading: boolean;
  isNewMember?: boolean;
  showTimeSlot?: boolean;
  onChange: (field: string, value: string) => void;
}

export default function CheckInFormFields({ 
  name, 
  email,
  timeSlot, 
  loading, 
  isNewMember,
  showTimeSlot = true,
  onChange 
}: Props) {
  // 团课固定时间段
  const groupTimeSlots = [
    { id: '09:00-10:30', label: '早课 Morning (09:00-10:30)' },
    { id: '17:00-18:30', label: '晚课 Evening (17:00-18:30)' }
  ];

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          姓名 Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder={isNewMember ? "请输入姓名 Enter your name" : "请输入会员姓名 Enter member name"}
          required
          disabled={loading}
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          邮箱 Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => onChange('email', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="请输入邮箱 Enter email"
          required
          disabled={loading}
        />
      </div>

      {showTimeSlot && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            时间段 Time Slot
          </label>
          <select
            value={timeSlot}
            onChange={(e) => onChange('timeSlot', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={loading}
            required
          >
            <option value="">请选择时间段 Select time slot</option>
            {groupTimeSlots.map(slot => (
              <option key={slot.id} value={slot.id}>
                {slot.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}