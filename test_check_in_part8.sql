-- 测试用例25：签到统计功能测试

-- 测试用例25：日签到统计
SELECT '测试用例25：日签到统计' AS test_case;
SELECT 
  check_in_date,
  COUNT(*) AS total_check_ins,
  SUM(CASE WHEN is_private THEN 1 ELSE 0 END) AS private_check_ins,
  SUM(CASE WHEN NOT is_private THEN 1 ELSE 0 END) AS group_check_ins,
  SUM(CASE WHEN is_extra THEN 1 ELSE 0 END) AS extra_check_ins
FROM check_ins
WHERE check_in_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY check_in_date
ORDER BY check_in_date;

-- 测试用例26：周签到统计
SELECT '测试用例26：周签到统计' AS test_case;
SELECT 
  EXTRACT(YEAR FROM check_in_date) AS year,
  EXTRACT(WEEK FROM check_in_date) AS week,
  COUNT(*) AS total_check_ins,
  SUM(CASE WHEN is_private THEN 1 ELSE 0 END) AS private_check_ins,
  SUM(CASE WHEN NOT is_private THEN 1 ELSE 0 END) AS group_check_ins,
  SUM(CASE WHEN is_extra THEN 1 ELSE 0 END) AS extra_check_ins
FROM check_ins
WHERE check_in_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY EXTRACT(YEAR FROM check_in_date), EXTRACT(WEEK FROM check_in_date)
ORDER BY year, week;

-- 测试用例27：月签到统计
SELECT '测试用例27：月签到统计' AS test_case;
SELECT 
  EXTRACT(YEAR FROM check_in_date) AS year,
  EXTRACT(MONTH FROM check_in_date) AS month,
  COUNT(*) AS total_check_ins,
  SUM(CASE WHEN is_private THEN 1 ELSE 0 END) AS private_check_ins,
  SUM(CASE WHEN NOT is_private THEN 1 ELSE 0 END) AS group_check_ins,
  SUM(CASE WHEN is_extra THEN 1 ELSE 0 END) AS extra_check_ins
FROM check_ins
WHERE check_in_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY EXTRACT(YEAR FROM check_in_date), EXTRACT(MONTH FROM check_in_date)
ORDER BY year, month;

-- 测试用例28：团课/私教课签到比例
SELECT '测试用例28：团课/私教课签到比例' AS test_case;
SELECT 
  COUNT(*) AS total_check_ins,
  SUM(CASE WHEN is_private THEN 1 ELSE 0 END) AS private_check_ins,
  SUM(CASE WHEN NOT is_private THEN 1 ELSE 0 END) AS group_check_ins,
  ROUND(SUM(CASE WHEN is_private THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 2) AS private_percentage,
  ROUND(SUM(CASE WHEN NOT is_private THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 2) AS group_percentage
FROM check_ins
WHERE check_in_date >= CURRENT_DATE - INTERVAL '30 days';

-- 测试用例29：额外签到跟踪记录
SELECT '测试用例29：额外签到跟踪记录' AS test_case;
SELECT 
  m.id AS member_id,
  m.name AS member_name,
  m.email,
  COUNT(c.id) AS total_extra_check_ins,
  MAX(c.check_in_date) AS last_extra_check_in_date
FROM members m
JOIN check_ins c ON m.id = c.member_id
WHERE c.is_extra = true
  AND c.check_in_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY m.id, m.name, m.email
ORDER BY total_extra_check_ins DESC, last_extra_check_in_date DESC; 