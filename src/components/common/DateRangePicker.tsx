import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export default function DateRangePicker({ value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePresetClick = (preset: 'all' | '7days' | '30days' | '90days') => {
    const today = new Date();
    let startDate = '';
    let endDate = today.toISOString().split('T')[0];

    switch (preset) {
      case 'all':
        startDate = '2020-01-01'; // Or any early date that covers all records
        break;
      case '7days':
        startDate = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
        break;
      case '30days':
        startDate = new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0];
        break;
      case '90days':
        startDate = new Date(today.setDate(today.getDate() - 90)).toISOString().split('T')[0];
        break;
    }

    onChange({ startDate, endDate });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        日期范围 Date Range
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-left"
      >
        <span className="text-gray-700">
          {value.startDate && value.endDate
            ? `${value.startDate} - ${value.endDate}`
            : '选择日期范围 Select date range'}
        </span>
        <Calendar className="w-5 h-5 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200">
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  开始日期 Start
                </label>
                <input
                  type="date"
                  value={value.startDate}
                  onChange={(e) => onChange({ ...value, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  结束日期 End
                </label>
                <input
                  type="date"
                  value={value.endDate}
                  onChange={(e) => onChange({ ...value, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">
                快速选择 Quick select
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handlePresetClick('all')}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  全部日期 All dates
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetClick('7days')}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  最近7天 Last 7 days
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetClick('30days')}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  最近30天 Last 30 days
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetClick('90days')}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  最近90天 Last 90 days
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}