import React from 'react';

interface DateRangePickerProps {
  startDate: Date | string | null;
  endDate: Date | string | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange
}: DateRangePickerProps) {
  const formatDateValue = (date: Date | string | null) => {
    if (!date) return '';
    if (typeof date === 'string') return date;
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="flex gap-4 items-center">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          开始日期 Start Date
        </label>
        <input
          type="date"
          value={formatDateValue(startDate)}
          onChange={(e) => {
            const date = new Date(e.target.value);
            if (!isNaN(date.getTime())) {
              onStartDateChange(date);
            }
          }}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-muaythai-blue focus:border-muaythai-blue"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          结束日期 End Date
        </label>
        <input
          type="date"
          value={formatDateValue(endDate)}
          onChange={(e) => {
            const date = new Date(e.target.value);
            if (!isNaN(date.getTime())) {
              onEndDateChange(date);
            }
          }}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-muaythai-blue focus:border-muaythai-blue"
        />
      </div>
    </div>
  );
}