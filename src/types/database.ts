// 会员卡类型
export type MembershipType = 
  | 'single_class'
  | 'two_classes'
  | 'ten_classes'
  | 'single_monthly'
  | 'double_monthly';

// 课程类型
export type ClassType = 'morning' | 'evening';

// 会员信息
export interface Member {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  membership?: MembershipType;
  remaining_classes: number;
  membership_expiry?: string;
  extra_check_ins: number;
  is_new_member: boolean;
  created_at: string;
  updated_at: string;
}

// 签到记录
export interface CheckIn {
  id: string;
  member_id: string;
  class_type: ClassType;
  check_in_date: string;
  created_at: string;
  is_extra: boolean;
}

// 签到表单数据
export interface CheckInFormData {
  name: string;
  email?: string;
  classType: ClassType;
}

// 新会员签到表单数据
export interface NewMemberFormData extends CheckInFormData {
  phone?: string;
}

// 数据库类型定义
export interface Database {
  public: {
    Tables: {
      members: {
        Row: Member;
        Insert: Omit<Member, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Member, 'id'>>;
      };
      check_ins: {
        Row: CheckIn;
        Insert: Omit<CheckIn, 'id' | 'created_at'>;
        Update: Partial<Omit<CheckIn, 'id'>>;
      };
    };
  };
}
