# Test Data Documentation

## Monthly Membership Members

| Name | Email | Membership Type | Expiry | Status | Initial Check-ins |
|------|-------|----------------|---------|---------|-------------------|
| 张三 | zhang.san.test.mt@example.com | single_daily_monthly | Current + 30 days | Active | 1 morning (regular) |
| 李四 | li.si.test.mt@example.com | double_daily_monthly | Current + 15 days | Active | 1 morning + 1 evening (regular) |
| 王五 | wang.wu.test.mt@example.com | single_daily_monthly | Current - 5 days | Expired | 1 morning (extra) |

## Class-based Membership Members

| Name | Email | Membership Type | Remaining Classes | Status |
|------|-------|----------------|-------------------|---------|
| 赵六 | zhao.liu.test.mt@example.com | ten_classes | 5 | Active |
| 孙七 | sun.qi.test.mt@example.com | two_classes | 2 | Active |
| 周八 | zhou.ba.test.mt@example.com | single_class | 0 | No classes left |

## Duplicate Name Members

| Name | Email | Membership Type | Status | Notes |
|------|-------|----------------|---------|-------|
| 王小明 | wang.xm1.test.mt@example.com | ten_classes | 3 classes left | Same name, different membership |
| 王小明 | wang.xm2.test.mt@example.com | single_daily_monthly | Active (Current + 15 days) | Same name, different membership |

## Special Cases

| Name | Email | Membership Type | Status | Notes |
|------|-------|----------------|---------|-------|
| MT-Fighter2024 | mt.fighter.test.mt@example.com | double_daily_monthly | Active | Special characters in name |
| 李Anna | li.anna.test.mt@example.com | ten_classes | 8 classes left | Mixed language name |
| 新学员 | new.member.test.mt@example.com | None | New member | No membership |

## Test Scenarios

### Monthly Membership Tests
- Single daily member (张三) can check in once per day
- Double daily member (李四) can check in twice per day
- Expired member (王五) gets extra check-ins

### Class-based Membership Tests
- Members with remaining classes get regular check-ins
- Members with no classes left get extra check-ins

### Duplicate Name Handling
- Both 王小明 require email verification
- System should handle email-based disambiguation

### Special Cases
- Special characters in names (MT-Fighter2024)
- Mixed language names (李Anna)
- New member handling (新学员)