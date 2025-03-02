-- 会员卡数据修复迁移脚本
-- 此脚本用于修复会员卡数据中的不一致性

-- 开始事务
BEGIN;

-- 记录开始时间
DO $$
BEGIN
    RAISE NOTICE '开始执行会员卡数据修复 - %', NOW();
END $$;

-- 备份当前数据（以防需要回滚）
CREATE TEMPORARY TABLE membership_cards_backup AS
SELECT * FROM membership_cards;

-- 记录修复前的数据状态
DO $$
BEGIN
    RAISE NOTICE '修复前会员卡数量: %', (SELECT COUNT(*) FROM membership_cards);
END $$;

-- 1. 修复卡类型 (card_type)
-- 将 'monthly' 改为 'group'
UPDATE membership_cards
SET card_type = 'group'
WHERE card_type = 'monthly';

-- 2. 修复卡类别 (card_category)
-- 将 'group' 改为 'monthly'
UPDATE membership_cards
SET card_category = 'monthly'
WHERE card_category = 'group';

-- 将 'session' 改为 'ten_classes'
UPDATE membership_cards
SET card_category = 'ten_classes'
WHERE card_category = 'session';

-- 3. 修复卡子类型 (card_subtype)
-- 将 'double_monthly' 改为 'couple_monthly'
UPDATE membership_cards
SET card_subtype = 'couple_monthly'
WHERE card_subtype = 'double_monthly';

-- 将 'single_class' 改为 NULL (因为课程卡不应有子类型)
UPDATE membership_cards
SET card_subtype = NULL
WHERE card_subtype = 'single_class';

-- 将 'two_classes' 改为 NULL (因为课程卡不应有子类型)
UPDATE membership_cards
SET card_subtype = NULL
WHERE card_subtype = 'two_classes';

-- 将 'ten_classes' 改为 NULL (因为这应该是card_category而非card_subtype)
UPDATE membership_cards
SET card_subtype = NULL
WHERE card_subtype = 'ten_classes';

-- 将 'single_private' 改为 NULL (因为私教卡不应有子类型)
UPDATE membership_cards
SET card_subtype = NULL
WHERE card_subtype = 'single_private';

-- 将 'ten_private' 改为 NULL (因为这应该是card_category而非card_subtype)
UPDATE membership_cards
SET card_subtype = NULL
WHERE card_subtype = 'ten_private';

-- 4. 确保卡类型和类别的一致性
-- 确保所有 'group' 类型的卡都有正确的类别
UPDATE membership_cards
SET card_category = 'monthly'
WHERE card_type = 'group' AND card_category NOT IN ('monthly', 'quarterly', 'annual');

-- 确保所有 'class' 类型的卡都有正确的类别
UPDATE membership_cards
SET card_category = 'ten_classes'
WHERE card_type = 'class' AND card_category NOT IN ('ten_classes', 'twenty_classes');

-- 确保所有 'private' 类型的卡都有正确的类别
UPDATE membership_cards
SET card_category = 'ten_private'
WHERE card_type = 'private' AND card_category NOT IN ('ten_private', 'twenty_private');

-- 5. 确保卡类别和子类型的一致性
-- 确保月卡子类型正确
UPDATE membership_cards
SET card_subtype = 'single_monthly'
WHERE card_category = 'monthly' AND (card_subtype IS NULL OR card_subtype NOT IN ('single_monthly', 'couple_monthly', 'family_monthly'));

-- 确保季卡子类型正确
UPDATE membership_cards
SET card_subtype = 'single_quarterly'
WHERE card_category = 'quarterly' AND (card_subtype IS NULL OR card_subtype NOT IN ('single_quarterly', 'couple_quarterly', 'family_quarterly'));

-- 确保年卡子类型正确
UPDATE membership_cards
SET card_subtype = 'single_annual'
WHERE card_category = 'annual' AND (card_subtype IS NULL OR card_subtype NOT IN ('single_annual', 'couple_annual', 'family_annual'));

-- 确保非团课卡没有子类型
UPDATE membership_cards
SET card_subtype = NULL
WHERE card_category NOT IN ('monthly', 'quarterly', 'annual');

-- 6. 更新枚举类型定义（如果需要）
-- 首先检查是否存在这些类型
DO $$
BEGIN
    -- 检查并更新card_type_enum
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'card_type_enum') THEN
        -- 删除旧的枚举类型
        DROP TYPE IF EXISTS card_type_enum CASCADE;
        
        -- 创建新的枚举类型
        CREATE TYPE card_type_enum AS ENUM ('group', 'class', 'private');
        
        -- 更新列类型
        ALTER TABLE membership_cards 
        ALTER COLUMN card_type TYPE card_type_enum 
        USING card_type::card_type_enum;
    END IF;
    
    -- 检查并更新card_category_enum
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'card_category_enum') THEN
        -- 删除旧的枚举类型
        DROP TYPE IF EXISTS card_category_enum CASCADE;
        
        -- 创建新的枚举类型
        CREATE TYPE card_category_enum AS ENUM (
            'monthly', 'quarterly', 'annual', 
            'ten_classes', 'twenty_classes', 
            'ten_private', 'twenty_private'
        );
        
        -- 更新列类型
        ALTER TABLE membership_cards 
        ALTER COLUMN card_category TYPE card_category_enum 
        USING card_category::card_category_enum;
    END IF;
    
    -- 检查并更新card_subtype_enum
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'card_subtype_enum') THEN
        -- 删除旧的枚举类型
        DROP TYPE IF EXISTS card_subtype_enum CASCADE;
        
        -- 创建新的枚举类型
        CREATE TYPE card_subtype_enum AS ENUM (
            'single_monthly', 'couple_monthly', 'family_monthly',
            'single_quarterly', 'couple_quarterly', 'family_quarterly',
            'single_annual', 'couple_annual', 'family_annual'
        );
        
        -- 更新列类型
        ALTER TABLE membership_cards 
        ALTER COLUMN card_subtype TYPE card_subtype_enum 
        USING card_subtype::card_subtype_enum;
    END IF;
END $$;

-- 记录修复后的数据状态
DO $$
BEGIN
    RAISE NOTICE '修复后会员卡数量: %', (SELECT COUNT(*) FROM membership_cards);
END $$;

-- 提交事务
COMMIT;

-- 记录结束时间
DO $$
BEGIN
    RAISE NOTICE '会员卡数据修复完成 - %', NOW();
END $$; 