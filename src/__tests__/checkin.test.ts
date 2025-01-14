import { describe, it, expect, beforeEach } from 'vitest'
import { supabase } from '../lib/supabase'

describe('签到功能测试', () => {
  // 在每个测试前清理测试数据
  beforeEach(async () => {
    try {
      // 清理测试签到记录
      const { error: cleanCheckinsError } = await supabase
        .from('check_ins')
        .delete()
        .like('member_id', 'test_%')
      
      if (cleanCheckinsError) {
        console.error('清理签到记录失败:', cleanCheckinsError)
      }
      
      // 清理测试会员
      const { error: cleanMembersError } = await supabase
        .from('members')
        .delete()
        .like('name', 'test_%')

      if (cleanMembersError) {
        console.error('清理会员记录失败:', cleanMembersError)
      }
    } catch (error) {
      console.error('清理测试数据失败:', error)
      throw error
    }
  })

  // 测试1: 新会员首次签到
  it('新会员首次签到应为额外签到', async () => {
    try {
      // 创建新会员
      const { data: member, error: memberError } = await supabase
        .from('members')
        .insert({
          name: `test_member_${Date.now()}`,
          email: `test_${Date.now()}@example.com`,
          is_new_member: true
        })
        .select()
        .single()

      if (memberError) {
        console.error('创建会员失败:', memberError)
        throw memberError
      }

      if (!member) {
        throw new Error('创建会员失败: 没有返回数据')
      }

      console.log('创建的新会员:', member)

      // 执行签到
      const { data: checkin, error: checkinError } = await supabase
        .from('check_ins')
        .insert({
          member_id: member.id,
          class_type: 'morning',
          check_in_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single()

      if (checkinError) {
        console.error('签到失败:', checkinError)
        throw checkinError
      }

      if (!checkin) {
        throw new Error('签到失败: 没有返回数据')
      }

      console.log('新会员签到结果:', checkin)

      // 验证是额外签到
      expect(checkin.is_extra).toBe(true)
    } catch (error) {
      console.error('测试失败:', error)
      throw error
    }
  })

  // 测试2: 月卡会员签到
  it('单次月卡会员每天应只能正常签到一次', async () => {
    try {
      // 创建月卡会员
      const { data: member, error: memberError } = await supabase
        .from('members')
        .insert({
          name: `test_monthly_${Date.now()}`,
          email: `test_monthly_${Date.now()}@example.com`,
          membership: 'single_monthly',
          membership_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          is_new_member: false
        })
        .select()
        .single()

      if (memberError) {
        console.error('创建会员失败:', memberError)
        throw memberError
      }

      if (!member) {
        throw new Error('创建会员失败: 没有返回数据')
      }

      console.log('创建的月卡会员:', member)

      // 第一次签到
      const { data: firstCheckin, error: firstCheckinError } = await supabase
        .from('check_ins')
        .insert({
          member_id: member.id,
          class_type: 'morning',
          check_in_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single()

      if (firstCheckinError) {
        console.error('第一次签到失败:', firstCheckinError)
        throw firstCheckinError
      }

      if (!firstCheckin) {
        throw new Error('第一次签到失败: 没有返回数据')
      }

      console.log('月卡会员第一次签到结果:', firstCheckin)

      // 验证第一次是正常签到
      expect(firstCheckin.is_extra).toBe(false)

      // 第二次签到
      const { data: secondCheckin, error: secondCheckinError } = await supabase
        .from('check_ins')
        .insert({
          member_id: member.id,
          class_type: 'evening',
          check_in_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single()

      if (secondCheckinError) {
        console.error('第二次签到失败:', secondCheckinError)
        throw secondCheckinError
      }

      if (!secondCheckin) {
        throw new Error('第二次签到失败: 没有返回数据')
      }

      console.log('月卡会员第二次签到结果:', secondCheckin)

      // 验证第二次是额外签到
      expect(secondCheckin.is_extra).toBe(true)
    } catch (error) {
      console.error('测试失败:', error)
      throw error
    }
  })

  // 测试3: 次卡会员签到
  it('次卡会员用完次数后应为额外签到', async () => {
    try {
      // 创建单次卡会员
      const { data: member, error: memberError } = await supabase
        .from('members')
        .insert({
          name: `test_single_${Date.now()}`,
          email: `test_single_${Date.now()}@example.com`,
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

      if (!member) {
        throw new Error('创建会员失败: 没有返回数据')
      }

      console.log('创建的次卡会员:', member)

      // 第一次签到
      const { data: firstCheckin, error: firstCheckinError } = await supabase
        .from('check_ins')
        .insert({
          member_id: member.id,
          class_type: 'morning',
          check_in_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single()

      if (firstCheckinError) {
        console.error('第一次签到失败:', firstCheckinError)
        throw firstCheckinError
      }

      if (!firstCheckin) {
        throw new Error('第一次签到失败: 没有返回数据')
      }

      console.log('次卡会员第一次签到结果:', firstCheckin)

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

      if (!updatedMember) {
        throw new Error('获取会员信息失败: 没有返回数据')
      }

      console.log('次卡会员第一次签到后状态:', updatedMember)

      expect(updatedMember.remaining_classes).toBe(0)

      // 第二次签到
      const { data: secondCheckin, error: secondCheckinError } = await supabase
        .from('check_ins')
        .insert({
          member_id: member.id,
          class_type: 'evening',
          check_in_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single()

      if (secondCheckinError) {
        console.error('第二次签到失败:', secondCheckinError)
        throw secondCheckinError
      }

      if (!secondCheckin) {
        throw new Error('第二次签到失败: 没有返回数据')
      }

      console.log('次卡会员第二次签到结果:', secondCheckin)

      // 验证第二次是额外签到
      expect(secondCheckin.is_extra).toBe(true)
    } catch (error) {
      console.error('测试失败:', error)
      throw error
    }
  })
}) 