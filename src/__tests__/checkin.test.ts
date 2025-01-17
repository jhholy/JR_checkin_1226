import { describe, it, expect, beforeEach, vi } from 'vitest'
import { supabase } from '../lib/supabase'

// 使用固定的测试日期
const TEST_DATE = '2025-01-15'

describe('签到功能测试', () => {
  // 设置更长的超时时间
  beforeEach(async () => {
    // 设置30秒超时
    vi.setConfig({ testTimeout: 30000 })
    
    try {
      console.log('开始清理测试数据...')
      
      // 清理测试签到记录
      const { error: cleanCheckinsError } = await supabase
        .from('check_ins')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')  // 删除所有记录
      
      if (cleanCheckinsError) {
        console.error('清理签到记录失败:', cleanCheckinsError)
        throw cleanCheckinsError
      }
      
      // 清理测试会员
      const { error: cleanMembersError } = await supabase
        .from('members')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')  // 删除所有记录

      if (cleanMembersError) {
        console.error('清理会员记录失败:', cleanMembersError)
        throw cleanMembersError
      }

      console.log('测试数据清理完成')

      // 验证清理结果
      const { data: remainingCheckins } = await supabase
        .from('check_ins')
        .select('*')
      console.log('剩余签到记录数:', remainingCheckins?.length || 0)

      const { data: remainingMembers } = await supabase
        .from('members')
        .select('*')
      console.log('剩余会员数:', remainingMembers?.length || 0)

    } catch (error) {
      console.error('清理测试数据失败:', error)
      throw error
    }
  })

  // 测试1: 新会员首次签到
  it('新会员首次签到应为额外签到', async () => {
    try {
      console.log('=== 开始新会员首次签到测试 ===')
      
      // 创建新会员
      const { data: member, error: memberError } = await supabase
        .from('members')
        .insert({
          name: `test_member_${TEST_DATE}`,
          email: `test.checkin.${TEST_DATE}@example.com`,
          is_new_member: true
        })
        .select()
        .single()

      if (memberError) {
        console.error('创建会员失败:', memberError)
        throw memberError
      }

      console.log('创建的新会员:', JSON.stringify(member, null, 2))

      // 执行签到
      const { data: checkin, error: checkinError } = await supabase
        .from('check_ins')
        .insert({
          member_id: member.id,
          class_type: 'morning',
          check_in_date: TEST_DATE
        })
        .select()
        .single()

      if (checkinError) {
        console.error('签到失败:', checkinError)
        throw checkinError
      }

      console.log('新会员签到结果:', JSON.stringify(checkin, null, 2))

      // 获取完整的签到记录
      const { data: fullCheckin } = await supabase
        .from('check_ins')
        .select('*, members(*)')
        .eq('id', checkin.id)
        .single()
        
      console.log('完整签到记录:', JSON.stringify(fullCheckin, null, 2))

      // 验证是额外签到
      expect(checkin.is_extra).toBe(true)
      
      console.log('=== 新会员首次签到测试完成 ===')
    } catch (error) {
      console.error('测试失败:', error)
      throw error
    }
  })

  // 测试2: 月卡会员签到
  it('单次月卡会员每天应只能正常签到一次', async () => {
    try {
      console.log('=== 开始月卡会员签到测试 ===')
      
      // 创建月卡会员
      const membershipExpiry = new Date(TEST_DATE)
      membershipExpiry.setMonth(membershipExpiry.getMonth() + 1)
      
      const { data: member, error: memberError } = await supabase
        .from('members')
        .insert({
          name: `test_monthly_${TEST_DATE}`,
          email: `test_monthly_${TEST_DATE}@example.com`,
          membership: 'single_monthly',
          membership_expiry: membershipExpiry.toISOString(),
          is_new_member: false
        })
        .select()
        .single()

      if (memberError) {
        console.error('创建会员失败:', memberError)
        throw memberError
      }

      console.log('创建的月卡会员:', JSON.stringify(member, null, 2))

      // 第一次签到
      const { data: firstCheckin, error: firstCheckinError } = await supabase
        .from('check_ins')
        .insert({
          member_id: member.id,
          class_type: 'morning',
          check_in_date: TEST_DATE
        })
        .select()
        .single()

      if (firstCheckinError) {
        console.error('第一次签到失败:', firstCheckinError)
        throw firstCheckinError
      }

      console.log('月卡会员第一次签到结果:', JSON.stringify(firstCheckin, null, 2))

      // 获取完整的第一次签到记录
      const { data: fullFirstCheckin } = await supabase
        .from('check_ins')
        .select('*, members(*)')
        .eq('id', firstCheckin.id)
        .single()
        
      console.log('完整第一次签到记录:', JSON.stringify(fullFirstCheckin, null, 2))

      // 验证第一次是正常签到
      expect(firstCheckin.is_extra).toBe(false)

      // 第二次签到
      const { data: secondCheckin, error: secondCheckinError } = await supabase
        .from('check_ins')
        .insert({
          member_id: member.id,
          class_type: 'evening',
          check_in_date: TEST_DATE
        })
        .select()
        .single()

      if (secondCheckinError) {
        console.error('第二次签到失败:', secondCheckinError)
        throw secondCheckinError
      }

      console.log('月卡会员第二次签到结果:', JSON.stringify(secondCheckin, null, 2))

      // 获取完整的第二次签到记录
      const { data: fullSecondCheckin } = await supabase
        .from('check_ins')
        .select('*, members(*)')
        .eq('id', secondCheckin.id)
        .single()
        
      console.log('完整第二次签到记录:', JSON.stringify(fullSecondCheckin, null, 2))

      // 验证第二次是额外签到
      expect(secondCheckin.is_extra).toBe(true)
      
      console.log('=== 月卡会员签到测试完成 ===')
    } catch (error) {
      console.error('测试失败:', error)
      throw error
    }
  })

  // 测试3: 次卡会员签到
  it('次卡会员用完次数后应为额外签到', async () => {
    try {
      console.log('=== 开始次卡会员签到测试 ===')
      
      // 创建单次卡会员
      const { data: member, error: memberError } = await supabase
        .from('members')
        .insert({
          name: `test_single_${TEST_DATE}`,
          email: `test_single_${TEST_DATE}@example.com`,
          membership: 'single_class',
          remaining_classes: 1,
          is_new_member: false
        })
        .select()
        .single()

      if (memberError) {
        console.error('创建会员失败:', memberError)
        throw memberError
      }

      console.log('创建的次卡会员:', JSON.stringify(member, null, 2))

      // 第一次签到
      const { data: firstCheckin, error: firstCheckinError } = await supabase
        .from('check_ins')
        .insert({
          member_id: member.id,
          class_type: 'morning',
          check_in_date: TEST_DATE
        })
        .select()
        .single()

      if (firstCheckinError) {
        console.error('第一次签到失败:', firstCheckinError)
        throw firstCheckinError
      }

      console.log('次卡会员第一次签到结果:', JSON.stringify(firstCheckin, null, 2))

      // 获取完整的第一次签到记录
      const { data: fullFirstCheckin } = await supabase
        .from('check_ins')
        .select('*, members(*)')
        .eq('id', firstCheckin.id)
        .single()
        
      console.log('完整第一次签到记录:', JSON.stringify(fullFirstCheckin, null, 2))

      // 验证第一次是正常签到
      expect(firstCheckin.is_extra).toBe(false)

      // 验证剩余次数已扣减
      const { data: updatedMember, error: getMemberError } = await supabase
        .from('members')
        .select()
        .eq('id', member.id)
        .single()

      if (getMemberError) {
        console.error('获取会员信息失败:', getMemberError)
        throw getMemberError
      }

      console.log('次卡会员第一次签到后状态:', JSON.stringify(updatedMember, null, 2))

      expect(updatedMember.remaining_classes).toBe(0)

      // 第二次签到
      const { data: secondCheckin, error: secondCheckinError } = await supabase
        .from('check_ins')
        .insert({
          member_id: member.id,
          class_type: 'evening',
          check_in_date: TEST_DATE
        })
        .select()
        .single()

      if (secondCheckinError) {
        console.error('第二次签到失败:', secondCheckinError)
        throw secondCheckinError
      }

      console.log('次卡会员第二次签到结果:', JSON.stringify(secondCheckin, null, 2))

      // 获取完整的第二次签到记录
      const { data: fullSecondCheckin } = await supabase
        .from('check_ins')
        .select('*, members(*)')
        .eq('id', secondCheckin.id)
        .single()
        
      console.log('完整第二次签到记录:', JSON.stringify(fullSecondCheckin, null, 2))

      // 验证第二次是额外签到
      expect(secondCheckin.is_extra).toBe(true)
      
      console.log('=== 次卡会员签到测试完成 ===')
    } catch (error) {
      console.error('测试失败:', error)
      throw error
    }
  })
}) 