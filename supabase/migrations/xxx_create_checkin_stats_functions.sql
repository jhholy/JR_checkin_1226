-- 创建总体统计函数
CREATE OR REPLACE FUNCTION get_checkin_total_stats()
RETURNS TABLE (
    total_checkins bigint,
    extra_checkins bigint,
    regular_checkins bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_checkins,
        SUM(CASE WHEN is_extra = true THEN 1 ELSE 0 END) as extra_checkins,
        SUM(CASE WHEN is_extra = false THEN 1 ELSE 0 END) as regular_checkins
    FROM check_ins;
END;
$$ LANGUAGE plpgsql;

-- 创建会员统计函数
CREATE OR REPLACE FUNCTION get_checkin_member_stats()
RETURNS TABLE (
    name text,
    total_checkins bigint,
    extra_checkins bigint,
    regular_checkins bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.name,
        COUNT(*) as total_checkins,
        SUM(CASE WHEN c.is_extra = true THEN 1 ELSE 0 END) as extra_checkins,
        SUM(CASE WHEN c.is_extra = false THEN 1 ELSE 0 END) as regular_checkins
    FROM members m
    LEFT JOIN check_ins c ON m.id = c.member_id
    GROUP BY m.id, m.name
    ORDER BY m.name;
END;
$$ LANGUAGE plpgsql; 