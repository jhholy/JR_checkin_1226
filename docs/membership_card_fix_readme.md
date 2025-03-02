# 会员卡数据修复指南

本文档提供了应用会员卡数据修复的详细步骤和注意事项。

## 背景

系统中的会员卡数据存在不一致的情况，包括中英文混用、命名变体和枚举定义不匹配等问题。这些不一致可能导致系统在处理会员卡时出现问题。详细问题描述请参见 [会员卡数据修复文档](./membership_card_fix.md)。

## 修复文件

修复包含以下文件：

1. `supabase/migrations/20250401000000_fix_membership_card_inconsistencies.sql` - 数据库迁移脚本
2. `scripts/validate_membership_cards.sql` - 数据验证脚本
3. `scripts/apply_membership_card_fix.sh` - 执行脚本
4. `docs/membership_card_fix.md` - 修复文档

## 应用步骤

### 准备工作

1. 确保系统处于维护状态，没有用户正在使用
2. 确保已备份数据库

### 执行修复

1. 打开终端，进入项目根目录
2. 执行以下命令：

```bash
./scripts/apply_membership_card_fix.sh
```

3. 脚本将自动执行以下步骤：
   - 备份当前会员卡数据
   - 检查修复前的状态
   - 应用修复脚本
   - 检查修复后的状态

4. 检查日志文件，确认修复结果：
   - `logs/pre_fix_validation_*.log` - 修复前的状态
   - `logs/post_fix_validation_*.log` - 修复后的状态

### 验证修复

1. 检查日志文件中的验证结果，确保所有值都符合标准
2. 在系统中测试会员卡相关功能，确保正常工作

## 回滚方案

如果修复过程中出现问题，可以使用备份文件恢复数据：

```bash
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c "DELETE FROM membership_cards; COPY membership_cards FROM STDIN WITH CSV HEADER" < "backups/membership_cards_backup_*.sql"
```

请将 `membership_cards_backup_*.sql` 替换为实际的备份文件名。

## 注意事项

1. 此修复不会改变系统的功能逻辑，只是统一了数据表示方式
2. 修复后，请严格遵循 [会员卡数据修复文档](./membership_card_fix.md) 中定义的标准值
3. 如需添加新的卡类型或子类型，请同时更新数据库枚举类型、TypeScript类型定义和相关文档 