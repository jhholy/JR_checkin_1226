import { MembershipType } from '../../types/database';

export function formatMembershipType(type: MembershipType): string {
  const formats: Record<MembershipType, string> = {
    'single_class': '单次卡 Single Class',
    'two_classes': '两次卡 Two Classes',
    'ten_classes': '10次卡 Ten Classes',
    'single_monthly': '单次月卡 Single Monthly',
    'double_monthly': '双次月卡 Double Monthly'
  };
  
  return formats[type] || type;
}

export function isMonthlyMembership(type: MembershipType | null | undefined): boolean {
  return type === 'single_monthly' || type === 'double_monthly';
}