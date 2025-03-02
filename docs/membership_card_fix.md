# 会员卡数据修复文档

## 背景

在系统开发过程中，会员卡数据的表示方式存在不一致的情况，包括：

1. 中英文混用（如 '团课' 和 'class'）
2. 命名变体（如 'double_monthly' 和 'couple_monthly'）
3. 枚举定义不匹配（数据库中的值与代码中的类型定义不一致）
4. 字段使用混乱（如将子类型值错误地存储在类别字段中）

这些不一致可能导致系统在处理会员卡时出现问题，特别是在搜索、过滤和统计功能中。

## 修复目标

1. 统一所有会员卡数据的表示方式
2. 确保数据库中的值与代码中的类型定义一致
3. 确保字段使用正确（类型、类别、子类型）
4. 提供清晰的文档，说明标准值和使用方式

## 标准值定义

### 卡类型 (card_type)

卡类型表示会员卡的基本类别，标准值为：

| 值 | 说明 | 备注 |
|---|---|---|
| `group` | 团体课程卡 | 包括月卡、季卡、年卡等 |
| `class` | 课时卡 | 按课程次数计费 |
| `private` | 私教课程卡 | 私人教练课程 |

### 卡类别 (card_category)

卡类别表示会员卡的具体类别，标准值为：

| 值 | 说明 | 适用卡类型 |
|---|---|---|
| `monthly` | 月卡 | group |
| `quarterly` | 季卡 | group |
| `annual` | 年卡 | group |
| `ten_classes` | 10节课卡 | class |
| `twenty_classes` | 20节课卡 | class |
| `ten_private` | 10节私教卡 | private |
| `twenty_private` | 20节私教卡 | private |

### 卡子类型 (card_subtype)

卡子类型仅适用于团体课程卡（group），表示具体的使用人数，标准值为：

| 值 | 说明 | 适用卡类别 |
|---|---|---|
| `single_monthly` | 单人月卡 | monthly |
| `couple_monthly` | 双人月卡 | monthly |
| `family_monthly` | 家庭月卡 | monthly |
| `single_quarterly` | 单人季卡 | quarterly |
| `couple_quarterly` | 双人季卡 | quarterly |
| `family_quarterly` | 家庭季卡 | quarterly |
| `single_annual` | 单人年卡 | annual |
| `couple_annual` | 双人年卡 | annual |
| `family_annual` | 家庭年卡 | annual |

**注意**：课时卡（class）和私教卡（private）不使用子类型，这些卡的 `card_subtype` 字段应为 `NULL`。

### 教练类型 (trainer_type)

教练类型表示提供课程的教练级别，标准值为：

| 值 | 说明 |
|---|---|
| `jr` | 初级教练 |
| `senior` | 高级教练 |

## 修复内容

### 1. 卡类型修复

- 将 `monthly` 改为 `group`（月卡是团课的一种类别）

### 2. 卡类别修复

- 将 `group` 改为 `monthly`（团课作为类型，而非类别）
- 将 `session` 改为 `ten_classes`（统一课时卡命名）

### 3. 卡子类型修复

- 将 `double_monthly` 改为 `couple_monthly`（统一命名风格）
- 将课时卡和私教卡的子类型设为 `NULL`
- 确保团课卡有正确的子类型值

### 4. 一致性修复

- 确保卡类型和类别的一致性（如 `group` 类型只能有 `monthly`/`quarterly`/`annual` 类别）
- 确保卡类别和子类型的一致性（如 `monthly` 类别只能有 `single_monthly`/`couple_monthly`/`family_monthly` 子类型）

### 5. 枚举类型更新

更新数据库中的枚举类型定义，确保与标准值一致：

```sql
CREATE TYPE card_type_enum AS ENUM ('group', 'class', 'private');
CREATE TYPE card_category_enum AS ENUM (
    'monthly', 'quarterly', 'annual', 
    'ten_classes', 'twenty_classes', 
    'ten_private', 'twenty_private'
);
CREATE TYPE card_subtype_enum AS ENUM (
    'single_monthly', 'couple_monthly', 'family_monthly',
    'single_quarterly', 'couple_quarterly', 'family_quarterly',
    'single_annual', 'couple_annual', 'family_annual'
);
```

## TypeScript 类型定义

为确保前端代码与数据库定义一致，应更新 TypeScript 类型定义：

```typescript
// 卡类型
export type CardType = 'group' | 'class' | 'private';

// 卡类别
export type CardCategory = 
  | 'monthly' | 'quarterly' | 'annual'  // 团课类别
  | 'ten_classes' | 'twenty_classes'    // 课时卡类别
  | 'ten_private' | 'twenty_private';   // 私教卡类别

// 卡子类型（仅适用于团课）
export type CardSubtype = 
  | 'single_monthly' | 'couple_monthly' | 'family_monthly'
  | 'single_quarterly' | 'couple_quarterly' | 'family_quarterly'
  | 'single_annual' | 'couple_annual' | 'family_annual';

// 教练类型
export type TrainerType = 'jr' | 'senior';
```

## 使用指南

### 创建新会员卡时

1. 根据卡的基本类型，选择正确的 `card_type`
2. 根据卡的具体类别，选择正确的 `card_category`
3. 如果是团课卡（`group`），根据使用人数选择正确的 `card_subtype`
4. 如果是课时卡（`class`）或私教卡（`private`），不设置 `card_subtype`

### 查询会员卡时

1. 按卡类型查询：使用 `card_type` 字段
2. 按卡类别查询：使用 `card_category` 字段
3. 按使用人数查询（仅限团课）：使用 `card_subtype` 字段

## 注意事项

1. 此修复不会改变系统的功能逻辑，只是统一了数据表示方式
2. 修复后，请严格遵循本文档中定义的标准值
3. 如需添加新的卡类型或子类型，请同时更新数据库枚举类型、TypeScript类型定义和相关文档 