-- 删除旧函数
DROP FUNCTION IF EXISTS deduct_membership_sessions(uuid,text,boolean);
DROP FUNCTION IF EXISTS check_card_validity(uuid,uuid,text,date,uuid);

-- 修复私教卡类型判断问题
CREATE OR REPLACE FUNCTION check_card_validity(
  p_card_id uuid,
  p_member_id uuid,
  p_class_type text,
  p_check_in_date date,
  p_trainer_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_card RECORD;
  v_class_type class_type;
  v_is_private boolean;
  v_result jsonb;
  v_trainer_type text;
BEGIN
  -- 记录开始验证
  PERFORM log_debug(
    'check_card_validity',
    '开始验证会员卡',
    jsonb_build_object(
      'card_id', p_card_id,
      'member_id', p_member_id,
      'class_type', p_class_type,
      'check_in_date', p_check_in_date,
      'trainer_id', p_trainer_id
    )
  );

  -- 转换课程类型
  BEGIN
    v_class_type := p_class_type::class_type;
    v_is_private := (v_class_type = 'private');
  EXCEPTION WHEN OTHERS THEN
    PERFORM log_debug(
      'check_card_validity',
      '无效的课程类型',
      jsonb_build_object(
        'class_type', p_class_type,
        'error', SQLERRM
      )
    );
    RETURN jsonb_build_object(
      'is_valid', false,
      'reason', '无效的课程类型',
      'details', jsonb_build_object(
        'class_type', p_class_type,
        'error', SQLERRM
      )
    );
  END;

  -- 获取会员卡信息
  SELECT *
  INTO v_card
  FROM membership_cards
  WHERE id = p_card_id
  FOR UPDATE;

  -- 检查会员卡是否存在
  IF NOT FOUND THEN
    PERFORM log_debug(
      'check_card_validity',
      '会员卡不存在',
      jsonb_build_object(
        'card_id', p_card_id
      )
    );
    RETURN jsonb_build_object(
      'is_valid', false,
      'reason', '会员卡不存在'
    );
  END IF;

  -- 检查会员卡是否属于该会员
  IF v_card.member_id != p_member_id THEN
    PERFORM log_debug(
      'check_card_validity',
      '会员卡不属于该会员',
      jsonb_build_object(
        'card_member_id', v_card.member_id,
        'requested_member_id', p_member_id
      )
    );
    RETURN jsonb_build_object(
      'is_valid', false,
      'reason', '会员卡不属于该会员'
    );
  END IF;

  -- 检查会员卡是否过期
  IF v_card.valid_until IS NOT NULL AND v_card.valid_until < p_check_in_date THEN
    PERFORM log_debug(
      'check_card_validity',
      '会员卡已过期',
      jsonb_build_object(
        'valid_until', v_card.valid_until,
        'check_in_date', p_check_in_date
      )
    );
    RETURN jsonb_build_object(
      'is_valid', false,
      'reason', '会员卡已过期',
      'details', jsonb_build_object(
        'valid_until', v_card.valid_until,
        'check_in_date', p_check_in_date
      )
    );
  END IF;

  -- 修复：检查卡类型是否匹配课程类型
  IF (v_card.card_type = '私教课' AND NOT v_is_private) OR
     (v_card.card_type = '团课' AND v_is_private) THEN
    PERFORM log_debug(
      'check_card_validity',
      '卡类型不匹配课程类型',
      jsonb_build_object(
        'card_type', v_card.card_type,
        'class_type', p_class_type,
        'is_private', v_is_private
      )
    );
    RETURN jsonb_build_object(
      'is_valid', false,
      'reason', '卡类型不匹配课程类型',
      'details', jsonb_build_object(
        'card_type', v_card.card_type,
        'class_type', p_class_type,
        'is_private', v_is_private
      )
    );
  END IF;

  -- 检查私教课时是否足够
  IF v_card.card_type = '私教课' AND
     (v_card.remaining_private_sessions IS NULL OR v_card.remaining_private_sessions <= 0) THEN
    PERFORM log_debug(
      'check_card_validity',
      '私教课时不足',
      jsonb_build_object(
        'remaining_private_sessions', v_card.remaining_private_sessions
      )
    );
    RETURN jsonb_build_object(
      'is_valid', false,
      'reason', '私教课时不足',
      'details', jsonb_build_object(
        'remaining_private_sessions', v_card.remaining_private_sessions
      )
    );
  END IF;

  -- 检查团课课时是否足够
  IF v_card.card_type = '团课' AND v_card.card_category = '课时卡' AND
     (v_card.remaining_group_sessions IS NULL OR v_card.remaining_group_sessions <= 0) THEN
    PERFORM log_debug(
      'check_card_validity',
      '团课课时不足',
      jsonb_build_object(
        'remaining_group_sessions', v_card.remaining_group_sessions
      )
    );
    RETURN jsonb_build_object(
      'is_valid', false,
      'reason', '团课课时不足',
      'details', jsonb_build_object(
        'remaining_group_sessions', v_card.remaining_group_sessions
      )
    );
  END IF;

  -- 会员卡有效
  RETURN jsonb_build_object(
    'is_valid', true,
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

-- 修复课时扣除函数中的卡类型判断
CREATE OR REPLACE FUNCTION deduct_membership_sessions(
  p_card_id uuid,
  p_class_type text,
  p_is_private boolean DEFAULT false
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_card RECORD;
  v_class_type class_type;
  v_member_id uuid;
BEGIN
  -- 获取会员卡信息
  SELECT * INTO v_card FROM membership_cards WHERE id = p_card_id FOR UPDATE;
  
  -- 获取会员ID
  v_member_id := v_card.member_id;
  
  -- 记录开始扣除课时
  PERFORM log_debug(
    'deduct_membership_sessions',
    '扣除课时开始',
    jsonb_build_object(
      'card_id', p_card_id,
      'member_id', v_member_id,
      'card_type', v_card.card_type,
      'class_type', p_class_type,
      'is_private', p_is_private
    )
  );

  -- 检查会员卡是否已过期
  IF v_card.valid_until IS NOT NULL AND v_card.valid_until < CURRENT_DATE THEN
    PERFORM log_debug(
      'deduct_membership_sessions',
      '会员卡已过期，不扣除课时',
      jsonb_build_object(
        'card_id', p_card_id,
        'member_id', v_member_id,
        'valid_until', v_card.valid_until,
        'current_date', CURRENT_DATE
      )
    );
    RETURN FALSE;
  END IF;

  -- 修复：私教课程
  IF p_is_private AND v_card.card_type = '私教课' THEN
    -- 检查剩余私教课时
    IF v_card.remaining_private_sessions IS NULL OR v_card.remaining_private_sessions <= 0 THEN
      PERFORM log_debug(
        'deduct_membership_sessions',
        '私教课时不足，不扣除',
        jsonb_build_object(
          'card_id', p_card_id,
          'member_id', v_member_id,
          'remaining_private_sessions', v_card.remaining_private_sessions
        )
      );
      RETURN FALSE;
    END IF;

    -- 扣除私教课时
    UPDATE membership_cards
    SET remaining_private_sessions = remaining_private_sessions - 1
    WHERE id = p_card_id;

    -- 记录私教课时扣除
    PERFORM log_debug(
      'deduct_membership_sessions',
      '私教课时已扣除',
      jsonb_build_object(
        'card_id', p_card_id,
        'member_id', v_member_id,
        'remaining_private_sessions', v_card.remaining_private_sessions - 1
      )
    );
    
    RETURN TRUE;
  -- 修复：团课课程
  ELSIF NOT p_is_private AND v_card.card_type = '团课' THEN
    -- 检查剩余团课课时
    IF v_card.remaining_group_sessions IS NULL OR v_card.remaining_group_sessions <= 0 THEN
      PERFORM log_debug(
        'deduct_membership_sessions',
        '团课课时不足，不扣除',
        jsonb_build_object(
          'card_id', p_card_id,
          'member_id', v_member_id,
          'remaining_group_sessions', v_card.remaining_group_sessions
        )
      );
      RETURN FALSE;
    END IF;

    -- 扣除团课课时
    UPDATE membership_cards
    SET remaining_group_sessions = remaining_group_sessions - 1
    WHERE id = p_card_id;

    -- 记录团课课时扣除
    PERFORM log_debug(
      'deduct_membership_sessions',
      '团课课时已扣除',
      jsonb_build_object(
        'card_id', p_card_id,
        'member_id', v_member_id,
        'remaining_group_sessions', v_card.remaining_group_sessions - 1
      )
    );
    
    RETURN TRUE;
  ELSE
    -- 记录未扣除课时的原因
    PERFORM log_debug(
      'deduct_membership_sessions',
      '未扣除课时',
      jsonb_build_object(
        'reason', '卡类型与课程类型不匹配',
        'card_id', p_card_id,
        'member_id', v_member_id,
        'card_type', v_card.card_type,
        'class_type', p_class_type,
        'is_private', p_is_private
      )
    );
    
    RETURN FALSE;
  END IF;
END;
$$; 