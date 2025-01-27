# JR泰拳馆签到系统

## 目录
1. [项目概述](#项目概述)
2. [功能模块](#功能模块)
3. [数据结构](#数据结构)
4. [业务规则](#业务规则)
5. [界面设计](#界面设计)
6. [开发指南](#开发指南)

---

## 项目概述
JR泰拳馆签到系统是一个用于管理会员签到的 Web 应用，旨在简化会员签到流程、提升管理效率，并为管理员提供数据统计和分析功能。

### 核心目标
1. **会员签到管理**：支持新老会员签到，自动处理会员卡类型和签到规则。
2. **会员信息管理**：记录会员的基本信息、会员卡类型及状态。
3. **数据统计与分析**：为管理员提供签到记录查询和数据分析功能。

### 技术栈
- **前端**：React + TypeScript
- **后端**：Supabase（基于 PostgreSQL）
- **数据库**：PostgreSQL
- **开发工具**：Docker（用于本地开发环境）

### 环境要求
- Node.js >= 18
- npm >= 9
- Docker（用于本地开发）

---

## 功能模块

### 1. 页面功能
1. **主页**
   - 提供新老会员签到入口。
   - 提供管理员后台登录入口。

2. **新会员签到页**
   - 支持新会员（首次上课）签到。
   - 自动将新会员转换为老会员。

3. **老会员签到页**
   - 支持会员身份验证。
   - 记录签到信息并更新会员状态。

4. **管理员后台**
   - 提供会员信息管理功能。
   - 支持签到记录查询和数据统计分析。

---

## 数据结构

### 1. 会员信息
- **会员姓名或微信名**：用于身份识别。
- **联系方式（email）**：用于重名时的二次验证。
- **卡类型**：
  - 课时卡：单次卡、两次卡、10次卡。
  - 月卡：单次月卡、双次月卡。
- **剩余课程次数或月卡到期日期**：用于判断会员卡状态。


### 2. 签到记录
- **会员姓名或微信名**：关联会员信息。
- **团课类型**：早课（9:00-10:30）或晚课（17:00-18:30）。
- **签到时间戳**：记录签到的具体时间。
- **签到日期**：记录签到的日期。
- **签到类型**：正常签到或额外签到。

---

## 业务规则

### 1. 会员卡规则
- **课时卡**：
  - 单次卡：1次课时。
  - 两次卡：2次课时。
  - 10次卡：10次课时。
  - 无到期限制，按剩余次数计算。
- **月卡**：
  - 单次月卡：每天最多1次团课，有效期1个月。
  - 双次月卡：每天最多2次团课，有效期1个月。

### 2. 签到规则
- **时间限制**：
  - 当天内均可签到，支持提前和补签。
  - 课程时间：周一到周六（早课：9:00-10:30，晚课：17:00-18:30）。
- **重复签到限制**：
  - 同一天的同一时段（早课/晚课）不可重复签到。
  - 不同天的同一时段视为新的签到。
  - 同一天的不同时段签到按会员卡类型判断：
    - 单次月卡：每天限1个时段正常签到。
    - 双次月卡：每天可2个时段正常签到。
- **签到流程**：
  1. 输入姓名/微信名。
  2. 重名时需邮箱验证。
  3. 验证身份（不区分大小写和空格）。
  4. 更新会员信息（如扣减课时）。

### 3. 特殊情况处理
- **额外签到**：
  - 课时用完。
  - 超过每日签到次数。
  - 月卡过期。
  - 新会员首次签到。
- **新会员转换**：
  - 首次签到后立即转为老会员。
- **重名处理**：
  - 需要邮箱二次验证。
  - 验证失败提示检查输入。

---

## 界面设计

### 1. 视觉风格
- **主色调**：泰拳传统红蓝色。
- **设计风格**：蒙德里安风格，简约大气。
- **元素设计**：添加泰拳元素（如拳套 emoji），避免无意义装饰。

### 2. 交互设计
- **多语言支持**：主页中英双语对照。
- **友好提示**：清晰的错误提示和操作反馈。
- **简洁流程**：减少操作步骤，提升用户体验。

--By Hongyi Ji hongyiji224@gmail.com