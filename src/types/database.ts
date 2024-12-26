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
  email: string;
  membership: string | null;
  remaining_classes: number | null;
  membership_expiry: string | null;
}

export interface CheckIn {
  id: number;
  member_id: number;
  class_type: ClassType;
  is_extra: boolean;
  created_at: string;
  check_in_date: string;
  members?: {
    name: string;
  };
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