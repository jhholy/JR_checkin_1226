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
    // Define headers
    const headers = [
      '姓名 Name',
      '邮箱 Email',
      '会员卡类型 Membership Type',
      '剩余课时 Remaining Classes',
      '到期日期 Expiry Date'
    ].join(',');

    // Sample data
    const sampleData = [
      {
        '姓名 Name': '王小明',
        '邮箱 Email': 'wang.xm@example.com',
        '会员卡类型 Membership Type': '十次卡',
        '剩余课时 Remaining Classes': '7',
        '到期日期 Expiry Date': ''
      },
      {
        '姓名 Name': 'John Smith',
        '邮箱 Email': 'john.smith@example.com',
        '会员卡类型 Membership Type': '单次月卡',
        '剩余课时 Remaining Classes': '',
        '到期日期 Expiry Date': '2024-04-15'
      },
      {
        '姓名 Name': '陈美玲',
        '邮箱 Email': 'chen.ml@example.com',
        '会员卡类型 Membership Type': '两次卡',
        '剩余课时 Remaining Classes': '1',
        '到期日期 Expiry Date': ''
      }
    ];

    // Convert to CSV
    const rows = sampleData.map(row => 
      Object.values(row)
        .map(value => `"${value}"`) // Wrap values in quotes to handle commas
        .join(',')
    );
    
    // Add UTF-8 BOM for Excel compatibility
    const csv = '\ufeff' + [headers, ...rows].join('\n');

    // Create and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'member_data_template.csv';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-lg font-semibold mb-4">导入数据 Import Data</h2>
      
      <div className="space-y-4">
        <div className="bg-blue-50 border-l-4 border-[#4285F4] p-4 mb-4 rounded-r-lg">
          <p className="text-sm text-blue-700">
            导入数据要求：姓名支持中英文字符、数字、@._-，邮箱需标准格式，会员卡类型包含单次卡、两次卡、十次卡、单次月卡、双次月卡
            <br />
            Import requirements: Name supports Chinese/English characters, numbers, @._-, standard email format, membership types include single class, two classes, ten classes, single monthly, double monthly
          </p>
        </div>

        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-gray-500" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">点击上传</span> 或拖拽文件
              </p>
              <p className="text-xs text-gray-500">CSV文件 (.csv)</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".csv"
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