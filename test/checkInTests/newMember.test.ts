import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { checkIn } from '../../business/checkIn';
import { initializeTestData } from '../helpers/testData';
// Removed unused import
import { cleanupTestCheckIns } from '../helpers/checkInHelpers';
import { supabase } from '../../../lib/supabase';

// 等待函数
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('New Member Check-in Tests', () => {
  let testMark: string;

  beforeAll(async () => {
    // 初始化测试数据并获取测试标记
    const result = await initializeTestData();
    testMark = result.testMark;
    // 等待数据创建完成
    await wait(2000);
  });

  afterAll(async () => {
    if (testMark) {
      await cleanupTestCheckIns(testMark);
    }
  });

  it('should mark new member check-in as extra', async () => {
    // 验证会员存在
    const { data: member } = await supabase
      .from('members')
      .select('*')
      .eq('name', '张三')
      .eq('test_mark', testMark)
      .single();

    expect(member).toBeTruthy();
    expect(member.is_new_member).toBe(true);

    const result = await checkIn({
      test_mark: testMark,
      name: '张三',
      classType: 'muaythai'
    });
    expect(result.is_extra).toBe(true);
  });

  it('should update new member status after first check-in', async () => {
    // 先进行一次签到
    await checkIn({
      test_mark: testMark,
      name: '张三',
      classType: 'muaythai'
    });

    // 检查会员状态是否已更新
    const { data: member } = await supabase
      .from('members')
      .select('is_new_member')
      .eq('name', '张三')
      .eq('test_mark', testMark)
      .single();

    expect(member?.is_new_member).toBe(false);
  });

  // 验证签到记录
  afterEach(async () => {
    const { data: checkIns } = await supabase
      .from('checkins')
      .select('*')
      .eq('test_mark', testMark);

    expect(checkIns).toBeTruthy();
    checkIns?.forEach(checkIn => {
      expect(checkIn.test_mark).toBe(testMark);
    });
  });
});
