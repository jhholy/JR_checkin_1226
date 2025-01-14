import { read, utils } from 'xlsx';
import { ParsedRow, ExcelRow } from './types';
import { validateRow } from './validator';
import { formatDateForDB } from '../dateUtils';

// Define membership type mapping (Chinese to English)
export const MEMBERSHIP_TYPE_MAPPING = {
  '单次卡': 'single_class',
  '两次卡': 'two_classes',
  '十次卡': 'ten_classes',
  '单次月卡': 'single_monthly',
  '双次月卡': 'double_monthly'
} as const;

// Define header mapping (Chinese to English)
const HEADER_MAPPING = {
  '姓名': 'name',
  '邮箱': 'email',
  '会员卡类型': 'membership',
  '剩余课时': 'remaining_classes',
  '到期日期': 'membership_expiry',
  '签到日期': 'check_in_date',
  '课程类型': 'class_type',
  '额外签到': 'is_extra',
  '注册日期': 'registration_date',
  '状态': 'status',
  '备注': 'notes'
};

const EXCEL_HEADERS = Object.values(HEADER_MAPPING);

export const parseExcelFile = async (file: File): Promise<ParsedRow[]> => {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { 
    type: 'array',
    cellDates: true,
    cellNF: false,
    cellText: false
  });
  
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  
  // Get the raw data first
  const rawRows = utils.sheet_to_json<Record<string, any>>(sheet, {
    raw: true,
    defval: null
  });

  // Map Chinese headers and values to English
  const rows = rawRows.map(row => {
    const mappedRow: Record<string, any> = {};
    Object.entries(row).forEach(([key, value]) => {
      const englishKey = HEADER_MAPPING[key as keyof typeof HEADER_MAPPING];
      if (englishKey) {
        // Convert membership type from Chinese to English if needed
        if (englishKey === 'membership' && typeof value === 'string') {
          mappedRow[englishKey] = MEMBERSHIP_TYPE_MAPPING[value as keyof typeof MEMBERSHIP_TYPE_MAPPING] || value;
        } else {
          mappedRow[englishKey] = value;
        }
      }
    });
    return mappedRow as ExcelRow;
  });
  
  // Filter out empty rows and validate
  return rows
    .filter(row => row.name != null && row.name !== '')
    .map((row, index) => ({
      ...validateRow({
        name: String(row.name || '').trim(),
        email: String(row.email || '').trim(),
        membership: String(row.membership || '').trim(),
        remaining_classes: row.remaining_classes,
        membership_expiry: row.membership_expiry ? formatDateForDB(row.membership_expiry) : null,
        check_in_date: row.check_in_date ? formatDateForDB(row.check_in_date) : null,
        class_type: row.class_type,
        is_extra: row.is_extra,
        registration_date: row.registration_date ? formatDateForDB(row.registration_date) : null,
        status: row.status,
        notes: row.notes
      }, index + 2)
    }));
};