-- 会员卡管理功能测试
BEGIN;

-- 清理测试数据
DELETE FROM membership_cards WHERE member_id = '77777777-7777-7777-7777-777777777777';

-- 确保测试会员存在
INSERT INTO members (id, name, email, is_new_member, extra_check_ins)
VALUES ('77777777-7777-7777-7777-777777777777', '测试会员卡管理', 'card_test@test.com', false, 0)
ON CONFLICT (id) DO UPDATE 
SET name = '测试会员卡管理', email = 'card_test@test.com';

-- 测试用例35：会员卡创建
SELECT '测试用例35：会员卡创建' AS test_case;

-- 创建团课课时卡
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
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '77777777-7777-7777-7777-777777777777',
  'group',
  'session',
  '10_sessions',
  10,
  CURRENT_DATE + INTERVAL '3 months',
  NOW()
);

-- 创建私教课时卡
INSERT INTO membership_cards (
  id,
  member_id,
  card_type,
  card_category,
  card_subtype,
  remaining_private_sessions,
  trainer_type,
  valid_until,
  created_at
)
VALUES (
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  '77777777-7777-7777-7777-777777777777',
  'private',
  'session',
  '10_sessions',
  10,
  'senior',
  CURRENT_DATE + INTERVAL '1 month',
  NOW()
);

-- 验证会员卡创建
SELECT 
  id,
  card_type,
  card_category,
  card_subtype,
  remaining_group_sessions,
  remaining_private_sessions,
  trainer_type,
  valid_until
FROM membership_cards
WHERE member_id = '77777777-7777-7777-7777-777777777777'
ORDER BY card_type;

-- 测试用例36：会员卡更新
SELECT '测试用例36：会员卡更新' AS test_case;

-- 更新团课课时卡（模拟使用了2次课）
UPDATE membership_cards
SET remaining_group_sessions = 8
WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

-- 验证团课课时卡更新
SELECT 
  id,
  card_type,
  card_subtype,
  remaining_group_sessions
FROM membership_cards
WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

-- 测试用例37：会员卡续费（延长有效期）
SELECT '测试用例37：会员卡续费（延长有效期）' AS test_case;

-- 延长团课课时卡有效期
UPDATE membership_cards
SET valid_until = valid_until + INTERVAL '3 months'
WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

-- 验证团课课时卡有效期延长
SELECT 
  id,
  card_type,
  card_subtype,
  valid_until
FROM membership_cards
WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

-- 测试用例38：会员卡升级（增加课时）
SELECT '测试用例38：会员卡升级（增加课时）' AS test_case;

-- 为私教卡增加课时
UPDATE membership_cards
SET remaining_private_sessions = remaining_private_sessions + 5
WHERE id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

-- 验证私教卡课时增加
SELECT 
  id,
  card_type,
  card_subtype,
  remaining_private_sessions
FROM membership_cards
WHERE id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

-- 测试用例39：会员卡类型升级（从单次月卡升级到双次月卡）
SELECT '测试用例39：会员卡类型升级' AS test_case;

-- 创建单次月卡
INSERT INTO membership_cards (
  id,
  member_id,
  card_type,
  card_category,
  card_subtype,
  valid_until,
  created_at
)
VALUES (
  '12345678-1234-1234-1234-123456789abc',
  '77777777-7777-7777-7777-777777777777',
  'group',
  'monthly',
  'single_monthly',
  CURRENT_DATE + INTERVAL '30 days',
  NOW()
);

-- 升级为双次月卡
UPDATE membership_cards
SET 
  card_subtype = 'double_monthly',
  valid_until = CURRENT_DATE + INTERVAL '30 days' -- 重置有效期
WHERE id = '12345678-1234-1234-1234-123456789abc';

-- 验证月卡升级
SELECT 
  id,
  card_type,
  card_category,
  card_subtype,
  valid_until
FROM membership_cards
WHERE id = '12345678-1234-1234-1234-123456789abc';

-- 测试用例40：会员卡删除
SELECT '测试用例40：会员卡删除' AS test_case;

-- 删除月卡
DELETE FROM membership_cards
WHERE id = '12345678-1234-1234-1234-123456789abc';

-- 验证月卡已删除
SELECT COUNT(*) AS remaining_cards
FROM membership_cards
WHERE id = '12345678-1234-1234-1234-123456789abc';

-- 验证会员的其他卡仍然存在
SELECT COUNT(*) AS remaining_cards
FROM membership_cards
WHERE member_id = '77777777-7777-7777-7777-777777777777';

COMMIT; 