import { read, utils } from 'xlsx';
import { ParsedRow, ExcelMemberRow, ParsedMemberData } from './types';
import { validateMemberData } from './validator';
import { formatDateForDB } from '../dateUtils';
import { CardType, CardSubtype, TrainerType } from '../../types/database';

// 定义卡类型映射
const CARD_TYPE_MAPPING = {
  '团课': 'class',  // 映射到CardType中的"class"
  '月卡': 'monthly',  // 映射到CardType中的"monthly"
  '私教课': 'private'  // 映射到CardType中的"private"
} as const;

// 定义卡类别映射
const CARD_CATEGORY_MAPPING = {
  '课时卡': 'group',
  '月卡': 'monthly',
  '私教': 'private'
} as const;

// 定义卡子类型映射
const CARD_SUBTYPE_MAPPING = {
  // 团课课时卡
  '单次卡': 'single_class',
  '两次卡': 'two_classes',
  '10次卡': 'ten_classes',
  // 月卡
  '单次月卡': 'single_monthly',
  '双次月卡': 'double_monthly',
  // 私教卡
  '单次私教': 'single_private',
  '10次私教': 'ten_private'
} as const;

// 定义教练等级映射
const TRAINER_TYPE_MAPPING = {
  'JR教练': 'jr',
  '高级教练': 'senior'
} as const;

// 定义表头映射
const HEADER_MAPPING = {
  '姓名': 'name',
  '姓名 Name': 'name',
  '邮箱': 'email',
  '邮箱 Email': 'email',
  '电话': 'phone',
  '电话 Phone': 'phone',
  '卡类型': 'card_type',
  '卡类型 Card Type': 'card_type',
  '卡类别': 'card_category',
  '卡类别 Card Category': 'card_category',
  '卡子类型': 'card_subtype',
  '卡子类型 Card Subtype': 'card_subtype',
  '剩余团课课时': 'remaining_group_sessions',
  '剩余团课课时 Remaining Group Sessions': 'remaining_group_sessions',
  '剩余私教课时': 'remaining_private_sessions',
  '剩余私教课时 Remaining Private Sessions': 'remaining_private_sessions',
  '到期日期': 'valid_until',
  '到期日期 Valid Until': 'valid_until',
  '教练等级': 'trainer_type',
  '教练等级 Trainer Type': 'trainer_type',
  '备注': 'notes',
  '备注 Notes': 'notes'
};

export const parseExcelFile = async (file: File): Promise<ParsedRow[]> => {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = read(buffer, { 
      type: 'array',
      cellDates: true,
      cellNF: false,
      cellText: false
    });
    
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // 获取原始数据
    const rawRows = utils.sheet_to_json<Record<string, any>>(sheet, {
      raw: true,
      defval: null
    });

    console.log('原始Excel数据:', rawRows);

    // 映射中英文表头和值
    const rows = rawRows.map(row => {
      const mappedRow: Record<string, any> = {};
      Object.entries(row).forEach(([key, value]) => {
        const englishKey = HEADER_MAPPING[key as keyof typeof HEADER_MAPPING];
        if (englishKey) {
          // 转换卡类型
          if (englishKey === 'card_type' && typeof value === 'string') {
            mappedRow[englishKey] = CARD_TYPE_MAPPING[value as keyof typeof CARD_TYPE_MAPPING] || value;
          }
          // 转换卡子类型
          else if (englishKey === 'card_subtype' && typeof value === 'string') {
            mappedRow[englishKey] = CARD_SUBTYPE_MAPPING[value as keyof typeof CARD_SUBTYPE_MAPPING] || value;
          }
          // 转换教练等级
          else if (englishKey === 'trainer_type' && typeof value === 'string') {
            mappedRow[englishKey] = TRAINER_TYPE_MAPPING[value as keyof typeof TRAINER_TYPE_MAPPING] || value;
          }
          // 转换卡类别
          else if (englishKey === 'card_category' && typeof value === 'string') {
            mappedRow[englishKey] = CARD_CATEGORY_MAPPING[value as keyof typeof CARD_CATEGORY_MAPPING] || value;
          }
          else {
            mappedRow[englishKey] = value;
          }
        }
      });
      return mappedRow as ExcelMemberRow;
    });
    
    console.log('映射后的数据:', rows);

    // 过滤空行并验证
    const validatedRows = rows
      .filter(row => row.name != null && row.name !== '')
      .map((row, index) => {
        // 解析会员数据
        const memberData: ParsedMemberData = {
          name: String(row.name || '').trim(),
          email: row.email ? String(row.email).trim() : null,
          phone: row.phone ? String(row.phone).trim() : null,
          card_type: row.card_type as CardType || null,
          card_subtype: row.card_subtype as CardSubtype || null,
          card_category: row.card_category || null,
          remaining_group_sessions: row.remaining_group_sessions ? Number(row.remaining_group_sessions) : null,
          remaining_private_sessions: row.remaining_private_sessions ? Number(row.remaining_private_sessions) : null,
          valid_until: row.valid_until ? formatDateForDB(row.valid_until) : null,
          trainer_type: row.trainer_type as TrainerType || null,
          notes: row.notes || null
        };

        // 验证数据
        const errors = validateMemberData(memberData);

        // 如果验证通过,构造返回数据
        if (errors.length === 0) {
          return {
            data: {
              member: {
                name: memberData.name,
                email: memberData.email,
                phone: memberData.phone,
                notes: memberData.notes
              },
              card: {
                card_type: memberData.card_type!,
                card_subtype: memberData.card_subtype!,
                card_category: memberData.card_category || undefined,
                remaining_group_sessions: memberData.remaining_group_sessions || undefined,
                remaining_private_sessions: memberData.remaining_private_sessions || undefined,
                valid_until: memberData.valid_until || undefined,
                trainer_type: memberData.trainer_type || undefined
              }
            },
            errors: [],
            rowNumber: index + 2
          };
        }

        // 如果验证失败,返回错误信息
        return {
          data: { 
            member: {
              name: '', // 提供默认值
              email: null,
              phone: null,
              notes: null
            }, 
            card: {
              card_type: 'class' as CardType, // 使用英文默认值
              card_subtype: 'single_class' as CardSubtype, // 使用英文默认值
              card_category: undefined,
              remaining_group_sessions: undefined,
              remaining_private_sessions: undefined,
              valid_until: undefined,
              trainer_type: undefined
            } 
          },
          errors,
          rowNumber: index + 2
        };
      });

    console.log('验证后的数据:', validatedRows);
    console.log('验证错误详情:', validatedRows.map(row => ({
      rowNumber: row.rowNumber,
      errors: row.errors
    })));
    return validatedRows;
  } catch (err) {
    console.error('Excel解析错误:', err);
    throw err;
  }
};