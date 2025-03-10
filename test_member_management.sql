-- 会员信息管理功能测试
BEGIN;

-- 清理测试数据
DELETE FROM check_ins WHERE member_id IN (
  '66666666-6666-6666-6666-666666666666',
  '77777777-7777-7777-7777-777777777777'
);

DELETE FROM membership_cards WHERE member_id IN (
  '66666666-6666-6666-6666-666666666666',
  '77777777-7777-7777-7777-777777777777'
);

DELETE FROM members WHERE id IN (
  '66666666-6666-6666-6666-666666666666',
  '77777777-7777-7777-7777-777777777777'
) OR email IN ('member_test@test.com', 'member_update@test.com');

-- 测试用例30：会员信息创建
SELECT '测试用例30：会员信息创建' AS test_case;
INSERT INTO members (
  id, 
  name, 
  email, 
  phone, 
  is_new_member, 
  extra_check_ins, 
  created_at
)
VALUES (
  '66666666-6666-6666-6666-666666666666',
  '测试会员管理',
  'member_test@test.com',
  '13800138000',
  true,
  0,
  NOW()
);

-- 测试用例31：会员信息查询
SELECT '测试用例31：会员信息查询' AS test_case;
SELECT 
  id, 
  name, 
  email, 
  phone, 
  is_new_member, 
  extra_check_ins, 
  last_check_in_date, 
  created_at
FROM members
WHERE id = '66666666-6666-6666-6666-666666666666';

-- 测试用例32：会员信息更新
SELECT '测试用例32：会员信息更新' AS test_case;
UPDATE members
SET 
  name = '测试会员管理(已更新)',
  email = 'member_update@test.com',
  phone = '13900139000',
  is_new_member = false
WHERE id = '66666666-6666-6666-6666-666666666666';

-- 验证会员信息更新
SELECT 
  id, 
  name, 
  email, 
  phone, 
  is_new_member
FROM members
WHERE id = '66666666-6666-6666-6666-666666666666';

-- 测试用例33：会员签到历史记录查询
SELECT '测试用例33：会员签到历史记录查询' AS test_case;

-- 为会员创建签到记录
INSERT INTO check_ins (
  member_id,
  check_in_date,
  time_slot,
  is_extra,
  is_private,
  class_type,
  created_at
)
VALUES
  ('66666666-6666-6666-6666-666666666666', CURRENT_DATE - INTERVAL '5 days', '09:00-10:30', true, false, 'morning', NOW() - INTERVAL '5 days'),
  ('66666666-6666-6666-6666-666666666666', CURRENT_DATE - INTERVAL '3 days', '17:00-18:30', true, false, 'evening', NOW() - INTERVAL '3 days'),
  ('66666666-6666-6666-6666-666666666666', CURRENT_DATE - INTERVAL '1 day', '09:00-10:30', true, false, 'morning', NOW() - INTERVAL '1 day');

-- 查询会员签到历史
SELECT 
  c.id,
  c.check_in_date,
  c.time_slot,
  c.is_extra,
  c.is_private,
  c.class_type,
  t.name AS trainer_name,
  c.created_at
FROM check_ins c
LEFT JOIN trainers t ON c.trainer_id = t.id
WHERE c.member_id = '66666666-6666-6666-6666-666666666666'
ORDER BY c.check_in_date DESC, c.time_slot;

-- 测试用例34：会员卡状态查询
SELECT '测试用例34：会员卡状态查询' AS test_case;

-- 为会员创建会员卡
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
VALUES
  ('cccccccc-1111-2222-3333-cccccccccccc', '66666666-6666-6666-6666-666666666666', 'group', 'session', '10_sessions', 8, CURRENT_DATE + INTERVAL '3 months', NOW()),
  ('dddddddd-1111-2222-3333-dddddddddddd', '66666666-6666-6666-6666-666666666666', 'group', 'monthly', 'single_monthly', NULL, CURRENT_DATE + INTERVAL '30 days', NOW());

-- 查询会员卡状态
SELECT 
  mc.id,
  mc.card_type,
  mc.card_category,
  mc.card_subtype,
  mc.remaining_group_sessions,
  mc.remaining_private_sessions,
  mc.trainer_type,
  mc.valid_until,
  CASE 
    WHEN mc.valid_until < CURRENT_DATE THEN '已过期'
    WHEN mc.valid_until <= CURRENT_DATE + INTERVAL '7 days' THEN '即将过期'
    ELSE '有效'
  END AS status,
  CASE 
    WHEN mc.card_category = 'session' AND mc.card_type = 'group' AND mc.remaining_group_sessions <= 2 THEN '课时即将用完'
    WHEN mc.card_category = 'session' AND mc.card_type = 'private' AND mc.remaining_private_sessions <= 2 THEN '课时即将用完'
    WHEN mc.card_category = 'session' AND mc.card_type = 'group' AND mc.remaining_group_sessions = 0 THEN '课时已用完'
    WHEN mc.card_category = 'session' AND mc.card_type = 'private' AND mc.remaining_private_sessions = 0 THEN '课时已用完'
    ELSE '正常'
  END AS sessions_status
FROM membership_cards mc
WHERE mc.member_id = '66666666-6666-6666-6666-666666666666'
ORDER BY mc.valid_until, mc.card_type;

COMMIT; 