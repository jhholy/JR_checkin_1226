-- 查看 validate_check_in 函数的当前定义
SELECT 
    pg_get_functiondef(oid) as definition
FROM 
    pg_proc 
WHERE 
    proname = 'validate_check_in'; 