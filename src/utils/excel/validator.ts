import { ExcelRow, ParsedRow, ParsedMemberData, ParsedCheckInData } from './types';
import { Member, MembershipType, CardType, CardSubtype, ClassType, TrainerType } from '../../types/database';
import { validateName } from '../nameValidation';
import { validateEmail } from '../validation/emailValidation';
import { isValidMembershipType, validateMembershipData } from '../validation/membershipValidation';

export const validateRow = (row: ExcelRow, rowNumber: number): ParsedRow => {
  const errors: string[] = [];
  const name = row.name?.trim() || '';

  if (!name) {
    return {
      data: {},
      errors: ['Name is required'],
      rowNumber
    };
  }

  // Clean and validate membership type
  const membershipType = row.membership?.trim() || null;
  const validatedMembership = isValidMembershipType(membershipType) ? membershipType : null;

  const parsedData: Partial<Member> = {
    name,
    email: row.email?.trim() || null,
    membership: validatedMembership,
    remaining_classes: row.remaining_classes ? Number(row.remaining_classes) : 0,
    membership_expiry: row.membership_expiry || null,
    is_new_member: false
  };

  // Validate fields
  if (!validateName(name)) {
    errors.push(`Invalid name format: "${name}"`);
  }

  if (parsedData.email && !validateEmail(parsedData.email)) {
    errors.push('Invalid email format');
  }

  // Validate membership data
  const membershipErrors = validateMembershipData(
    membershipType,
    parsedData.remaining_classes,
    parsedData.membership_expiry
  );
  errors.push(...membershipErrors);

  return {
    data: parsedData,
    errors,
    rowNumber
  };
};

// 验证卡类型
const validateCardType = (type: string | null): type is CardType => {
  if (!type) return true;
  return ['class', 'time', 'private'].includes(type);
};

// 验证卡子类型
const validateCardSubtype = (subtype: string | null, cardType: CardType | null): subtype is CardSubtype => {
  if (!subtype || !cardType) return true;

  const validSubtypes = {
    class: ['group', 'private'],
    time: ['monthly', 'quarterly', 'yearly'],
    private: ['single_private', 'ten_private']
  };

  return validSubtypes[cardType]?.includes(subtype) || false;
};

// 验证课程类型
const validateClassType = (type: string): type is ClassType => {
  return ['morning', 'evening'].includes(type);
};

// 验证教练等级
const validateTrainerType = (type: string | null): type is TrainerType => {
  if (!type) return true;
  return ['jr', 'senior'].includes(type);
};

// 验证日期格式
const validateDate = (date: string | null): boolean => {
  if (!date) return true;
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime());
};

// 验证课时数
const validateSessions = (sessions: number | null): boolean => {
  if (sessions === null) return true;
  return Number.isInteger(sessions) && sessions >= 0;
};

// 验证手机号
const validatePhone = (phone: string | null): boolean => {
  if (!phone) return true;
  return /^1[3-9]\d{9}$/.test(phone);
};

// 验证会员数据
export const validateMemberData = (data: ParsedMemberData): string[] => {
  const errors: string[] = [];

  // 验证必填字段
  if (!data.name || !validateName(data.name)) {
    errors.push('无效的姓名格式 Invalid name format');
  }

  // 验证邮箱格式
  if (data.email && !validateEmail(data.email)) {
    errors.push('无效的邮箱格式 Invalid email format');
  }

  // 验证手机号格式
  if (data.phone && !validatePhone(data.phone)) {
    errors.push('无效的手机号格式 Invalid phone number format');
  }

  // 验证卡类型
  if (!validateCardType(data.card_type)) {
    errors.push('无效的卡类型 Invalid card type');
  }

  // 验证卡子类型
  if (!validateCardSubtype(data.card_subtype, data.card_type)) {
    errors.push('无效的卡子类型 Invalid card subtype');
  }

  // 验证课时数
  if (data.card_type === 'class' || data.card_type === 'private') {
    if (!validateSessions(data.remaining_group_sessions)) {
      errors.push('无效的团课课时数 Invalid group sessions');
    }
    if (!validateSessions(data.remaining_private_sessions)) {
      errors.push('无效的私教课时数 Invalid private sessions');
    }
  }

  // 验证到期日期
  if (!validateDate(data.valid_until)) {
    errors.push('无效的到期日期格式 Invalid expiry date format');
  }

  // 验证教练等级
  if (!validateTrainerType(data.trainer_type)) {
    errors.push('无效的教练等级 Invalid trainer type');
  }

  return errors;
};

// 验证签到数据
export const validateCheckInData = (data: ParsedCheckInData): string[] => {
  const errors: string[] = [];

  // 验证必填字段
  if (!data.name || !validateName(data.name)) {
    errors.push('无效的姓名格式 Invalid name format');
  }

  // 验证邮箱格式
  if (data.email && !validateEmail(data.email)) {
    errors.push('无效的邮箱格式 Invalid email format');
  }

  // 验证课程类型
  if (!validateClassType(data.class_type)) {
    errors.push('无效的课程类型 Invalid class type');
  }

  // 验证签到日期
  if (!validateDate(data.check_in_date)) {
    errors.push('无效的签到日期格式 Invalid check-in date format');
  }

  // 验证签到时间
  if (data.check_in_time && !validateDate(`2000-01-01 ${data.check_in_time}`)) {
    errors.push('无效的签到时间格式 Invalid check-in time format');
  }

  return errors;
};