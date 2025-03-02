-- 会员卡数据验证脚本
-- 此脚本用于检查会员卡数据的一致性

-- 输出表头
\echo '===== 会员卡数据验证报告 ====='
\echo '生成时间: ' \date +"%Y-%m-%d %H:%M:%S"
\echo ''

-- 检查卡类型分布
\echo '===== 卡类型分布 ====='
SELECT card_type, COUNT(*) AS count 
FROM membership_cards 
GROUP BY card_type 
ORDER BY count DESC;
\echo ''

-- 检查卡类别分布
\echo '===== 卡类别分布 ====='
SELECT card_category, COUNT(*) AS count 
FROM membership_cards 
GROUP BY card_category 
ORDER BY count DESC;
\echo ''

-- 检查卡子类型分布
\echo '===== 卡子类型分布 ====='
SELECT card_subtype, COUNT(*) AS count 
FROM membership_cards 
GROUP BY card_subtype 
ORDER BY count DESC;
\echo ''

-- 检查卡类型和类别组合
\echo '===== 卡类型和类别组合 ====='
SELECT card_type, card_category, COUNT(*) AS count 
FROM membership_cards 
GROUP BY card_type, card_category 
ORDER BY card_type, card_category;
\echo ''

-- 检查完整组合
\echo '===== 卡类型、类别和子类型组合 ====='
SELECT card_type, card_category, card_subtype, COUNT(*) AS count 
FROM membership_cards 
GROUP BY card_type, card_category, card_subtype 
ORDER BY card_type, card_category, card_subtype;
\echo ''

-- 检查非标准值
\echo '===== 非标准卡类型值 ====='
SELECT card_type, COUNT(*) AS count 
FROM membership_cards 
WHERE card_type NOT IN ('group', 'private', 'class') 
GROUP BY card_type;
\echo ''

\echo '===== 非标准卡类别值 ====='
SELECT card_category, COUNT(*) AS count 
FROM membership_cards 
WHERE card_category NOT IN ('monthly', 'quarterly', 'annual', 'ten_classes', 'twenty_classes', 'ten_private', 'twenty_private') 
GROUP BY card_category;
\echo ''

\echo '===== 非标准卡子类型值 ====='
SELECT card_subtype, COUNT(*) AS count 
FROM membership_cards 
WHERE card_subtype NOT IN ('single_monthly', 'couple_monthly', 'family_monthly', 'single_quarterly', 'couple_quarterly', 'family_quarterly', 'single_annual', 'couple_annual', 'family_annual', NULL) 
GROUP BY card_subtype;
\echo ''

-- 检查不一致的组合
\echo '===== 不一致的组合 ====='
SELECT card_type, card_category, card_subtype, COUNT(*) AS count 
FROM membership_cards 
WHERE 
  (card_type = 'group' AND card_category NOT IN ('monthly', 'quarterly', 'annual')) OR
  (card_type = 'class' AND card_category NOT IN ('ten_classes', 'twenty_classes')) OR
  (card_type = 'private' AND card_category NOT IN ('ten_private', 'twenty_private')) OR
  (card_category IN ('monthly', 'quarterly', 'annual') AND card_type != 'group') OR
  (card_category IN ('ten_classes', 'twenty_classes') AND card_type != 'class') OR
  (card_category IN ('ten_private', 'twenty_private') AND card_type != 'private')
GROUP BY card_type, card_category, card_subtype;
\echo ''

-- 检查子类型使用情况
\echo '===== 子类型使用情况 ====='
SELECT card_category, card_subtype, COUNT(*) AS count 
FROM membership_cards 
WHERE card_subtype IS NOT NULL
GROUP BY card_category, card_subtype 
ORDER BY card_category, card_subtype;
\echo ''

-- 检查不一致的子类型
\echo '===== 不一致的子类型 ====='
SELECT card_category, card_subtype, COUNT(*) AS count 
FROM membership_cards 
WHERE 
  (card_category = 'monthly' AND card_subtype NOT IN ('single_monthly', 'couple_monthly', 'family_monthly')) OR
  (card_category = 'quarterly' AND card_subtype NOT IN ('single_quarterly', 'couple_quarterly', 'family_quarterly')) OR
  (card_category = 'annual' AND card_subtype NOT IN ('single_annual', 'couple_annual', 'family_annual')) OR
  (card_category NOT IN ('monthly', 'quarterly', 'annual') AND card_subtype IS NOT NULL)
GROUP BY card_category, card_subtype;
\echo ''

\echo '===== 验证完成 =====' 