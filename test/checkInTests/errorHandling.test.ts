import { describe, it, expect, beforeAll } from 'vitest';
import { checkIn } from '../../business/checkIn';
import { CheckInParams } from '../../../types/checkIn';
import { initializeTestData } from '../helpers/testData';

describe('Error Handling Tests', () => {
  let testMark: string;

  beforeAll(async () => {
    const result = await initializeTestData();
    testMark = result.testMark;
  });

  describe('Empty Name Handling', () => {
    it('should reject empty name', async () => {
      const params: CheckInParams = {
        test_mark: testMark,
        name: '',
        classType: 'muaythai'
      };

      try {
        await checkIn(params);
        throw new Error('Should not allow empty name');
      } catch (error: any) {
        expect(error.message).toContain('姓名不能为空');
        expect(error.message).toContain('Name cannot be empty');
      }
    });

    it('should reject whitespace-only name', async () => {
      const params: CheckInParams = {
        test_mark: testMark,
        name: '   ',
        classType: 'muaythai'
      };

      try {
        await checkIn(params);
        throw new Error('Should not allow whitespace-only name');
      } catch (error: any) {
        expect(error.message).toContain('姓名不能为空');
        expect(error.message).toContain('Name cannot be empty');
      }
    });
  });

  describe('Special Character Handling', () => {
    it('should handle names with special characters', async () => {
      const params: CheckInParams = {
        test_mark: testMark,
        name: '李@四#',
        classType: 'muaythai'
      };

      try {
        await checkIn(params);
        throw new Error('Should not allow special characters');
      } catch (error: any) {
        expect(error.message).toContain('姓名包含无效字符');
        expect(error.message).toContain('Name contains invalid characters');
      }
    });
  });

  describe('Email Format Validation', () => {
    it('should reject invalid email format', async () => {
      const params: CheckInParams = {
        test_mark: testMark,
        name: '李四',
        email: 'invalid.email',
        classType: 'muaythai'
      };

      try {
        await checkIn(params);
        throw new Error('Should not allow invalid email');
      } catch (error: any) {
        expect(error.message).toContain('邮箱格式无效');
        expect(error.message).toContain('Invalid email format');
      }
    });

    it('should accept valid email format', async () => {
      const params: CheckInParams = {
        test_mark: testMark,
        name: '李四',
        email: 'valid.email@example.com',
        classType: 'muaythai'
      };

      const result = await checkIn(params);
      expect(result).toBeTruthy();
    });
  });
});
