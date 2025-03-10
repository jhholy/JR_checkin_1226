-- 测试脚本：验证会员可以在同一天同时签到团课和私教课

-- 开始事务
BEGIN;

-- 1. 获取一个测试会员ID
DO $$
DECLARE
  v_member_id uuid;
  v_group_check_in_id uuid;
  v_private_check_in_id uuid;
  v_today date := CURRENT_DATE;
  r RECORD;
BEGIN
  -- 获取一个存在的会员ID
  SELECT id INTO v_member_id FROM members LIMIT 1;
  
  IF v_member_id IS NULL THEN
    RAISE NOTICE '没有找到测试会员，测试无法继续';
    RETURN;
  END IF;
  
  RAISE NOTICE '使用会员ID: %', v_member_id;
  
  -- 2. 先删除该会员今天可能已有的签到记录
  DELETE FROM check_ins 
  WHERE member_id = v_member_id 
  AND check_in_date = v_today;
  
  RAISE NOTICE '已删除会员今天的签到记录';
  
  -- 3. 为该会员创建一个团课签到（上午）
  INSERT INTO check_ins (
    member_id, 
    check_in_date, 
    time_slot, 
    is_private
  ) 
  VALUES (
    v_member_id, 
    v_today, 
    '09:00-10:30', 
    false
  )
  RETURNING id INTO v_group_check_in_id;
  
  RAISE NOTICE '成功创建团课签到，ID: %', v_group_check_in_id;
  
  -- 4. 为同一会员创建一个私教课签到（同一天）
  BEGIN
    INSERT INTO check_ins (
      member_id, 
      check_in_date, 
      time_slot, 
      is_private
    ) 
    VALUES (
      v_member_id, 
      v_today, 
      '17:00-18:30', 
      true
    )
    RETURNING id INTO v_private_check_in_id;
    
    RAISE NOTICE '成功创建私教课签到，ID: %', v_private_check_in_id;
    RAISE NOTICE '测试成功：会员可以在同一天同时签到团课和私教课';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '创建私教课签到失败: %', SQLERRM;
      RAISE NOTICE '测试失败：会员无法在同一天同时签到团课和私教课';
  END;
  
  -- 5. 尝试为同一会员创建另一个团课签到（同一天同一时段）- 应该失败
  BEGIN
    INSERT INTO check_ins (
      member_id, 
      check_in_date, 
      time_slot, 
      is_private
    ) 
    VALUES (
      v_member_id, 
      v_today, 
      '09:00-10:30', 
      false
    );
    
    RAISE NOTICE '警告：成功创建了重复的团课签到，这不应该发生';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '预期的错误（重复团课签到）: %', SQLERRM;
  END;
  
  -- 6. 尝试为同一会员创建另一个私教课签到（同一天同一时段）- 应该失败
  BEGIN
    INSERT INTO check_ins (
      member_id, 
      check_in_date, 
      time_slot, 
      is_private
    ) 
    VALUES (
      v_member_id, 
      v_today, 
      '17:00-18:30', 
      true
    );
    
    RAISE NOTICE '警告：成功创建了重复的私教课签到，这不应该发生';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '预期的错误（重复私教课签到）: %', SQLERRM;
  END;
  
  -- 7. 查询该会员今天的所有签到记录
  RAISE NOTICE '会员今天的签到记录:';
  FOR r IN 
    SELECT 
      id, 
      time_slot, 
      is_private, 
      class_type
    FROM check_ins 
    WHERE member_id = v_member_id 
    AND check_in_date = v_today
    ORDER BY time_slot
  LOOP
    RAISE NOTICE '签到ID: %, 时间段: %, 是否私教: %, 课程类型: %', 
      r.id, r.time_slot, r.is_private, r.class_type;
  END LOOP;
  
END $$;

-- 回滚事务（测试完成后不保存更改）
ROLLBACK; 