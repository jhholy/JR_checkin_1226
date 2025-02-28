import React, { useState } from 'react';
import { Upload, Download } from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import { supabase } from '../../lib/supabase';
import { parseExcelFile } from '../../utils/excelParser';
import ImportErrors from './ImportErrors';
import LoadingSpinner from '../common/LoadingSpinner';
import { Member, CardType, CardSubtype, TrainerType } from '../../types/database';

interface ImportRow {
  data: {
    member: Partial<Member>;
    card: {
      card_type: CardType;
      card_subtype: CardSubtype;
      remaining_group_sessions?: number;
      remaining_private_sessions?: number;
      valid_until?: string;
      trainer_type?: TrainerType;
    };
  };
  errors: string[];
  rowNumber: number;
}

export default function ExcelImport() {
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportRow[]>([]);

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

      // 处理有效数据
      for (const row of parsedRows) {
        // 1. 创建或更新会员信息
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .upsert(row.data.member, { onConflict: 'email' })
          .select()
          .single();

        if (memberError) throw memberError;

        // 2. 创建会员卡
        if (memberData) {
          const { error: cardError } = await supabase
            .from('membership_cards')
            .insert({
              ...row.data.card,
              member_id: memberData.id,
              created_at: new Date().toISOString()
            });

          if (cardError) throw cardError;
        }
      }

      alert('导入成功！Import successful!');
    } catch (err) {
      console.error('Import failed:', err);
      alert('导入失败，请检查控制台了解详情。Import failed. Please check the console for details.');
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleData = () => {
    // 定义表头
    const headers = [
      '姓名 Name',
      '邮箱 Email',
      '电话 Phone',
      '卡类型 Card Type',
      '卡子类型 Card Subtype',
      '剩余团课课时 Remaining Group Sessions',
      '剩余私教课时 Remaining Private Sessions',
      '到期日期 Valid Until',
      '教练等级 Trainer Type'
    ].join(',');

    // 示例数据
    const sampleData = [
      {
        '姓名 Name': '王小明',
        '邮箱 Email': 'wang.xm@example.com',
        '电话 Phone': '13800138000',
        '卡类型 Card Type': 'class',
        '卡子类型 Card Subtype': 'group',
        '剩余团课课时 Remaining Group Sessions': '10',
        '剩余私教课时 Remaining Private Sessions': '',
        '到期日期 Valid Until': '2024-06-30',
        '教练等级 Trainer Type': ''
      },
      {
        '姓名 Name': 'John Smith',
        '邮箱 Email': 'john.smith@example.com',
        '电话 Phone': '13900139000',
        '卡类型 Card Type': 'time',
        '卡子类型 Card Subtype': 'monthly',
        '剩余团课课时 Remaining Group Sessions': '',
        '剩余私教课时 Remaining Private Sessions': '',
        '到期日期 Valid Until': '2024-04-15',
        '教练等级 Trainer Type': ''
      },
      {
        '姓名 Name': '陈美玲',
        '邮箱 Email': 'chen.ml@example.com',
        '电话 Phone': '13700137000',
        '卡类型 Card Type': 'private',
        '卡子类型 Card Subtype': 'single_private',
        '剩余团课课时 Remaining Group Sessions': '',
        '剩余私教课时 Remaining Private Sessions': '5',
        '到期日期 Valid Until': '2024-06-30',
        '教练等级 Trainer Type': 'senior'
      }
    ];

    // 转换为CSV
    const rows = sampleData.map(row => 
      Object.values(row)
        .map(value => `"${value}"`) // 用引号包裹值以处理逗号
        .join(',')
    );
    
    // 添加UTF-8 BOM以兼容Excel
    const csv = '\ufeff' + [headers, ...rows].join('\n');

    // 创建并触发下载
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
            导入数据要求：
            <br />• 姓名支持中英文字符、数字、@._-
            <br />• 邮箱需标准格式
            <br />• 卡类型：class(课程卡)、time(时间卡)、private(私教卡)
            <br />• 课程卡子类型：group(团体课)、private(私教课)
            <br />• 时间卡子类型：monthly(月卡)、quarterly(季卡)、yearly(年卡)
            <br />• 私教卡子类型：single_private(单次)、ten_private(10次)
            <br />• 教练等级：jr(JR教练)、senior(高级教练)
            <br /><br />
            Import requirements:
            <br />• Name supports Chinese/English characters, numbers, @._-
            <br />• Standard email format required
            <br />• Card types: class, time, private
            <br />• Class card subtypes: group, private
            <br />• Time card subtypes: monthly, quarterly, yearly
            <br />• Private card subtypes: single_private, ten_private
            <br />• Trainer types: jr, senior
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