-- 更新与会员卡类型相关的验证函数
-- 此脚本将更新数据库函数，使其适应新的会员卡类型标准

-- 记录迁移开始
INSERT INTO migration_logs (migration_name, description)
VALUES ('20250401000003_update_card_validation_functions', '更新会员卡验证函数开始');

-- 更新会员卡有效性检查函数
CREATE OR REPLACE FUNCTION check_card_validity(
  p_card_id UUID,
  p_member_id UUID,
  p_class_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_card RECORD;
BEGIN
  SELECT * INTO v_card FROM membership_cards WHERE id = p_card_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  IF v_card.member_id != p_member_id THEN
    RETURN FALSE;
  END IF;
  
  -- 根据新的卡类型定义调整类型比较
  IF (v_card.card_type = '团课' AND p_class_type = 'private') OR
     (v_card.card_type = '私教课' AND p_class_type != 'private') THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 更新会员卡有效性详细检查函数
CREATE OR REPLACE FUNCTION check_card_validity_detailed(
  p_card_id UUID,
  p_member_id UUID,
  p_class_type TEXT,
  p_check_in_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_card RECORD;
BEGIN
  -- 获取会员卡信息
  SELECT * INTO v_card FROM membership_cards WHERE id = p_card_id;
  
  -- 检查会员卡是否存在
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'is_valid', FALSE,
      'reason', '会员卡不存在',
      'details', jsonb_build_object('card_id', p_card_id)
    );
  END IF;
  
  -- 检查会员卡是否属于该会员
  IF v_card.member_id != p_member_id THEN
    RETURN jsonb_build_object(
      'is_valid', FALSE,
      'reason', '会员卡不属于该会员',
      'details', jsonb_build_object(
        'card_member_id', v_card.member_id,
        'requested_member_id', p_member_id
      )
    );
  END IF;
  
  -- 检查会员卡是否过期
  IF v_card.valid_until IS NOT NULL AND v_card.valid_until < p_check_in_date THEN
    RETURN jsonb_build_object(
      'is_valid', FALSE,
      'reason', '会员卡已过期',
      'details', jsonb_build_object(
        'valid_until', v_card.valid_until,
        'check_in_date', p_check_in_date
      )
    );
  END IF;
  
  -- 检查卡类型是否匹配课程类型
  IF (v_card.card_type = '团课' AND p_class_type = 'private') OR 
     (v_card.card_type = '私教课' AND p_class_type != 'private') THEN
    RETURN jsonb_build_object(
      'is_valid', FALSE,
      'reason', '卡类型不匹配课程类型',
      'details', jsonb_build_object(
        'card_type', v_card.card_type,
        'class_type', p_class_type
      )
    );
  END IF;
  
  -- 检查团课课时卡课时是否足够
  IF v_card.card_type = '团课' AND v_card.card_category = '课时卡' AND
     (v_card.remaining_group_sessions IS NULL OR v_card.remaining_group_sessions <= 0) THEN
    RETURN jsonb_build_object(
      'is_valid', FALSE,
      'reason', '团课课时不足',
      'details', jsonb_build_object(
        'remaining_group_sessions', v_card.remaining_group_sessions
      )
    );
  END IF;
  
  -- 检查私教课时是否足够
  IF v_card.card_type = '私教课' AND
     (v_card.remaining_private_sessions IS NULL OR v_card.remaining_private_sessions <= 0) THEN
    RETURN jsonb_build_object(
      'is_valid', FALSE,
      'reason', '私教课时不足',
      'details', jsonb_build_object(
        'remaining_private_sessions', v_card.remaining_private_sessions
      )
    );
  END IF;
  
  -- 会员卡有效
  RETURN jsonb_build_object(
    'is_valid', TRUE,
    'card_info', jsonb_build_object(
      'card_id', v_card.id,
      'card_type', v_card.card_type,
      'card_category', v_card.card_category,
      'card_subtype', v_card.card_subtype,
      'valid_until', v_card.valid_until,
      'remaining_group_sessions', v_card.remaining_group_sessions,
      'remaining_private_sessions', v_card.remaining_private_sessions
    )
  );
END;
$$;

-- 更新查找有效会员卡的触发器函数
CREATE OR REPLACE FUNCTION find_valid_card_for_checkin()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_card_id UUID;
  v_card_type TEXT;
  v_class_type TEXT := NEW.class_type;
  v_is_private BOOLEAN := NEW.is_private;
BEGIN
  -- 如果已经指定了会员卡，则不需要自动查找
  IF NEW.card_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- 如果是额外签到，则不需要关联会员卡
  IF NEW.is_extra THEN
    RETURN NEW;
  END IF;
  
  -- 记录开始查找会员卡
  INSERT INTO debug_logs (function_name, message, details)
  VALUES ('find_valid_card_for_checkin', '开始查找有效会员卡',
    jsonb_build_object(
      'member_id', NEW.member_id,
      'class_type', v_class_type,
      'is_private', v_is_private
    )
  );
  
  -- 根据课程类型确定需要查找的卡类型
  IF v_is_private THEN
    v_card_type := '私教课';
  ELSE
    v_card_type := '团课';
  END IF;
  
  -- 查找有效的会员卡
  -- 优先查找课时卡，其次是月卡
  SELECT id INTO v_card_id
  FROM membership_cards
  WHERE member_id = NEW.member_id
    AND (
      -- 对于私教课
      (v_is_private AND card_type = '私教课' AND 
       (remaining_private_sessions IS NULL OR remaining_private_sessions > 0))
      OR
      -- 对于团课
      (NOT v_is_private AND card_type = '团课' AND 
       ((card_category = '课时卡' AND (remaining_group_sessions IS NULL OR remaining_group_sessions > 0))
        OR card_category = '月卡'))
    )
    AND (valid_until IS NULL OR valid_until >= NEW.check_in_date)
  ORDER BY 
    -- 优先使用课时卡
    CASE WHEN card_category = '课时卡' THEN 0 ELSE 1 END,
    -- 优先使用即将过期的卡
    CASE WHEN valid_until IS NOT NULL THEN valid_until ELSE '9999-12-31'::DATE END
  LIMIT 1;
  
  -- 如果找到有效会员卡，则关联到签到记录
  IF v_card_id IS NOT NULL THEN
    NEW.card_id = v_card_id;
    
    -- 记录找到的会员卡
    INSERT INTO debug_logs (function_name, message, details)
    VALUES ('find_valid_card_for_checkin', '找到有效会员卡',
      jsonb_build_object(
        'member_id', NEW.member_id,
        'card_id', v_card_id
      )
    );
  ELSE
    -- 记录未找到有效会员卡
    INSERT INTO debug_logs (function_name, message, details)
    VALUES ('find_valid_card_for_checkin', '未找到有效会员卡',
      jsonb_build_object(
        'member_id', NEW.member_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 更新会员卡验证触发器函数
CREATE OR REPLACE FUNCTION validate_check_in_card()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_card RECORD;
BEGIN
  -- 如果没有指定会员卡，则为额外签到
  IF NEW.card_id IS NULL THEN
    NEW.is_extra := true;
    RETURN NEW;
  END IF;

  -- 获取会员卡信息
  SELECT * INTO v_card FROM membership_cards WHERE id = NEW.card_id;
  
  -- 检查会员卡是否存在
  IF NOT FOUND THEN
    NEW.is_extra := true;
    INSERT INTO debug_logs (function_name, message, details)
    VALUES ('validate_check_in_card', '会员卡不存在',
      jsonb_build_object('card_id', NEW.card_id)
    );
    RETURN NEW;
  END IF;

  -- 检查会员卡是否属于该会员
  IF v_card.member_id != NEW.member_id THEN
    NEW.is_extra := true;
    INSERT INTO debug_logs (function_name, message, details)
    VALUES ('validate_check_in_card', '会员卡不属于该会员',
      jsonb_build_object(
        'card_id', NEW.card_id,
        'card_member_id', v_card.member_id,
        'check_in_member_id', NEW.member_id
      )
    );
    RETURN NEW;
  END IF;

  -- 使用CASE表达式简化条件判断
  NEW.is_extra := CASE
    -- 卡类型不匹配
    WHEN (v_card.card_type = '团课' AND NEW.class_type::TEXT = 'private') OR
         (v_card.card_type = '私教课' AND NEW.class_type::TEXT != 'private') THEN true
    -- 卡已过期
    WHEN v_card.valid_until IS NOT NULL AND v_card.valid_until < NEW.check_in_date THEN true
    -- 团课课时卡课时不足
    WHEN v_card.card_type = '团课' AND v_card.card_category = '课时卡' AND
         (v_card.remaining_group_sessions IS NULL OR v_card.remaining_group_sessions <= 0) THEN true
    -- 私教课时不足
    WHEN v_card.card_type = '私教课' AND
         (v_card.remaining_private_sessions IS NULL OR v_card.remaining_private_sessions <= 0) THEN true
    -- 月卡超出每日限制
    WHEN v_card.card_type = '团课' AND v_card.card_category = '月卡' THEN
      CASE
        WHEN v_card.card_subtype = '单次月卡' AND
             (SELECT COUNT(*) FROM check_ins
              WHERE member_id = NEW.member_id
              AND check_in_date = NEW.check_in_date
              AND id IS DISTINCT FROM NEW.id
              AND NOT is_extra) >= 1 THEN true
        WHEN v_card.card_subtype = '双次月卡' AND
             (SELECT COUNT(*) FROM check_ins
              WHERE member_id = NEW.member_id
              AND check_in_date = NEW.check_in_date
              AND id IS DISTINCT FROM NEW.id
              AND NOT is_extra) >= 2 THEN true
        ELSE false
      END
    -- 其他情况为正常签到
    ELSE false
  END;
  
  RETURN NEW;
END;
$$;

-- 更新扣除课时函数
CREATE OR REPLACE FUNCTION deduct_membership_sessions(
  p_card_id uuid, 
  p_class_type text,
  p_is_private boolean DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_card RECORD;
  v_class_type class_type;
  v_is_private boolean;
  v_member_id uuid;
BEGIN
  -- 获取会员卡信息
  SELECT * INTO v_card FROM membership_cards WHERE id = p_card_id;
  
  -- 记录开始扣除课时
  INSERT INTO debug_logs (function_name, message, details)
  VALUES ('deduct_membership_sessions', '开始扣除课时',
    jsonb_build_object(
      'card_id', p_card_id,
      'class_type', p_class_type,
      'is_private', p_is_private
    )
  );
  
  -- 如果会员卡不存在，返回失败
  IF NOT FOUND THEN
    INSERT INTO debug_logs (function_name, message, details)
    VALUES ('deduct_membership_sessions', '会员卡不存在',
      jsonb_build_object('card_id', p_card_id)
    );
    RETURN FALSE;
  END IF;
  
  v_member_id := v_card.member_id;
  
  -- 确定是否为私教课
  IF p_is_private IS NULL THEN
    v_is_private := p_class_type = 'private';
  ELSE
    v_is_private := p_is_private;
  END IF;
  
  -- 根据卡类型扣除相应课时
  IF v_is_private AND v_card.card_type = '私教课' THEN
    -- 私教卡扣除私教课时
    IF v_card.remaining_private_sessions IS NOT NULL AND v_card.remaining_private_sessions > 0 THEN
      UPDATE membership_cards
      SET remaining_private_sessions = remaining_private_sessions - 1,
          updated_at = NOW()
      WHERE id = p_card_id;
      
      INSERT INTO debug_logs (function_name, message, details)
      VALUES ('deduct_membership_sessions', '扣除私教课时成功',
        jsonb_build_object(
          'card_id', p_card_id,
          'remaining_private_sessions', v_card.remaining_private_sessions - 1
        )
      );
      
      RETURN TRUE;
    ELSE
      INSERT INTO debug_logs (function_name, message, details)
      VALUES ('deduct_membership_sessions', '私教课时不足',
        jsonb_build_object(
          'card_id', p_card_id,
          'remaining_private_sessions', v_card.remaining_private_sessions
        )
      );
      
      RETURN FALSE;
    END IF;
  ELSIF NOT v_is_private AND v_card.card_type = '团课' THEN
    -- 团课课时卡扣除团课课时
    IF v_card.card_category = '课时卡' THEN
      IF v_card.remaining_group_sessions IS NOT NULL AND v_card.remaining_group_sessions > 0 THEN
        UPDATE membership_cards
        SET remaining_group_sessions = remaining_group_sessions - 1,
            updated_at = NOW()
        WHERE id = p_card_id;
        
        INSERT INTO debug_logs (function_name, message, details)
        VALUES ('deduct_membership_sessions', '扣除团课课时成功',
          jsonb_build_object(
            'card_id', p_card_id,
            'remaining_group_sessions', v_card.remaining_group_sessions - 1
          )
        );
        
        RETURN TRUE;
      ELSE
        INSERT INTO debug_logs (function_name, message, details)
        VALUES ('deduct_membership_sessions', '团课课时不足',
          jsonb_build_object(
            'card_id', p_card_id,
            'remaining_group_sessions', v_card.remaining_group_sessions
          )
        );
        
        RETURN FALSE;
      END IF;
    ELSIF v_card.card_category = '月卡' THEN
      -- 月卡不扣除课时，但需要检查每日限制
      -- 这部分逻辑已在validate_check_in_card函数中处理
      INSERT INTO debug_logs (function_name, message, details)
      VALUES ('deduct_membership_sessions', '月卡不扣除课时',
        jsonb_build_object('card_id', p_card_id)
      );
      
      RETURN TRUE;
    ELSE
      INSERT INTO debug_logs (function_name, message, details)
      VALUES ('deduct_membership_sessions', '未知的卡类别',
        jsonb_build_object(
          'card_id', p_card_id,
          'card_category', v_card.card_category
        )
      );
      
      RETURN FALSE;
    END IF;
  ELSE
    -- 卡类型与课程类型不匹配
    INSERT INTO debug_logs (function_name, message, details)
    VALUES ('deduct_membership_sessions', '卡类型与课程类型不匹配',
      jsonb_build_object(
        'card_id', p_card_id,
        'card_type', v_card.card_type,
        'is_private', v_is_private
      )
    );
    
    RETURN FALSE;
  END IF;
END;
$$;

-- 记录迁移完成
INSERT INTO migration_logs (migration_name, description)
VALUES ('20250401000003_update_card_validation_functions', '更新会员卡验证函数完成'); 