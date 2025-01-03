import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { checkIn } from '../../business/checkIn';
import { CheckInParams } from '../../../types/checkIn';
import { initializeTestData } from '../helpers/testData';
import { cleanupTestCheckIns } from '../helpers/checkInHelpers';
import { supabase } from '../../../lib/supabase';

// 等待函数
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Monthly Membership Check-in Tests', () => {
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

  describe('Single Daily Monthly', () => {
    it('should allow first check-in of the day', async () => {
      // 验证会员存在
      const { data: member } = await supabase
        .from('members')
        .select('*')
        .eq('name', '王五')
        .eq('test_mark', testMark)
        .single();

      expect(member).toBeTruthy();
      expect(member.membership).toBe('single_daily_monthly');

      const params: CheckInParams = {
        name: '王五',
        classType: 'muaythai',
        test_mark: testMark
      };
      const result = await checkIn(params);
      expect(result.is_extra).toBe(false);
    });

    it('should mark second check-in of the day as extra', async () => {
      const secondParams: CheckInParams = {
        name: '王五',
        classType: 'muaythai',
        test_mark: testMark
      };
      const result = await checkIn(secondParams);
      expect(result.is_extra).toBe(true);
    });
  });

  describe('Double Daily Monthly', () => {
    it('should allow first two check-ins of the day', async () => {
      // 验证会员存在
      const { data: member } = await supabase
        .from('members')
        .select('*')
        .eq('name', '赵六')
        .eq('test_mark', testMark)
        .single();

      expect(member).toBeTruthy();
      expect(member.membership).toBe('double_daily_monthly');

      const result1 = await checkIn({
        name: '赵六',
        classType: 'muaythai',
        test_mark: testMark
      });
      expect(result1.is_extra).toBe(false);

      const result2 = await checkIn({
        name: '赵六',
        classType: 'muaythai',
        test_mark: testMark
      });
      expect(result2.is_extra).toBe(false);
    });

    it('should mark third check-in of the day as extra', async () => {
      const result = await checkIn({
        name: '赵六',
        classType: 'muaythai',
        test_mark: testMark
      });
      expect(result.is_extra).toBe(true);
    });
  });

  describe('Expired Monthly Card', () => {
    it('should mark expired card check-in as extra', async () => {
      // 验证会员存在
      const { data: member } = await supabase
        .from('members')
        .select('*')
        .eq('name', '张三')
        .eq('test_mark', testMark)
        .single();

      expect(member).toBeTruthy();
      expect(member.membership).toBe('single_daily_monthly');

      // Set expiration date to yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      await supabase
        .from('members')
        .update({ expiration_date: yesterday.toISOString() })
        .eq('id', member.id)
        .eq('test_mark', testMark);

      const params: CheckInParams = {
        name: '张三',
        classType: 'muaythai',
        test_mark: testMark
      };
      
      const result = await checkIn(params);
      expect(result.is_extra).toBe(true);
      
      // Verify the check-in was recorded as extra
      const { data: checkInRecord } = await supabase
        .from('checkins')
        .select('*')
        .eq('member_id', member.id)
        .eq('test_mark', testMark)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      expect(checkInRecord).toBeTruthy();
      expect(checkInRecord.is_extra).toBe(true);
    });
  });

  describe('Cross-day Check-in Reset', () => {
    it('should reset daily check-in count at midnight', async () => {
      // First check-in for single daily member
      const firstDayParams: CheckInParams = {
        name: '王五',
        classType: 'muaythai',
        test_mark: testMark
      };
      const firstResult = await checkIn(firstDayParams);
      expect(firstResult.is_extra).toBe(false);

      // Second check-in same day (should be extra)
      const secondResult = await checkIn(firstDayParams);
      expect(secondResult.is_extra).toBe(true);

      // Simulate next day by updating last check-in time
      const nextDay = new Date();
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0);

      await supabase
        .from('checkins')
        .update({ 
          created_at: nextDay.toISOString(),
          check_in_date: nextDay.toISOString().split('T')[0]
        })
        .eq('id', secondResult.id)
        .eq('test_mark', testMark);

      // First check-in of new day (should not be extra)
      const nextDayResult = await checkIn(firstDayParams);
      expect(nextDayResult.is_extra).toBe(false);
    });
  });

  describe('Membership Type Transitions', () => {
    it('should handle transition from single to double daily membership', async () => {
      // Create member with single daily membership
      const { data: member } = await supabase
        .from('members')
        .select('*')
        .eq('name', '李四')
        .eq('test_mark', testMark)
        .single();

      expect(member).toBeTruthy();
      expect(member.membership).toBe('single_daily_monthly');

      // First check-in (should be normal)
      const firstParams: CheckInParams = {
        name: '李四',
        classType: 'muaythai',
        test_mark: testMark
      };
      const firstResult = await checkIn(firstParams);
      expect(firstResult.is_extra).toBe(false);

      // Second check-in (should be extra for single daily)
      const secondResult = await checkIn(firstParams);
      expect(secondResult.is_extra).toBe(true);

      // Update to double daily membership
      await supabase
        .from('members')
        .update({ membership: 'double_daily_monthly' })
        .eq('id', member.id)
        .eq('test_mark', testMark);

      // Third check-in (should now be normal for double daily)
      const thirdResult = await checkIn(firstParams);
      expect(thirdResult.is_extra).toBe(false);

      // Fourth check-in (should be extra even for double daily)
      const fourthResult = await checkIn(firstParams);
      expect(fourthResult.is_extra).toBe(true);
    });

    it('should handle transition from double to single daily membership', async () => {
      // Create member with double daily membership
      const { data: member } = await supabase
        .from('members')
        .select('*')
        .eq('name', '赵六')
        .eq('test_mark', testMark)
        .single();

      expect(member).toBeTruthy();
      expect(member.membership).toBe('double_daily_monthly');


      // First two check-ins (should be normal)
      const params: CheckInParams = {
        name: '赵六',
        classType: 'muaythai',
        test_mark: testMark
      };
      
      const firstResult = await checkIn(params);
      expect(firstResult.is_extra).toBe(false);

      const secondResult = await checkIn(params);
      expect(secondResult.is_extra).toBe(false);

      // Update to single daily membership
      await supabase
        .from('members')
        .update({ membership: 'single_daily_monthly' })
        .eq('id', member.id)
        .eq('test_mark', testMark);

      // Next check-in (should be extra for single daily)
      const thirdResult = await checkIn(params);
      expect(thirdResult.is_extra).toBe(true);
    });
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
