# 签到逻辑文档 Check-in Logic Documentation

## 1. 会员验证 Member Verification

### 1.1 名字匹配规则
- 名字规范化处理(去除空格、转小写)
- 优先进行精确匹配
- 如果没有精确匹配，尝试模糊匹配
- 如果找到多个匹配，要求提供邮箱验证

### 1.2 重名处理
- 检测是否存在重名会员
- 如果存在重名，强制要求提供邮箱验证
- 邮箱+名字组合必须唯一匹配

### 1.3 表单验证流程
- 初始状态：
  - 名字为必填
  - 邮箱为选填
- 重名触发状态：
  - 系统检测到重名
  - 邮箱字段转为必填
  - 显示邮箱验证界面
- 验证完成：
  - 使用名字+邮箱组合确认身份
  - 进行签到处理

## 2. 签到类型判定 Check-in Type Determination

### 2.1 新会员签到
- 新会员的所有签到都标记为额外签到(is_extra = true)
- 签到后更新会员状态(is_new_member = false)
- 需要管理员关注并提醒付费

### 2.2 普通会员签到
按会员卡类型判定：

#### 月卡会员 (Monthly)
- 检查会员卡是否过期
- 单日月卡(single_daily_monthly)：每天限1次常规签到
- 双日月卡(double_daily_monthly)：每天限2次常规签到
- 超出限制的签到标记为额外签到

#### 次卡会员 (Class-based)
- 检查剩余课时
- 有剩余课时：常规签到并扣减课时
- 无剩余课时：标记为额外签到

#### 无会员卡
- 所有签到都标记为额外签到

## 3. 签到限制 Check-in Restrictions

### 3.1 重复签到限制
- 同一会员不能在同一时段(早课/晚课)重复签到
- 系统自动检测并阻止重复签到

### 3.2 签到时段
- 早课和晚课可以在当天任意时间签到
- 每个时段只能签到一次

## 4. 数据更新 Data Updates

### 4.1 会员信息更新
- 次卡扣减课时
- 更新额外签到计数
- 更新新会员状态

### 4.2 签到记录
- 记录签到时间
- 记录签到类型(常规/额外)
- 记录课程类型(早课/晚课)

## 5. 错误处理 Error Handling

### 5.1 常见错误
- 重复签到
- 会员卡过期
- 课时不足
- 超出每日限制
- 会员不存在
- 重名验证失败

### 5.2 错误提示
- 提供中英双语错误信息
- 清晰指示下一步操作
- 友好的用户提示