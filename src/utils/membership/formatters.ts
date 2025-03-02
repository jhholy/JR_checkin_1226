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

// 新增函数，用于格式化会员卡类型
export function formatCardType(cardType: string): string {
  const typeMap: Record<string, string> = {
    '团课': '团课 Group Class',
    '私教课': '私教课 Private Class'
  };
  
  return typeMap[cardType] || cardType;
}

// 新增函数，用于格式化会员卡类别
export function formatCardCategory(category: string | null): string {
  if (!category) return '';
  
  const categoryMap: Record<string, string> = {
    '课时卡': '课时卡 Session Card',
    '月卡': '月卡 Monthly Card'
  };
  
  return categoryMap[category] || category;
}

// 新增函数，用于格式化会员卡子类型
export function formatCardSubtype(subtype: string, cardType: string): string {
  if (cardType === '团课') {
    const subtypeMap: Record<string, string> = {
      '单次卡': '单次卡 Single Class',
      '两次卡': '两次卡 Two Classes',
      '10次卡': '10次卡 Ten Classes',
      '单次月卡': '单次月卡 Single Monthly',
      '双次月卡': '双次月卡 Double Monthly'
    };
    return subtypeMap[subtype] || subtype;
  } else if (cardType === '私教课') {
    const subtypeMap: Record<string, string> = {
      '单次卡': '单次私教卡 Single Private',
      '10次卡': '10次私教卡 Ten Private'
    };
    return subtypeMap[subtype] || subtype;
  }
  
  return subtype;
}

// 新增函数，用于获取会员卡完整名称
export function getFullCardName(cardType: string, cardCategory: string | null, cardSubtype: string): string {
  if (cardType === '团课') {
    if (cardCategory === '课时卡') {
      return `团课${cardSubtype}`;
    } else if (cardCategory === '月卡') {
      return `团课${cardSubtype}`;
    }
  } else if (cardType === '私教课') {
    return `私教${cardSubtype}`;
  }
  
  return `${cardType} ${cardCategory || ''} ${cardSubtype}`;
}