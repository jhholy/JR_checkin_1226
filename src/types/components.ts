import { Member } from './database';

// 认证相关组件 Props
export interface AuthComponentProps {
  onSuccess: () => void;
}

// 基础组件 Props
export interface BaseComponentProps {
  className?: string;
}

// 图标组件 Props
export interface IconProps extends BaseComponentProps {
  size?: number;
}

// 会员相关组件 Props
export interface MemberComponentProps {
  member: Member;
  onUpdate?: (member: Member) => void;
  onDelete?: (id: string) => void;
}

// 签到状态
export interface CheckInStatus {
  success: boolean;
  message: string;
  isExtra?: boolean;
  isDuplicate?: boolean;
  existingMember?: boolean;
}

// 会员表格 Props
export interface MemberTableProps {
  members: Member[];
  onEdit: (member: Member) => void;
  onDelete: (id: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
} 