import { useState } from 'react';
import DateRangePicker from '../common/DateRangePicker';
import Button from '../common/Button';
import { supabase } from '../../lib/supabase';
import * as XLSX from 'xlsx';
import { format, startOfDay, endOfDay } from 'date-fns';
import { Info } from 'lucide-react';
import { retryWithBackoff } from '../../utils/fetchUtils';

export default function DataExport() {
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data: records, error } = await supabase
        .from('checkins')
        .select(`
          *,
          members (
            name
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      const exportData = records.map(record => ({
        '会员姓名': record.members?.name || '未知会员',
        '课程类型': record.class_type === 'morning' ? '早课' : '晚课',
        '签到时间': format(new Date(record.created_at), 'yyyy-MM-dd HH:mm:ss'),
        '额外签到': record.is_extra ? '是' : '否'
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      const wscols = [
        {wch: 15},
        {wch: 10},
        {wch: 20},
        {wch: 10}
      ];
      ws['!cols'] = wscols;

      XLSX.utils.book_append_sheet(wb, ws, '签到记录');

      const fileName = `签到记录_${format(startDate, 'yyyyMMdd')}_${format(endDate, 'yyyyMMdd')}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Export error:', error);
      alert('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
  };

  return (
    <div className="space-y-4">
      <div className="p-5 bg-white rounded-lg shadow">
        <div className="mb-4">
          <h2 className="text-xl font-bold">导出签到记录</h2>
        </div>

        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="flex items-center text-lg font-semibold text-blue-800 mb-2">
            <Info className="w-5 h-5 mr-2" />
            导出说明
          </h3>
          
          <p className="text-sm text-blue-600 leading-relaxed">
            导出Excel文件（.xlsx）包含：会员姓名、课程类型（早课/晚课）、签到时间、额外签到情况。文件包含表头，建议每次导出时间范围不超过3个月，以确保最佳导出体验。
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex-grow">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              选择日期范围
            </h3>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={handleStartDateChange}
              onEndDateChange={handleEndDateChange}
            />
          </div>
          
          <Button
            variant="blue"
            onClick={handleExport}
            loading={exporting}
            disabled={!startDate || !endDate}
            className="min-w-[120px]"
          >
            {exporting ? '导出中...' : '导出'}
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-medium text-yellow-800 mb-1">注意事项：</h4>
        <ul className="list-disc pl-5 text-sm text-yellow-700">
          <li>导出过程中请勿关闭页面</li>
          <li>如导出失败请检查网络后重试</li>
        </ul>
      </div>
    </div>
  );
}