export interface DashboardStats {
  // 现有统计
  activeMembers: number;
  membershipGrowth: number;
  todayCheckIns: number;
  todayExtraCheckIns: number;
  expiringMemberships: number;
  
  // 新增统计
  membershipTypeCounts: {
    singleDaily: number;
    doubleDaily: number;
    tenClasses: number;
    twoClasses: number;
    singleClass: number;
  };
  weeklyCheckIns: number;
  monthlyCheckIns: number;
  averageDailyCheckIns: number;
} 