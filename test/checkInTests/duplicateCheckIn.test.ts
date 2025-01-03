import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { checkIn } from '../../../utils/business/checkIn';
import { CheckInParams } from '../../../types/checkIn';
import { initializeTestData } from '../helpers/testData';
import { cleanupTestCheckIns } from '../helpers/checkInHelpers';

describe('Duplicate Check-in Tests', () => {
  let testMark: string;

  beforeAll(async () => {
    const result = await initializeTestData();
    testMark = result.testMark;
    // Wait for data creation
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    if (testMark) {
      await cleanupTestCheckIns(testMark);
    }
  });

  describe('Same Session Check-ins', () => {
    it('should block duplicate check-in in same session', async () => {
      // First check-in
      const firstParams: CheckInParams = {
        name: '张三',
        classType: 'muaythai',
        test_mark: testMark
      };
      await checkIn(firstParams);

      // Attempt duplicate check-in
      try {
        const duplicateParams: CheckInParams = {
          name: '张三',
          classType: 'muaythai',
          test_mark: testMark
        };
        await checkIn(duplicateParams);
        throw new Error('Should not allow duplicate check-in');
      } catch (error: any) {
        expect(error.message).toContain('已在本时段签到');
      }
    });
  });

  describe('Different Session Check-ins', () => {
    it('should allow check-in in different sessions', async () => {
      // Morning session check-in
      const morningResult = await checkIn({
        name: '李四',
        classType: 'muaythai',
        session: 'morning',
        test_mark: testMark
      });
      expect(morningResult.is_extra).toBe(false);

      // Evening session check-in
      const eveningResult = await checkIn({
        name: '李四',
        classType: 'muaythai',
        session: 'evening',
        test_mark: testMark
      });
      expect(eveningResult.is_extra).toBe(true); // Second check-in should be extra
    });
  });
});
