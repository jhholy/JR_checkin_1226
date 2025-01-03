import { supabase } from '../../../lib/supabase';
import { Member } from '../../../types/database';

const TEST_EMAIL_DOMAIN = 'test.com';

export interface TestDataResult {
  testMark: string;
  members: Member[];
}

export async function initializeTestData(): Promise<TestDataResult> {
  const testMark = `test_${Date.now()}`;
  const members: Member[] = [];

  // Create test members
  const memberData = [
    { name: '张三', memberType: 'new', email: `zhang.san_${testMark}@${TEST_EMAIL_DOMAIN}` },
    { name: '李四', memberType: 'ten_classes', email: `li.si_${testMark}@${TEST_EMAIL_DOMAIN}` },
    { name: '王五', memberType: 'single_daily_monthly', email: `wang.wu_${testMark}@${TEST_EMAIL_DOMAIN}` },
    { name: '赵六', memberType: 'double_daily_monthly', email: `zhao.liu_${testMark}@${TEST_EMAIL_DOMAIN}` }
  ];

  for (const data of memberData) {
    const member = await createTestMember(data.name, data.memberType, testMark);
    members.push(member);
  }

  return { testMark, members };
}

/**
 * Cleans up test data using the standardized cleanup function
 * Uses JSONB parameter for consistency with other test utilities
 * @param testMark - Optional test mark to limit cleanup scope
 */
export async function cleanupTestData(testMark?: string) {
  const { error } = await supabase.rpc('cleanup_test_data', {
    test_mark: testMark
  });
  
  if (error) {
    throw new Error(`Failed to cleanup test data: ${error.message}`);
  }
}

export async function verifyTestDataCleanup() {
  const { data, error } = await supabase.rpc('verify_test_data', {
    test_email_domain: TEST_EMAIL_DOMAIN
  });

  if (error) {
    throw new Error(`Failed to verify test data cleanup: ${error.message}`);
  }

  if (data[0].remaining_members > 0 || data[0].remaining_checkins > 0) {
    throw new Error(`Test data cleanup incomplete: ${JSON.stringify(data[0])}`);
  }
}

export function generateTestEmail(prefix: string, testMark: string) {
  return `${prefix}_${testMark}@${TEST_EMAIL_DOMAIN}`;
}

export async function createTestMember(
  name: string,
  memberType: string = 'regular',
  testMark: string,
  additionalData: Record<string, any> = {}
) {
  const email = generateTestEmail(name, testMark);
  
  const { data: member, error } = await supabase
    .from('members')
    .insert([
      { 
        name, 
        email, 
        member_type: memberType,
        test_mark: testMark,
        ...additionalData
      }
    ])
    .select()
    .single();
    
  if (error) {
    throw new Error(`Failed to create test member: ${error.message}`);
  }
  
  return member;
}

export async function initializeExpiredClassMember(testMark: string) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return createTestMember(
    '过期会员',
    'ten_classes',
    testMark,
    {
      remaining_classes: 0,
      class_expiry_date: yesterday.toISOString(),
      is_expired: true
    }
  );
}

export async function createTestCheckIn(memberId: string, testMark: string) {
  const { data: checkIn, error } = await supabase
    .from('checkins')
    .insert([
      { 
        member_id: memberId,
        test_mark: testMark
      }
    ])
    .select()
    .single();
    
  if (error) {
    throw new Error(`Failed to create test check-in: ${error.message}`);
  }
  
  return checkIn;
}
