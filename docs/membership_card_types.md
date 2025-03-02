# 会员卡类型不一致问题分析

## 当前状态

经过检查，系统中的会员卡类型存在不一致的情况。数据库中的会员卡记录使用了混合的命名方式（中英文混用）和不一致的类型分类。

### 数据库中的会员卡类型

```
 card_type | card_category |  card_subtype  
-----------+---------------+----------------
 class     | group         | single_class
 class     | group         | ten_classes
 class     | group         | two_classes
 class     |               | ten_classes
 group     | session       | 10_sessions
 group     | session       | standard
 group     | session       | ten_sessions
 group     | session       | two_sessions
 group     | sessions      | ten_sessions
 monthly   |               | single_monthly
 private   | session       | 10_sessions
 团课      | 月卡          | 单次月卡
 团课      | 月卡          | 双次月卡
 团课      | 课时卡        | 10次卡
 团课      | 课时卡        | 单次卡
 私教      | private       | ten_private
 私教      |               | 10次卡
 私教      |               | ten_private
 私教      |               | 单次卡
```

### 代码中定义的会员卡类型

在 `src/types/database.ts` 中定义的会员卡类型枚举：

```typescript
CardType: "class" | "monthly" | "private";
CardCategory: "group" | "private";
CardSubtype: 
  | "single_class" 
  | "two_classes" 
  | "ten_classes" 
  | "single_monthly" 
  | "double_monthly" 
  | "single_private" 
  | "ten_private";
```

## 问题分析

1. **中英文混用**：数据库中同时存在中文和英文的卡类型，如 `团课` 和 `class`，`私教` 和 `private`。

2. **类型不一致**：同一概念使用了不同的表示方式，如 `ten_classes` 和 `10次卡`，`session` 和 `课时卡`。

3. **类别重复**：有些记录的 `card_type` 和 `card_category` 存在概念重叠，如 `private` 类型和 `private` 类别。

4. **空值问题**：部分记录的 `card_category` 为空，不符合完整的分类体系。

5. **命名不规范**：存在 `10_sessions` 和 `ten_sessions` 这样的命名不一致。

## 解决方案

我们已经创建了两个迁移脚本：

1. `20250401000000_fix_membership_card_inconsistencies.sql`：用于标准化会员卡类型，将所有记录转换为统一的英文命名。

2. `20250401000001_rollback_membership_card_inconsistencies.sql`：用于回滚标准化操作，恢复到原始状态。

目前已执行了回滚脚本，系统保持原有的混合状态。

## 建议

1. **统一命名规范**：
   - 所有卡类型使用英文：`group`（团课）、`private`（私教）
   - 卡类别统一为：`session`（课时卡）、`monthly`（月卡）
   - 子类型统一命名：`single_class`、`two_classes`、`ten_classes`、`single_monthly`、`double_monthly`、`ten_private`

2. **数据清理**：
   - 执行标准化迁移脚本，统一所有记录的命名
   - 确保所有记录都有完整的类型、类别和子类型

3. **代码更新**：
   - 更新前端代码中的卡类型显示逻辑，确保与数据库一致
   - 在新增会员卡时强制使用标准化的类型

4. **文档更新**：
   - 更新系统文档，明确说明会员卡的分类体系
   - 为开发人员提供清晰的类型使用指南

## 执行计划

1. 在测试环境中执行标准化脚本
2. 验证系统功能是否正常
3. 更新前端代码以适应标准化的类型
4. 在生产环境中执行标准化脚本
5. 监控系统运行情况，确保没有异常 