import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { validateCheckIn } from '../../business/checkIn';
import { initializeTestData, cleanupTestData } from '../helpers/testData';
import { CheckInValidationResult } from '../../../types/checkIn';

describe('Duplicate Name Check-in Tests', () => {
  let testMark: string;

  beforeAll(async () => {
    // 初始化测试数据并获取测试标记
    const result = await initializeTestData();
    testMark = result.testMark;
    // 等待数据创建完成
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    // 清理本次测试的数据
    if (testMark) {
      await cleanupTestData(testMark);
    }
  });

  it('should require email when name has duplicates', async () => {
    const result: CheckInValidationResult = await validateCheckIn('王小明');
    expect(result.needs_email).toBe(true);
    expect(result.error).toBe('存在多个同名会员，请提供邮箱');
  });

  it('should find correct member with email', async () => {
    const result: CheckInValidationResult = await validateCheckIn('王小明', 'wang.xm1.test.mt@example.com');
    expect(result.member_id).toBeTruthy();
    expect(result.error).toBeUndefined();
  });

  it('should handle incorrect email for duplicate name', async () => {
    const result: CheckInValidationResult = await validateCheckIn('王小明', 'wrong@email.com');
    expect(result.member_id).toBeUndefined();
    expect(result.error).toBe('邮箱不匹配');
  });
});
