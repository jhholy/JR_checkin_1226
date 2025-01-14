import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDateForDB } from '../../utils/dateUtils';
import DateRangePicker from '../common/DateRangePicker';
import ErrorMessage from '../common/ErrorMessage';

export default function DataExport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const exportData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!dateRange.startDate || !dateRange.endDate) {
        throw new Error('请选择导出日期范围。Please select a date range.');
      }

      // Fetch check-in records with member details using inner join
      const { data, error: fetchError } = await supabase
        .from('check_ins')
        .select(`
          created_at,
          class_type,
          is_extra,
          members!inner (
            name,
            email,
            membership,
            remaining_classes,
            membership_expiry
          )
        `)
        .gte('check_in_date', dateRange.startDate)
        .lte('check_in_date', dateRange.endDate)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      if (!data?.length) {
        throw new Error('所选日期范围内没有签到记录。No check-in records found in the selected date range.');
      }

      // Format data for CSV
      const csvData = data.map(record => ({
        '签到日期': new Date(record.created_at).toLocaleDateString('zh-CN'),
        '签到时间': new Date(record.created_at).toLocaleTimeString('zh-CN'),
        '课程类型': record.class_type === 'morning' ? '早课' : '晚课',
        '会员姓名': record.members?.name || '',
        '会员邮箱': record.members?.email || '',
        '会员卡类型': record.members?.membership || '',
        '剩余课时': record.members?.remaining_classes || '',
        '会员卡到期日': record.members?.membership_expiry ? 
          new Date(record.members.membership_expiry).toLocaleDateString('zh-CN') : '',
        '签到状态': record.is_extra ? '额外签到' : '正常签到'
      }));

      // Convert to CSV with UTF-8 BOM for Excel compatibility
      const headers = Object.keys(csvData[0]).join(',');
      const rows = csvData.map(row => 
        Object.values(row)
          .map(value => `"${value}"`) // Wrap values in quotes to handle commas
          .join(',')
      );
      const csv = '\ufeff' + [headers, ...rows].join('\n');

      // Create download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Format filename with date range
      const filename = `签到记录_${dateRange.startDate}_${dateRange.endDate}.csv`;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Export failed:', err);
      setError(err instanceof Error ? err.message : '导出失败，请重试。Export failed, please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-medium mb-4">导出数据 Export Data</h2>
      
      <div className="space-y-4">
        <div className="bg-blue-50 border-l-4 border-[#4285F4] p-4 mb-4 rounded-r-lg">
          <p className="text-sm text-blue-700">
            导出数据包含：签到日期、时间、课程类型、会员姓名、邮箱、会员卡信息及签到状态
            <br />
            Exports include: check-in date, time, class type, member name, email, membership info and check-in status
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            日期范围 Date Range
          </label>
          <DateRangePicker
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onStartDateChange={(date) => setDateRange(prev => ({ ...prev, startDate: date || '' }))}
            onEndDateChange={(date) => setDateRange(prev => ({ ...prev, endDate: date || '' }))}
          />
        </div>

        {error && <ErrorMessage message={error} />}

        <button
          onClick={exportData}
          disabled={loading || !dateRange.startDate || !dateRange.endDate}
          className="inline-flex items-center px-4 py-2 bg-[#4285F4] text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed gap-2"
        >
          <Download className="w-4 h-4" />
          {loading ? '导出中... Exporting...' : '导出CSV Export CSV'}
        </button>
      </div>
    </div>
  );
}