-- 会员生命周期测试
BEGIN;

-- 清理测试数据
DELETE FROM check_ins WHERE member_id = '88888888-8888-8888-8888-888888888888';
DELETE FROM membership_cards WHERE member_id = '88888888-8888-8888-8888-888888888888';
DELETE FROM members WHERE id = '88888888-8888-8888-8888-888888888888' OR email = 'lifecycle@test.com';

-- 测试用例41：新会员首次签到（自动建档）
SELECT '测试用例41：新会员首次签到（自动建档）' AS test_case;
SELECT handle_check_in(
  '88888888-8888-8888-8888-888888888888',  -- 会员ID
  '测试生命周期会员',                      -- 姓名
  'lifecycle@test.com',                   -- 邮箱
  NULL,                                   -- 会员卡ID（新会员没有卡）
  'morning',                              -- 课程类型
  CURRENT_DATE,                           -- 签到日期
  '09:00-10:30'                           -- 时间段
);

-- 验证新会员创建和额外签到记录
SELECT 
  m.id,
  m.name,
  m.email,
  m.is_new_member,
  m.extra_check_ins,
  c.check_in_date,
  c.time_slot,
  c.is_extra
FROM members m
JOIN check_ins c ON m.id = c.member_id
WHERE m.id = '88888888-8888-8888-8888-888888888888';

-- 测试用例42：将新会员标记为老会员
SELECT '测试用例42：将新会员标记为老会员' AS test_case;
UPDATE members
SET is_new_member = false
WHERE id = '88888888-8888-8888-8888-888888888888';

-- 验证会员状态更新
SELECT 
  id,
  name,
  email,
  is_new_member
FROM members
WHERE id = '88888888-8888-8888-8888-888888888888';

-- 测试用例43：老会员无有效会员卡签到
SELECT '测试用例43：老会员无有效会员卡签到' AS test_case;
SELECT handle_check_in(
  '88888888-8888-8888-8888-888888888888',  -- 会员ID
  '测试生命周期会员',                      -- 姓名
  'lifecycle@test.com',                   -- 邮箱
  NULL,                                   -- 会员卡ID（没有卡）
  'evening',                              -- 课程类型
  CURRENT_DATE,                           -- 签到日期
  '17:00-18:30'                           -- 时间段
);

-- 验证额外签到记录
SELECT 
  m.name,
  c.check_in_date,
  c.time_slot,
  c.is_extra,
  m.extra_check_ins
FROM members m
JOIN check_ins c ON m.id = c.member_id
WHERE m.id = '88888888-8888-8888-8888-888888888888'
ORDER BY c.check_in_date, c.time_slot;

-- 测试用例44：为老会员创建会员卡
SELECT '测试用例44：为老会员创建会员卡' AS test_case;
INSERT INTO membership_cards (
  id,
  member_id,
  card_type,
  card_category,
  card_subtype,
  remaining_group_sessions,
  valid_until,
  created_at
)
VALUES (
  '87654321-4321-4321-4321-cba987654321',
  '88888888-8888-8888-8888-888888888888',
  'group',
  'session',
  '10_sessions',
  10,
  CURRENT_DATE + INTERVAL '3 months',
  NOW()
);

-- 验证会员卡创建
SELECT 
  id,
  card_type,
  card_category,
  card_subtype,
  remaining_group_sessions,
  valid_until
FROM membership_cards
WHERE member_id = '88888888-8888-8888-8888-888888888888';

-- 测试用例45：老会员有会员卡后签到
SELECT '测试用例45：老会员有会员卡后签到' AS test_case;
SELECT handle_check_in(
  '88888888-8888-8888-8888-888888888888',  -- 会员ID
  '测试生命周期会员',                      -- 姓名
  'lifecycle@test.com',                   -- 邮箱
  '87654321-4321-4321-4321-cba987654321',  -- 会员卡ID
  'morning',                              -- 课程类型
  CURRENT_DATE + 1,                       -- 签到日期（明天）
  '09:00-10:30'                           -- 时间段
);

-- 验证正常签到记录和会员卡课时扣减
SELECT 
  c.check_in_date,
  c.time_slot,
  c.is_extra,
  mc.remaining_group_sessions
FROM check_ins c
JOIN members m ON c.member_id = m.id
JOIN membership_cards mc ON mc.id = '87654321-4321-4321-4321-cba987654321'
WHERE m.id = '88888888-8888-8888-8888-888888888888'
  AND c.check_in_date = CURRENT_DATE + 1;

-- 测试用例46：模拟会员卡过期
SELECT '测试用例46：模拟会员卡过期' AS test_case;
UPDATE membership_cards
SET valid_until = CURRENT_DATE - INTERVAL '1 day'
WHERE id = '87654321-4321-4321-4321-cba987654321';

-- 验证会员卡状态
SELECT 
  id,
  card_type,
  valid_until,
  CASE 
    WHEN valid_until < CURRENT_DATE THEN '已过期'
    ELSE '有效'
  END AS status
FROM membership_cards
WHERE id = '87654321-4321-4321-4321-cba987654321';

-- 测试用例47：会员卡过期后签到
SELECT '测试用例47：会员卡过期后签到' AS test_case;
SELECT handle_check_in(
  '88888888-8888-8888-8888-888888888888',  -- 会员ID
  '测试生命周期会员',                      -- 姓名
  'lifecycle@test.com',                   -- 邮箱
  '87654321-4321-4321-4321-cba987654321',  -- 过期会员卡ID
  'evening',                              -- 课程类型
  CURRENT_DATE + 2,                       -- 签到日期（后天）
  '17:00-18:30'                           -- 时间段
);

-- 验证额外签到记录
SELECT 
  c.check_in_date,
  c.time_slot,
  c.is_extra,
  m.extra_check_ins
FROM check_ins c
JOIN members m ON c.member_id = m.id
WHERE m.id = '88888888-8888-8888-8888-888888888888'
  AND c.check_in_date = CURRENT_DATE + 2;

-- 测试用例48：会员卡续费（延长有效期）
SELECT '测试用例48：会员卡续费（延长有效期）' AS test_case;
UPDATE membership_cards
SET 
  valid_until = CURRENT_DATE + INTERVAL '3 months',
  remaining_group_sessions = 10  -- 重置课时
WHERE id = '87654321-4321-4321-4321-cba987654321';

-- 验证会员卡状态更新
SELECT 
  id,
  card_type,
  remaining_group_sessions,
  valid_until,
  CASE 
    WHEN valid_until < CURRENT_DATE THEN '已过期'
    ELSE '有效'
  END AS status
FROM membership_cards
WHERE id = '87654321-4321-4321-4321-cba987654321';

-- 测试用例49：会员卡续费后签到
SELECT '测试用例49：会员卡续费后签到' AS test_case;
SELECT handle_check_in(
  '88888888-8888-8888-8888-888888888888',  -- 会员ID
  '测试生命周期会员',                      -- 姓名
  'lifecycle@test.com',                   -- 邮箱
  '87654321-4321-4321-4321-cba987654321',  -- 续费后的会员卡ID
  'morning',                              -- 课程类型
  CURRENT_DATE + 3,                       -- 签到日期（三天后）
  '09:00-10:30'                           -- 时间段
);

-- 验证正常签到记录和会员卡课时扣减
SELECT 
  c.check_in_date,
  c.time_slot,
  c.is_extra,
  mc.remaining_group_sessions
FROM check_ins c
JOIN members m ON c.member_id = m.id
JOIN membership_cards mc ON mc.id = '87654321-4321-4321-4321-cba987654321'
WHERE m.id = '88888888-8888-8888-8888-888888888888'
  AND c.check_in_date = CURRENT_DATE + 3;

-- 测试用例50：会员生命周期完整签到记录查询
SELECT '测试用例50：会员生命周期完整签到记录查询' AS test_case;
SELECT 
  c.check_in_date,
  c.time_slot,
  c.class_type,
  c.is_extra,
  c.card_id,
  CASE 
    WHEN c.card_id IS NOT NULL THEN '使用会员卡'
    WHEN c.is_extra THEN '额外签到'
    ELSE '未知'
  END AS check_in_type
FROM check_ins c
WHERE c.member_id = '88888888-8888-8888-8888-888888888888'
ORDER BY c.check_in_date, c.time_slot;

COMMIT; 