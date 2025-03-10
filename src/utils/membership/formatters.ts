import { MembershipType } from '../../types/database';
import { Database } from '../../types/database';
import { formatDate } from '../dateUtils';

type MembershipCard = Database['public']['Tables']['membership_cards']['Row'];

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

/**
 * 获取会员卡的完整名称（中文）
 */
export function getFullCardName(card: MembershipCard): string {
  if (!card) return '无卡';

  let name = '';
  
  // 标准化卡类型
  const cardType = standardizeCardType(card.card_type);
  const cardCategory = standardizeCardCategory(card.card_category);
  const cardSubtype = standardizeCardSubtype(card.card_subtype);
  
  if (cardType === '团课') {
    if (cardCategory === '课时卡') {
      name = `团课${cardSubtype}`;
    } else if (cardCategory === '月卡') {
      name = `团课${cardSubtype}`;
    }
  } else if (cardType === '私教课') {
    name = `私教${cardSubtype}`;
    if (card.trainer_type) {
      name += ` (${card.trainer_type === 'jr' ? 'JR教练' : '高级教练'})`;
    }
  }
  
  return name || '未知卡类型';
}

/**
 * 格式化会员卡类型（中文）
 */
export function formatCardType(card: MembershipCard): string {
  if (!card) return '无卡';
  
  console.log('格式化会员卡:', card); // 添加日志，查看卡信息
  
  // 直接检查card.card_type是否已经是中文
  if (card.card_type === '团课' || card.card_type === '私教课') {
    let name = card.card_type;
    
    // 添加子类型
    if (card.card_subtype) {
      name += ' ' + card.card_subtype;
    }
    
    // 添加教练类型
    if (card.card_type === '私教课' && card.trainer_type) {
      name += ` (${card.trainer_type === 'jr' ? 'JR教练' : '高级教练'})`;
    }
    
    return name;
  }
  
  // 如果不是中文，则进行标准化
  const cardType = standardizeCardType(card.card_type);
  const cardCategory = standardizeCardCategory(card.card_category);
  const cardSubtype = standardizeCardSubtype(card.card_subtype);
  
  let name = '';
  
  if (cardType === '团课') {
    if (cardCategory === '课时卡') {
      name = `团课 ${cardSubtype}`;
    } else if (cardCategory === '月卡') {
      name = `团课 ${cardSubtype}`;
    }
  } else if (cardType === '私教课') {
    name = `私教 ${cardSubtype}`;
    if (card.trainer_type) {
      name += ` (${card.trainer_type === 'jr' ? 'JR教练' : '高级教练'})`;
    }
  }
  
  return name || '未知卡类型';
}

/**
 * 格式化会员卡有效期
 */
export function formatCardValidity(card: MembershipCard): string {
  if (!card) return '';
  
  console.log('格式化会员卡有效期:', card); // 添加日志，查看卡信息
  
  if (!card.valid_until) {
    return '无到期日';
  }
  
  const validUntil = new Date(card.valid_until);
  const now = new Date();
  
  // 检查卡是否已过期
  if (validUntil < now) {
    return `已过期 (${formatDate(card.valid_until)})`;
  }
  
  // 计算剩余天数
  const diffTime = validUntil.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 7) {
    return `即将到期 (${formatDate(card.valid_until)})`;
  }
  
  return `有效期至 ${formatDate(card.valid_until)}`;
}

/**
 * 格式化剩余课时
 */
export function formatRemainingClasses(card: MembershipCard): string {
  if (!card) return '';
  
  console.log('格式化剩余课时:', card); // 添加日志，查看卡信息
  
  const cardType = card.card_type || '';
  
  if (cardType === '团课') {
    if (card.remaining_group_sessions === null || card.remaining_group_sessions === undefined) {
      return '课时未设置';
    }
    return `剩余 ${card.remaining_group_sessions} 节团课`;
  } else if (cardType === '私教课') {
    if (card.remaining_private_sessions === null || card.remaining_private_sessions === undefined) {
      return '课时未设置';
    }
    return `剩余 ${card.remaining_private_sessions} 节私教课`;
  }
  
  // 如果card_type不是中文，尝试标准化
  const standardizedType = standardizeCardType(cardType);
  
  if (standardizedType === '团课') {
    if (card.remaining_group_sessions === null || card.remaining_group_sessions === undefined) {
      return '课时未设置';
    }
    return `剩余 ${card.remaining_group_sessions} 节团课`;
  } else if (standardizedType === '私教课') {
    if (card.remaining_private_sessions === null || card.remaining_private_sessions === undefined) {
      return '课时未设置';
    }
    return `剩余 ${card.remaining_private_sessions} 节私教课`;
  }
  
  return '';
}

/**
 * 标准化卡类型
 */
function standardizeCardType(cardType: string | null): string {
  if (!cardType) return '';
  
  const lowerType = cardType.toLowerCase();
  
  if (lowerType === 'class' || lowerType === 'group' || lowerType.includes('团课')) {
    return '团课';
  } else if (lowerType === 'private' || lowerType.includes('私教')) {
    return '私教课';
  }
  
  return cardType;
}

/**
 * 标准化卡类别
 */
function standardizeCardCategory(cardCategory: string | null): string {
  if (!cardCategory) return '';
  
  const lowerCategory = cardCategory.toLowerCase();
  
  if (lowerCategory === 'session' || lowerCategory === 'sessions' || lowerCategory.includes('课时')) {
    return '课时卡';
  } else if (lowerCategory === 'monthly' || lowerCategory.includes('月')) {
    return '月卡';
  }
  
  return cardCategory;
}

/**
 * 标准化卡子类型
 */
function standardizeCardSubtype(cardSubtype: string | null): string {
  if (!cardSubtype) return '';
  
  const lowerSubtype = cardSubtype.toLowerCase();
  
  if (lowerSubtype.includes('single') && !lowerSubtype.includes('monthly')) {
    return '单次卡';
  } else if (lowerSubtype.includes('two') || lowerSubtype.includes('double') && !lowerSubtype.includes('monthly')) {
    return '两次卡';
  } else if (lowerSubtype.includes('ten') || lowerSubtype.includes('10')) {
    return '10次卡';
  } else if (lowerSubtype.includes('single') && lowerSubtype.includes('monthly')) {
    return '单次月卡';
  } else if (lowerSubtype.includes('double') && lowerSubtype.includes('monthly')) {
    return '双次月卡';
  }
  
  return cardSubtype;
}