-- 验证测试结果
SELECT '验证：签到记录' AS verification;
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
SELECT '验证：会员卡状态' AS verification;
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