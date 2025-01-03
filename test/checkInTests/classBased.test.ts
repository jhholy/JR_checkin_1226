import { describe, it, expect, beforeAll } from 'vitest';
import { checkIn } from '../../business/checkIn';
import { CheckInParams } from '../../../types/checkIn';
import { 
  initializeTestData, 
  initializeExpiredClassMember,
  createTestMember
} from '../helpers/testData';

// 等待函数
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Class-based Membership Check-in Tests', () => {
  let testMark: string;

  beforeAll(async () => {
    const result = await initializeTestData();
    testMark = result.testMark;
    // 等待数据创建完成
    await wait(2000);
  });

  describe('Ten Classes Package', () => {
    it('should deduct one class after check-in', async () => {
      const params: CheckInParams = {
        test_mark: testMark,
        name: '李四',
        email: 'li.si.test.mt@example.com',
        classType: 'muaythai'
      };
      const result = await checkIn(params);
      expect(result.is_extra).toBe(false);
    });
  });

  describe('No Remaining Classes', () => {
    it('should mark check-in as extra when no classes remain', async () => {
      // 先用完所有课时
      for (let i = 0; i < 10; i++) {
        const loopParams: CheckInParams = {
          test_mark: testMark,
          name: '李四',
          email: 'li.si.test.mt@example.com',
          classType: 'muaythai'
        };
        await checkIn(loopParams);
      }

      // 再次签到应该标记为extra
      const finalParams: CheckInParams = {
        test_mark: testMark,
        name: '李四',
        email: 'li.si.test.mt@example.com',
        classType: 'muaythai'
      };
      const result = await checkIn(finalParams);
      expect(result.is_extra).toBe(true);
    });
  });

  describe('Class Package Expiration', () => {
    beforeAll(async () => {
      await initializeTestData();
    });

    it('should mark check-in as extra when classes have expired', async () => {
      // Initialize a member with expired class package
      const expiredMember = await initializeExpiredClassMember(testMark);
      
      const params: CheckInParams = {
        test_mark: testMark,
        name: expiredMember.name,
        email: expiredMember.email,
        classType: 'muaythai'
      };
      
      // Check-in with expired classes should be marked as extra
      const result = await checkIn(params);
      expect(result.is_extra).toBe(true);
      expect(result.message).toContain('expired');

      // Verify remaining classes is still 0
      const secondResult = await checkIn(params);
      expect(secondResult.is_extra).toBe(true);
      expect(secondResult.message).toContain('expired');
    });

    it('should handle class expiration during check-in period', async () => {
      // Create a member with one remaining class
      const member = await createTestMember(
        '即将过期会员',
        'ten_classes',
        testMark,
        {
          remaining_classes: 1,
          class_expiry_date: new Date().toISOString() // Expires today
        }
      );
      
      const params: CheckInParams = {
        test_mark: testMark,
        name: member.name,
        email: member.email,
        classType: 'muaythai'
      };

      // First check-in should use the last remaining class
      const firstResult = await checkIn(params);
      expect(firstResult.is_extra).toBe(false);
      expect(firstResult.message).toContain('last class');

      // Second check-in should be marked as extra due to expiration
      const secondResult = await checkIn(params);
      expect(secondResult.is_extra).toBe(true);
      expect(secondResult.message).toContain('expired');
    });
  });
});
