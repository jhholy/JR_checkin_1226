-- 测试数据准备
BEGIN;

-- 清理测试数据
DELETE FROM check_ins WHERE member_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);

DELETE FROM membership_cards WHERE member_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);

DELETE FROM members WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);

-- 创建测试会员
INSERT INTO members (id, name, email, is_new_member, extra_check_ins)
VALUES
  ('11111111-1111-1111-1111-111111111111', '测试新会员', 'new@test.com', false, 0),
  ('22222222-2222-2222-2222-222222222222', '测试老会员', 'old@test.com', false, 0),
  ('33333333-3333-3333-3333-333333333333', '测试额外签到会员', 'extra@test.com', false, 0);

-- 创建测试会员卡
-- 1. 有效的团课课时卡（10次卡）
INSERT INTO membership_cards (
  id, member_id, card_type, card_category, card_subtype,
  remaining_group_sessions, valid_until
)
VALUES (
  '11111111-2222-3333-4444-555555555555',
  '22222222-2222-2222-2222-222222222222',
  'group', 'session', '10_sessions',
  10, CURRENT_DATE + INTERVAL '3 months'
);

-- 2. 有效的团课月卡（单次月卡）
INSERT INTO membership_cards (
  id, member_id, card_type, card_category, card_subtype,
  valid_until
)
VALUES (
  '22222222-3333-4444-5555-666666666666',
  '22222222-2222-2222-2222-222222222222',
  'group', 'monthly', 'single_monthly',
  CURRENT_DATE + INTERVAL '30 days'
);

-- 3. 有效的私教课时卡（10次卡）
INSERT INTO membership_cards (
  id, member_id, card_type, card_category, card_subtype,
  remaining_private_sessions, trainer_type, valid_until
)
VALUES (
  '33333333-4444-5555-6666-777777777777',
  '22222222-2222-2222-2222-222222222222',
  'private', 'session', '10_sessions',
  10, 'senior', CURRENT_DATE + INTERVAL '1 month'
);

-- 4. 过期的团课课时卡
INSERT INTO membership_cards (
  id, member_id, card_type, card_category, card_subtype,
  remaining_group_sessions, valid_until
)
VALUES (
  '44444444-5555-6666-7777-888888888888',
  '33333333-3333-3333-3333-333333333333',
  'group', 'session', '10_sessions',
  5, CURRENT_DATE - INTERVAL '1 day'
);

-- 5. 课时用完的私教卡
INSERT INTO membership_cards (
  id, member_id, card_type, card_category, card_subtype,
  remaining_private_sessions, trainer_type, valid_until
)
VALUES (
  '55555555-6666-7777-8888-999999999999',
  '33333333-3333-3333-3333-333333333333',
  'private', 'session', '10_sessions',
  0, 'senior', CURRENT_DATE + INTERVAL '1 month'
);

-- 创建测试教练
INSERT INTO trainers (id, name, type)
VALUES
  ('99999999-8888-7777-6666-555555555555', 'JR', 'jr'),
  ('88888888-7777-6666-5555-444444444444', 'Da', 'senior');

COMMIT;

-- 测试用例1：新会员首次签到
SELECT 'Test Case 1: New Member First Check-in' AS test_case;
SELECT handle_check_in(
  '11111111-1111-1111-1111-111111111111',  -- 会员ID
  '测试新会员',                            -- 姓名
  'new@test.com',                         -- 邮箱
  NULL,                                   -- 会员卡ID（新会员没有卡）
  'morning',                              -- 课程类型
  CURRENT_DATE,                           -- 签到日期
  '9:00-10:30'                            -- 时间段
);

-- 测试用例2：老会员团课签到（课时卡）
SELECT 'Test Case 2: Existing Member Group Class Check-in (Session Card)' AS test_case;
SELECT handle_check_in(
  '22222222-2222-2222-2222-222222222222',  -- 会员ID
  '测试老会员',                            -- 姓名
  'old@test.com',                         -- 邮箱
  '11111111-2222-3333-4444-555555555555',  -- 团课课时卡ID
  'morning',                              -- 课程类型
  CURRENT_DATE,                           -- 签到日期
  '9:00-10:30'                            -- 时间段
);

-- 测试用例3：老会员团课签到（月卡）
SELECT 'Test Case 3: Existing Member Group Class Check-in (Monthly Card)' AS test_case;
SELECT handle_check_in(
  '22222222-2222-2222-2222-222222222222',  -- 会员ID
  '测试老会员',                            -- 姓名
  'old@test.com',                         -- 邮箱
  '22222222-3333-4444-5555-666666666666',  -- 团课月卡ID
  'evening',                              -- 课程类型
  CURRENT_DATE,                           -- 签到日期
  '17:00-18:30'                           -- 时间段
);

-- 测试用例4：老会员私教签到（1对1）
SELECT 'Test Case 4: Existing Member Private Class Check-in (1-on-1)' AS test_case;
SELECT handle_check_in(
  '22222222-2222-2222-2222-222222222222',  -- 会员ID
  '测试老会员',                            -- 姓名
  'old@test.com',                         -- 邮箱
  '33333333-4444-5555-6666-777777777777',  -- 私教卡ID
  'private',                              -- 课程类型
  CURRENT_DATE,                           -- 签到日期
  '14:00-15:00',                          -- 时间段
  '88888888-7777-6666-5555-444444444444',  -- 教练ID
  false                                   -- 是否1对2
);

-- 测试用例5：老会员私教签到（1对2）
SELECT 'Test Case 5: Existing Member Private Class Check-in (1-on-2)' AS test_case;
SELECT handle_check_in(
  '22222222-2222-2222-2222-222222222222',  -- 会员ID
  '测试老会员',                            -- 姓名
  'old@test.com',                         -- 邮箱
  '33333333-4444-5555-6666-777777777777',  -- 私教卡ID
  'private',                              -- 课程类型
  CURRENT_DATE,                           -- 签到日期
  '15:00-16:00',                          -- 时间段
  '88888888-7777-6666-5555-444444444444',  -- 教练ID
  true                                    -- 是否1对2
);

-- 测试用例6：老会员额外签到（会员卡过期）
SELECT 'Test Case 6: Existing Member Extra Check-in (Expired Card)' AS test_case;
SELECT handle_check_in(
  '33333333-3333-3333-3333-333333333333',  -- 会员ID
  '测试额外签到会员',                      -- 姓名
  'extra@test.com',                       -- 邮箱
  '44444444-5555-6666-7777-888888888888',  -- 过期团课卡ID
  'morning',                              -- 课程类型
  CURRENT_DATE,                           -- 签到日期
  '9:00-10:30'                            -- 时间段
);

-- 测试用例7：老会员额外签到（课时用完）
SELECT 'Test Case 7: Existing Member Extra Check-in (No Remaining Sessions)' AS test_case;
SELECT handle_check_in(
  '33333333-3333-3333-3333-333333333333',  -- 会员ID
  '测试额外签到会员',                      -- 姓名
  'extra@test.com',                       -- 邮箱
  '55555555-6666-7777-8888-999999999999',  -- 课时用完的私教卡ID
  'private',                              -- 课程类型
  CURRENT_DATE,                           -- 签到日期
  '16:00-17:00',                          -- 时间段
  '88888888-7777-6666-5555-444444444444',  -- 教练ID
  false                                   -- 是否1对2
);

-- 测试用例8：老会员额外签到（无有效会员卡）
SELECT 'Test Case 8: Existing Member Extra Check-in (No Valid Card)' AS test_case;
SELECT handle_check_in(
  '33333333-3333-3333-3333-333333333333',  -- 会员ID
  '测试额外签到会员',                      -- 姓名
  'extra@test.com',                       -- 邮箱
  NULL,                                   -- 会员卡ID（不提供卡）
  'evening',                              -- 课程类型
  CURRENT_DATE,                           -- 签到日期
  '17:00-18:30'                           -- 时间段
);

-- 测试用例9：重复签到检测
SELECT 'Test Case 9: Duplicate Check-in Detection' AS test_case;
SELECT handle_check_in(
  '22222222-2222-2222-2222-222222222222',  -- 会员ID
  '测试老会员',                            -- 姓名
  'old@test.com',                         -- 邮箱
  '11111111-2222-3333-4444-555555555555',  -- 团课课时卡ID
  'morning',                              -- 课程类型
  CURRENT_DATE,                           -- 签到日期
  '9:00-10:30'                            -- 时间段（与测试用例2相同）
);

-- 验证测试结果
SELECT 'Verification: Check-in Records' AS verification;
SELECT 
  c.id, 
  m.name, 
  c.class_type, 
  c.check_in_date, 
  c.time_slot, 
  c.is_extra, 
  c.is_private,
  t.name AS trainer_name,
  c.is_1v2
FROM check_ins c
JOIN members m ON c.member_id = m.id
LEFT JOIN trainers t ON c.trainer_id = t.id
WHERE m.id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
)
ORDER BY c.check_in_date, c.time_slot;

-- 验证会员卡课时变化
SELECT 'Verification: Membership Card Status' AS verification;
SELECT 
  mc.id, 
  m.name, 
  mc.card_type, 
  mc.card_category, 
  mc.card_subtype,
  mc.remaining_group_sessions,
  mc.remaining_private_sessions,
  mc.valid_until
FROM membership_cards mc
JOIN members m ON mc.member_id = m.id
WHERE m.id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
)
ORDER BY m.name, mc.card_type; 