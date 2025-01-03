import { describe, it, expect, beforeAll } from 'vitest';
import { checkIn } from '../../business/checkIn';
import { CheckInParams } from '../../../types/checkIn';
import { initializeTestData } from '../helpers/testData';
import { supabase } from '../../../lib/supabase';

describe('Duplicate Name Verification Tests', () => {
  let testMark: string;

  beforeAll(async () => {
    const result = await initializeTestData();
    testMark = result.testMark;
  });

  describe('Email Verification Interface', () => {
    it('should require email for duplicate names', async () => {
      // First member check-in
      const firstParams: CheckInParams = {
        name: '张三',
        email: 'zhang.san.1@example.com',
        classType: 'muaythai',
        test_mark: testMark
      };
      await checkIn(firstParams);

      // Second member with same name but no email
      const secondParams: CheckInParams = {
        test_mark: testMark,
        name: '张三',
        classType: 'muaythai'
      };

      try {
        await checkIn(secondParams);
        throw new Error('Should require email for duplicate names');
      } catch (error: any) {
        expect(error.message).toContain('需要邮箱验证');
        expect(error.message).toContain('Email verification required');
      }
    });

    it('should distinguish members with same name but different emails', async () => {
      const params1: CheckInParams = {
        test_mark: testMark,
        name: '李四',
        email: 'li.si.1@example.com',
        classType: 'muaythai'
      };
      const result1 = await checkIn(params1);
      expect(result1).toBeTruthy();

      const params2: CheckInParams = {
        test_mark: testMark,
        name: '李四',
        email: 'li.si.2@example.com',
        classType: 'muaythai'
      };
      const result2 = await checkIn(params2);
      expect(result2).toBeTruthy();

      // Verify they are treated as different members
      const { data: members } = await supabase
        .from('members')
        .select('*')
        .eq('name', '李四')
        .eq('test_mark', testMark);

      expect(members?.length).toBe(2);
    });

    it('should reject check-in with wrong email for existing member', async () => {
      const params: CheckInParams = {
        test_mark: testMark,
        name: '李四',
        email: 'wrong.email@example.com',
        classType: 'muaythai'
      };

      try {
        await checkIn(params);
        throw new Error('Should not allow check-in with wrong email');
      } catch (error: any) {
        expect(error.message).toContain('邮箱验证失败');
        expect(error.message).toContain('Email verification failed');
      }
    });

    it('should handle duplicate members without email', async () => {
      // Create first member without email
      const params1: CheckInParams = {
        name: '王五',
        classType: 'muaythai',
        test_mark: testMark
      };
      await checkIn(params1);

      // Try to create second member with same name without email
      const params2: CheckInParams = {
        name: '王五',
        classType: 'muaythai',
        test_mark: testMark
      };

      try {
        await checkIn(params2);
        throw new Error('Should require email for duplicate names');
      } catch (error: any) {
        expect(error.message).toContain('需要邮箱验证');
        expect(error.message).toContain('Email verification required');
      }
    });

    it('should allow canceling email verification', async () => {
      const params: CheckInParams = {
        test_mark: testMark,
        name: '张三',
        classType: 'muaythai',
        cancelEmailVerification: true
      };

      try {
        await checkIn(params);
      } catch (error: any) {
        expect(error.message).toContain('取消邮箱验证');
        expect(error.message).toContain('Email verification cancelled');
      }
    });
  });
});
