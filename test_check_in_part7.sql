-- 测试用例20：教练课时统计功能测试
-- 清理之前的测试数据
DELETE FROM check_ins WHERE trainer_id IN (
  '99999999-8888-7777-6666-555555555555',
  '88888888-7777-6666-5555-444444444444'
) AND check_in_date >= CURRENT_DATE - INTERVAL '7 days';

-- 创建测试会员和会员卡（用于教练课时统计）
INSERT INTO members (id, name, email, is_new_member, extra_check_ins)
VALUES
  ('44444444-4444-4444-4444-444444444444', '测试教练课时会员1', 'trainer_test1@test.com', false, 0),
  ('55555555-5555-5555-5555-555555555555', '测试教练课时会员2', 'trainer_test2@test.com', false, 0);

-- 创建私教卡
INSERT INTO membership_cards (
  id, member_id, card_type, card_category, card_subtype,
  remaining_private_sessions, trainer_type, valid_until
)
VALUES
  ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
   '44444444-4444-4444-4444-444444444444',
   'private', 'session', '10_sessions',
   10, 'jr', CURRENT_DATE + INTERVAL '1 month'),
  ('bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
   '55555555-5555-5555-5555-555555555555',
   'private', 'session', '10_sessions',
   10, 'senior', CURRENT_DATE + INTERVAL '1 month');

-- 测试用例20：JR教练1对1私教课签到
SELECT '测试用例20：JR教练1对1私教课签到' AS test_case;
SELECT handle_check_in(
  '44444444-4444-4444-4444-444444444444',  -- 会员ID
  '测试教练课时会员1',                      -- 姓名
  'trainer_test1@test.com',                -- 邮箱
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',  -- 私教卡ID
  'private',                              -- 课程类型
  CURRENT_DATE,                           -- 签到日期
  '10:30-11:30',                          -- 时间段
  '99999999-8888-7777-6666-555555555555',  -- JR教练ID
  false                                   -- 是否1对2
);

-- 测试用例21：JR教练1对2私教课签到
SELECT '测试用例21：JR教练1对2私教课签到' AS test_case;
SELECT handle_check_in(
  '44444444-4444-4444-4444-444444444444',  -- 会员ID
  '测试教练课时会员1',                      -- 姓名
  'trainer_test1@test.com',                -- 邮箱
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',  -- 私教卡ID
  'private',                              -- 课程类型
  CURRENT_DATE + 1,                       -- 签到日期（明天）
  '10:30-11:30',                          -- 时间段
  '99999999-8888-7777-6666-555555555555',  -- JR教练ID
  true                                    -- 是否1对2
);

-- 测试用例22：高级教练1对1私教课签到
SELECT '测试用例22：高级教练1对1私教课签到' AS test_case;
SELECT handle_check_in(
  '55555555-5555-5555-5555-555555555555',  -- 会员ID
  '测试教练课时会员2',                      -- 姓名
  'trainer_test2@test.com',                -- 邮箱
  'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',  -- 私教卡ID
  'private',                              -- 课程类型
  CURRENT_DATE,                           -- 签到日期
  '14:00-15:00',                          -- 时间段
  '88888888-7777-6666-5555-444444444444',  -- 高级教练ID
  false                                   -- 是否1对2
);

-- 测试用例23：高级教练1对2私教课签到
SELECT '测试用例23：高级教练1对2私教课签到' AS test_case;
SELECT handle_check_in(
  '55555555-5555-5555-5555-555555555555',  -- 会员ID
  '测试教练课时会员2',                      -- 姓名
  'trainer_test2@test.com',                -- 邮箱
  'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',  -- 私教卡ID
  'private',                              -- 课程类型
  CURRENT_DATE + 1,                       -- 签到日期（明天）
  '14:00-15:00',                          -- 时间段
  '88888888-7777-6666-5555-444444444444',  -- 高级教练ID
  true                                    -- 是否1对2
);

-- 测试用例24：教练课时统计查询
SELECT '测试用例24：教练课时统计查询' AS test_case;
SELECT 
  t.name AS trainer_name,
  t.type AS trainer_type,
  COUNT(*) AS total_sessions,
  SUM(CASE WHEN c.is_1v2 THEN 1 ELSE 0 END) AS one_v_two_sessions,
  SUM(CASE WHEN NOT c.is_1v2 THEN 1 ELSE 0 END) AS one_v_one_sessions
FROM check_ins c
JOIN trainers t ON c.trainer_id = t.id
WHERE c.check_in_date >= CURRENT_DATE - INTERVAL '7 days'
  AND c.is_private = true
GROUP BY t.id, t.name, t.type
ORDER BY t.name; 