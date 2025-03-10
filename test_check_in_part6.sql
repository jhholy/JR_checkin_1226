-- 测试用例15：团课10次卡有效期测试
-- 创建一个即将到期的团课10次卡
INSERT INTO membership_cards (
  id, member_id, card_type, card_category, card_subtype,
  remaining_group_sessions, valid_until
)
VALUES (
  '77777777-8888-9999-0000-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'group', 'session', '10_sessions',
  5, CURRENT_DATE + INTERVAL '1 day'
);

-- 测试用例15：使用即将到期的团课10次卡
SELECT '测试用例15：使用即将到期的团课10次卡' AS test_case;
SELECT handle_check_in(
  '22222222-2222-2222-2222-222222222222',  -- 会员ID
  '测试老会员',                            -- 姓名
  'old@test.com',                         -- 邮箱
  '77777777-8888-9999-0000-111111111111',  -- 即将到期的团课10次卡
  'morning',                              -- 课程类型
  CURRENT_DATE,                           -- 签到日期（今天）
  '09:00-10:30'                           -- 时间段
);

-- 测试用例16：团课10次卡课时扣减验证
SELECT '测试用例16：团课10次卡课时扣减验证' AS test_case;
SELECT 
  id, 
  card_type, 
  card_category, 
  card_subtype, 
  remaining_group_sessions, 
  valid_until
FROM membership_cards
WHERE id = '77777777-8888-9999-0000-111111111111';

-- 创建一个即将到期的私教10次卡
INSERT INTO membership_cards (
  id, member_id, card_type, card_category, card_subtype,
  remaining_private_sessions, trainer_type, valid_until
)
VALUES (
  '88888888-9999-0000-1111-222222222222',
  '22222222-2222-2222-2222-222222222222',
  'private', 'session', '10_sessions',
  3, 'senior', CURRENT_DATE + INTERVAL '2 days'
);

-- 测试用例17：使用即将到期的私教10次卡
SELECT '测试用例17：使用即将到期的私教10次卡' AS test_case;
SELECT handle_check_in(
  '22222222-2222-2222-2222-222222222222',  -- 会员ID
  '测试老会员',                            -- 姓名
  'old@test.com',                         -- 邮箱
  '88888888-9999-0000-1111-222222222222',  -- 即将到期的私教10次卡
  'private',                              -- 课程类型
  CURRENT_DATE,                           -- 签到日期（今天）
  '15:00-16:00',                          -- 时间段
  '88888888-7777-6666-5555-444444444444',  -- 教练ID
  false                                   -- 是否1对2
);

-- 测试用例18：私教10次卡课时扣减验证
SELECT '测试用例18：私教10次卡课时扣减验证' AS test_case;
SELECT 
  id, 
  card_type, 
  card_category, 
  card_subtype, 
  remaining_private_sessions, 
  trainer_type,
  valid_until
FROM membership_cards
WHERE id = '88888888-9999-0000-1111-222222222222';

-- 测试用例19：会员拥有多张相同类型卡时的自动选择
-- 创建一个新的团课10次卡（剩余次数更多）
INSERT INTO membership_cards (
  id, member_id, card_type, card_category, card_subtype,
  remaining_group_sessions, valid_until
)
VALUES (
  '99999999-0000-1111-2222-333333333333',
  '22222222-2222-2222-2222-222222222222',
  'group', 'session', '10_sessions',
  10, CURRENT_DATE + INTERVAL '3 months'
);

-- 测试用例19：不指定卡ID时系统自动选择最合适的卡
SELECT '测试用例19：不指定卡ID时系统自动选择最合适的卡' AS test_case;
SELECT handle_check_in(
  '22222222-2222-2222-2222-222222222222',  -- 会员ID
  '测试老会员',                            -- 姓名
  'old@test.com',                         -- 邮箱
  NULL,                                   -- 不指定卡ID，让系统自动选择
  'morning',                              -- 课程类型
  CURRENT_DATE + 3,                       -- 签到日期（三天后）
  '09:00-10:30'                           -- 时间段
); 