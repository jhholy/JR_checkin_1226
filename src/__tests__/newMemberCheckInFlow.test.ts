import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '../lib/supabase';
import { useNewMemberCheckIn } from '../hooks/useNewMemberCheckIn';
import { renderHook, act } from '@testing-library/react';

const TEST_DATE = '2025-01-15';

describe('新会员签到流程测试', () => {
  // 每个测试前清理数据
  beforeEach(async () => {
    console.log('=== 清理测试数据 ===');
    
    // 删除测试签到记录
    await supabase
      .from('check_ins')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
      
    // 删除测试会员
    await supabase
      .from('members')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
      
    console.log('测试数据清理完成');
  });

  // 测试1: 成功的新会员签到流程
  it('新会员首次签到应该成功完成', async () => {
    console.log('=== 开始测试新会员签到流程 ===');
    
    const { result } = renderHook(() => useNewMemberCheckIn());
    
    // 准备测试数据
    const formData = {
      name: `test_member_${TEST_DATE}`,
      email: `test.checkin.${TEST_DATE}@example.com`,
      classType: 'morning'
    };
    
    console.log('提交新会员签到:', formData);
    
    // 执行签到
    let checkInResult;
    await act(async () => {
      checkInResult = await result.current.submitNewMemberCheckIn(formData);
    });
    
    console.log('签到结果:', checkInResult);
    
    // 验证签到结果
    expect(checkInResult.success).toBe(true);
    expect(checkInResult.isExtra).toBe(true);
    
    // 验证会员记录
    const { data: member } = await supabase
      .from('members')
      .select('*')
      .eq('email', formData.email)
      .single();
      
    console.log('创建的会员记录:', member);
    
    expect(member).not.toBeNull();
    expect(member.name).toBe(formData.name);
    expect(member.is_new_member).toBe(true);
    
    // 验证签到记录
    const { data: checkin } = await supabase
      .from('check_ins')
      .select('*')
      .eq('member_id', member.id)
      .single();
      
    console.log('创建的签到记录:', checkin);
    
    expect(checkin).not.toBeNull();
    expect(checkin.is_extra).toBe(true);
    expect(checkin.class_type).toBe(formData.classType);
    
    console.log('=== 新会员签到流程测试完成 ===');
  });

  // 测试2: 重复会员名称
  it('重复的会员名称应该被拒绝', async () => {
    console.log('=== 开始测试重复会员名称 ===');
    
    const { result } = renderHook(() => useNewMemberCheckIn());
    
    // 先创建一个会员
    const existingMember = {
      name: 'duplicate_test',
      email: 'duplicate.test@example.com',
      is_new_member: true
    };
    
    await supabase
      .from('members')
      .insert(existingMember);
      
    console.log('已创建现有会员:', existingMember);
    
    // 尝试使用相同名称注册
    const formData = {
      name: existingMember.name,
      email: 'another.email@example.com',
      classType: 'morning'
    };
    
    console.log('尝试重复注册:', formData);
    
    // 执行签到
    let checkInResult;
    await act(async () => {
      checkInResult = await result.current.submitNewMemberCheckIn(formData);
    });
    
    console.log('签到结果:', checkInResult);
    
    // 验证被拒绝
    expect(checkInResult.success).toBe(false);
    expect(checkInResult.existingMember).toBe(true);
    
    console.log('=== 重复会员名称测试完成 ===');
  });

  // 测试3: 无效的输入数据
  it('无效的输入数据应该被拒绝', async () => {
    console.log('=== 开始测试无效输入 ===');
    
    const { result } = renderHook(() => useNewMemberCheckIn());
    
    // 测试空名称
    const emptyNameForm = {
      name: '',
      email: 'test@example.com',
      classType: 'morning'
    };
    
    console.log('尝试空名称注册:', emptyNameForm);
    
    let checkInResult;
    await act(async () => {
      checkInResult = await result.current.submitNewMemberCheckIn(emptyNameForm);
    });
    
    console.log('空名称注册结果:', checkInResult);
    
    expect(checkInResult.success).toBe(false);
    
    // 测试无效邮箱
    const invalidEmailForm = {
      name: 'test_name',
      email: 'invalid-email',
      classType: 'morning'
    };
    
    console.log('尝试无效邮箱注册:', invalidEmailForm);
    
    await act(async () => {
      checkInResult = await result.current.submitNewMemberCheckIn(invalidEmailForm);
    });
    
    console.log('无效邮箱注册结果:', checkInResult);
    
    expect(checkInResult.success).toBe(false);
    
    console.log('=== 无效输入测试完成 ===');
  });
}); 