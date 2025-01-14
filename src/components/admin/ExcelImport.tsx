import React, { useState } from 'react';
import { Upload, Download } from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import { supabase } from '../../lib/supabase';
import { parseExcelFile } from '../../utils/excelParser';
import ImportErrors from './ImportErrors';
import LoadingSpinner from '../common/LoadingSpinner';

export default function ExcelImport() {
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<any[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setImportErrors([]);

      const parsedRows = await parseExcelFile(file);
      const errors = parsedRows.filter(row => row.errors.length > 0);
      
      if (errors.length > 0) {
        setImportErrors(errors);
        return;
      }

      // Process valid rows
      for (const row of parsedRows) {
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .upsert(row.data, { onConflict: 'email' })
          .select()
          .single();

        if (memberError) throw memberError;
      }

      alert('Import successful!');
    } catch (err) {
      console.error('Import failed:', err);
      alert('Import failed. Please check the console for details.');
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleData = () => {
    const sampleData = [
      {
        name: '王小明',
        email: 'wang.xm@example.com',
        membership: 'ten_classes',
        remaining_classes: 7,
        membership_expiry: '2024-04-30'
      },
      {
        name: 'John Smith',
        email: 'john.smith@example.com',
        membership: 'single_monthly',
        membership_expiry: '2024-04-15'
      },
      {
        name: '陈美玲',
        email: 'chen.ml@example.com',
        membership: 'two_classes',
        remaining_classes: 1,
        membership_expiry: '2024-03-20'
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.j@example.com',
        membership: 'double_monthly',
        membership_expiry: '2024-05-01'
      },
      {
        name: '李志强',
        email: 'li.zq@example.com',
        membership: 'single_class',
        remaining_classes: 1,
        membership_expiry: '2024-02-28'
      },
      {
        name: 'Maria Garcia',
        email: 'maria.g@example.com',
        membership: 'ten_classes',
        remaining_classes: 10,
        membership_expiry: '2024-06-15'
      },
      {
        name: '张伟',
        email: 'zhang.w@example.com',
        membership: 'double_monthly',
        membership_expiry: '2024-03-31'
      },
      {
        name: 'David Wilson',
        email: 'david.w@example.com',
        membership: 'two_classes',
        remaining_classes: 2,
        membership_expiry: '2024-04-10'
      },
      {
        name: '林小华',
        email: 'lin.xh@example.com',
        membership: 'single_monthly',
        membership_expiry: '2024-05-15'
      },
      {
        name: 'Emma Brown',
        email: 'emma.b@example.com',
        membership: 'ten_classes',
        remaining_classes: 4,
        membership_expiry: '2024-04-20'
      }
    ];

    const ws = utils.json_to_sheet(sampleData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Members');
    writeFile(wb, 'sample_members_data.xlsx');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-lg font-semibold mb-4">导入数据 Import Data</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            支持的格式 Supported Formats:
          </label>
          <ul className="list-disc pl-5 text-sm text-gray-600">
            <li>Names: Chinese characters, English letters, numbers, @._-</li>
            <li>Email: Standard email format</li>
            <li>Membership types: single_class, two_classes, ten_classes, single_monthly, double_monthly</li>
          </ul>
        </div>

        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-gray-500" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">点击上传</span> 或拖拽文件
              </p>
              <p className="text-xs text-gray-500">Excel文件 (.xlsx, .xls)</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={importing}
            />
          </label>
        </div>

        <div className="flex justify-center">
          <button
            onClick={downloadSampleData}
            className="flex items-center gap-2 text-muaythai-blue hover:text-blue-700 text-sm"
          >
            <Download className="w-4 h-4" />
            下载示例文件 Download Sample File
          </button>
        </div>

        {importing && <LoadingSpinner />}
        
        {importErrors.length > 0 && (
          <ImportErrors
            errors={importErrors}
            onClose={() => setImportErrors([])}
          />
        )}
      </div>
    </div>
  );
}