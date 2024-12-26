import { Member } from '../../types/database';

export interface ParsedRow {
  data: Partial<Member>;
  errors: string[];
  rowNumber: number;
}

export interface ExcelRow {
  name?: string;
  email?: string;
  membership?: string;
  remaining_classes?: string | number;
  membership_expiry?: string;
  check_in_date?: string;
  class_type?: string;
  is_extra?: boolean;
  registration_date?: string;
  status?: string;
  notes?: string;
}