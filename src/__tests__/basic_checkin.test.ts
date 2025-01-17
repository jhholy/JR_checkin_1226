import { describe, it, expect, beforeEach, vi } from 'vitest'
import { supabase } from '../lib/supabase'

// 设置测试日期
const TEST_DATE = '2025-01-15'

// 设置更长的超时时间
vi.setConfig({ testTimeout: 30000 })

// 定义会员卡类型接口
interface MembershipType {
  type: string
  expiry?: string
  classes?: number
}

// 测试工具类
class TestManager {
  generateTestName(prefix: string) {
    return `${prefix}_${Date.now()}`
  }

  generateRandomDate(start: Date, end: Date) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  }

  // 获取下一个工作日(周一到周六)
  getNextWorkday() {
    return TEST_DATE
  }

  async createMember(data: {
    name?: string,
    membership?: string,
    remaining_classes?: number,
    membership_expiry?: string,
    is_new_member?: boolean
  }) {
    const { data: member, error } = await supabase
      .from('members')
      .insert({
        name: data.name || this.generateTestName('test_member'),
        email: `${this.generateTestName('email')}@example.com`,
        membership: data.membership,
        remaining_classes: data.remaining_classes,
        membership_expiry: data.membership_expiry,
        is_new_member: data.is_new_member ?? false
      })
      .select()
      .single()

    if (error) throw error
    return member
  }

  async createCheckin(data: {
    member_id: string,
    class_type: string,
    check_in_date?: string
  }) {
    const { data: checkin, error } = await supabase
      .from('check_ins')
      .insert({
        member_id: data.member_id,
        class_type: data.class_type,
        check_in_date: data.check_in_date || new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (error) {
      console.error('签到失败:', error)
      throw new Error(error.message)
    }
    return checkin
  }

  async getMember(memberId: string) {
    const { data: member, error } = await supabase
      .from('members')
      .select()
      .eq('id', memberId)
      .single()

    if (error) throw error
    return member
  }

  async getCheckins(memberId: string, date: string) {
    const { data: checkins, error } = await supabase
      .from('check_ins')
      .select()
      .eq('member_id', memberId)
      .eq('check_in_date', date)

    if (error) throw error
    return checkins
  }
}

describe('基本签到场景测试', () => {
  const testManager = new TestManager()

  // 在每个测试前清理测试数据
  beforeEach(async () => {
    // 先获取测试会员
    const { data: testMembers } = await supabase
      .from('members')
      .select('id')
      .ilike('name', 'test_%')

    if (testMembers && testMembers.length > 0) {
      const memberIds = testMembers.map(m => m.id)
      
      // 清理签到记录
      const { error: cleanCheckinsError } = await supabase
        .from('check_ins')
        .delete()
        .in('member_id', memberIds)
      
      if (cleanCheckinsError) throw cleanCheckinsError
      
      // 清理会员记录
      const { error: cleanMembersError } = await supabase
        .from('members')
        .delete()
        .in('id', memberIds)

      if (cleanMembersError) throw cleanMembersError
    }
  })

  // 测试1: 各类型会员卡首次签到
  it('各类型会员卡首次签到应符合对应规则', async () => {
    try {
      console.log('=== 开始各类型会员卡首次签到测试 ===')
      
      const membershipTypes: MembershipType[] = [
        { 
          type: 'single_monthly', 
          expiry: new Date(TEST_DATE).toISOString() 
        },
        { 
          type: 'double_monthly', 
          expiry: new Date(TEST_DATE).toISOString()
        },
        { type: 'ten_classes', classes: 10 },
        { type: 'two_classes', classes: 2 },
        { type: 'single_class', classes: 1 }
      ]

      for (const membership of membershipTypes) {
        console.log(`测试会员卡类型: ${membership.type}`)
        
        const member = await testManager.createMember({
          name: testManager.generateTestName(`test_${membership.type}`),
          membership: membership.type,
          membership_expiry: membership.expiry,
          remaining_classes: membership.classes
        })

        const checkin = await testManager.createCheckin({
          member_id: member.id,
          class_type: 'morning',
          check_in_date: TEST_DATE
        })

        expect(checkin.is_extra).toBe(false)
        console.log(`${membership.type} 首次签到验证成功`)

        // 验证会员信息更新
        if (membership.type.includes('class') && membership.classes !== undefined) {
          const finalMember = await testManager.getMember(member.id)
          expect(finalMember.remaining_classes).toBe(membership.classes - 1)
          console.log(`${membership.type} 剩余课时更新验证成功`)
        }
      }
      
      console.log('=== 各类型会员卡首次签到测试完成 ===')
    } catch (error) {
      console.error('测试失败:', error)
      throw error
    }
  })

  // 测试2: 重复签到场景
  it('同一时段重复签到应被拒绝，不同时段应遵循会员卡规则', async () => {
    try {
      console.log('=== 开始重复签到测试 ===')
      
      // 创建单次月卡会员
      const member = await testManager.createMember({
        membership: 'single_monthly',
        membership_expiry: new Date(TEST_DATE).toISOString()
      })

      // 第一次早课签到
      console.log('尝试第一次早课签到')
      const firstCheckin = await testManager.createCheckin({
        member_id: member.id,
        class_type: 'morning',
        check_in_date: TEST_DATE
      })
      expect(firstCheckin.is_extra).toBe(false)
      console.log('第一次早课签到成功')

      // 尝试重复早课签到
      console.log('尝试重复早课签到')
      try {
        await testManager.createCheckin({
          member_id: member.id,
          class_type: 'morning',
          check_in_date: TEST_DATE
        })
        throw new Error('重复签到应该被拒绝')
      } catch (error: any) {
        expect(error.message).toContain('您今天已在该时段签到')
        console.log('重复签到被正确拒绝')
      }

      // 晚课签到(超出单次月卡限制)
      console.log('尝试晚课签到（超出限制）')
      const eveningCheckin = await testManager.createCheckin({
        member_id: member.id,
        class_type: 'evening',
        check_in_date: TEST_DATE
      })
      expect(eveningCheckin.is_extra).toBe(true)
      console.log('超出限制的晚课签到被正确标记为额外签到')

      // 验证签到记录
      const checkins = await testManager.getCheckins(member.id, TEST_DATE)
      expect(checkins.length).toBe(2)
      console.log('签到记录数量验证成功')
      
      console.log('=== 重复签到测试完成 ===')
    } catch (error) {
      console.error('测试失败:', error)
      throw error
    }
  })

  // 测试3: 额外签到场景
  it('无效会员卡和超出限制的签到应为额外签到', async () => {
    try {
      console.log('=== 开始额外签到场景测试 ===')
      
      // 新会员签到
      console.log('测试新会员签到')
      const newMember = await testManager.createMember({
        is_new_member: true
      })
      const newMemberCheckin = await testManager.createCheckin({
        member_id: newMember.id,
        class_type: 'morning',
        check_in_date: TEST_DATE
      })
      expect(newMemberCheckin.is_extra).toBe(true)
      console.log('新会员签到被正确标记为额外签到')

      // 验证新会员状态更新
      const updatedNewMember = await testManager.getMember(newMember.id)
      expect(updatedNewMember.is_new_member).toBe(false)
      console.log('新会员状态更新验证成功')

      // 过期月卡会员签到
      console.log('测试过期月卡会员签到')
      const expiredDate = new Date(TEST_DATE)
      expiredDate.setDate(expiredDate.getDate() - 1)
      const expiredMember = await testManager.createMember({
        membership: 'single_monthly',
        membership_expiry: expiredDate.toISOString()
      })
      const expiredCheckin = await testManager.createCheckin({
        member_id: expiredMember.id,
        class_type: 'morning',
        check_in_date: TEST_DATE
      })
      expect(expiredCheckin.is_extra).toBe(true)
      console.log('过期月卡会员签到被正确标记为额外签到')

      // 次数用完的课时卡会员签到
      console.log('测试次数用完的课时卡会员签到')
      const noClassesMember = await testManager.createMember({
        membership: 'ten_classes',
        remaining_classes: 0
      })
      const noClassesCheckin = await testManager.createCheckin({
        member_id: noClassesMember.id,
        class_type: 'morning',
        check_in_date: TEST_DATE
      })
      expect(noClassesCheckin.is_extra).toBe(true)
      console.log('次数用完的课时卡会员签到被正确标记为额外签到')

      // 验证额外签到计数
      const updatedNoClassesMember = await testManager.getMember(noClassesMember.id)
      expect(updatedNoClassesMember.extra_check_ins).toBe(1)
      console.log('额外签到计数验证成功')
      
      console.log('=== 额外签到场景测试完成 ===')
    } catch (error) {
      console.error('测试失败:', error)
      throw error
    }
  })

  // 测试4: 会员卡有效期验证
  it('过期会员卡签到应为额外签到', async () => {
    try {
      console.log('=== 开始会员卡有效期测试 ===')
      
      // 创建过期会员卡（1天前过期）
      const expiredDate = new Date(TEST_DATE)
      expiredDate.setDate(expiredDate.getDate() - 1)
      const expiredMember = await testManager.createMember({
        membership: 'single_monthly',
        membership_expiry: expiredDate.toISOString()
      })

      // 签到应该为额外签到
      const checkin = await testManager.createCheckin({
        member_id: expiredMember.id,
        class_type: 'morning',
        check_in_date: TEST_DATE
      })
      expect(checkin.is_extra).toBe(true)
      console.log('过期会员卡签到被正确标记为额外签到')
      
      console.log('=== 会员卡有效期测试完成 ===')
    } catch (error) {
      console.error('测试失败:', error)
      throw error
    }
  })
}) 