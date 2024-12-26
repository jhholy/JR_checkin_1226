import { read, utils } from 'xlsx';
import { ParsedRow, ExcelRow } from './types';
import { validateRow } from './validator';
import { formatDateForDB } from '../dateUtils';

const EXCEL_HEADERS = [
  'name',
  'email',
  'membership',
  'remaining_classes',
  'membership_expiry',
  'check_in_date',
  'class_type',
  'is_extra',
  'registration_date',
  'status',
  'notes'
];

export const parseExcelFile = async (file: File): Promise<ParsedRow[]> => {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { 
    type: 'array',
    cellDates: true,
    cellNF: false,
    cellText: false
  });
  
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  
  // Convert sheet to JSON with strict header mapping
  const rows = utils.sheet_to_json<ExcelRow>(sheet, { 
    header: EXCEL_HEADERS,
    range: 1, // Skip header row
    raw: true, // Get raw values
    defval: null // Use null for empty cells
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