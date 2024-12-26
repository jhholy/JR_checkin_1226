import { MembershipType } from '../../types/database';

export function formatMembershipType(type: MembershipType): string {
  const formats: Record<MembershipType, string> = {
    'single_class': '单次卡 Single Class',
    'two_classes': '两次卡 Two Classes',
    'ten_classes': '10次卡 Ten Classes',
    'single_daily_monthly': '日单月卡 Single Daily Monthly',
    'double_daily_monthly': '日多月卡 Double Daily Monthly'
  };
  
  return formats[type] || type;
}

export function isMonthlyMembership(type: MembershipType | null | undefined): boolean {
  return type === 'single_daily_monthly' || type === 'double_daily_monthly';
}