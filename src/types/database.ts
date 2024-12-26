export type MembershipType = 
  | 'single_class'
  | 'two_classes'
  | 'ten_classes'
  | 'single_daily_monthly'
  | 'double_daily_monthly';

export type ClassType = 'morning' | 'evening';

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

export interface CheckIn {
  id: string;
  member_id: string;
  class_type: ClassType;
  check_in_date: string;
  created_at: string;
  is_extra: boolean;
}

export interface ClassSchedule {
  id: string;
  day_of_week: number;
  class_type: ClassType;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

// Helper types for form handling
export interface CheckInFormData {
  name: string;
  email?: string;
  classType: ClassType;
}

export interface NewMemberFormData extends CheckInFormData {
  phone?: string;
}