#!/bin/bash

# 会员卡数据修复执行脚本

# 显示彩色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}开始会员卡数据修复流程...${NC}"

# 1. 备份当前数据
echo -e "${YELLOW}1. 备份当前数据...${NC}"
BACKUP_FILE="membership_cards_backup_$(date +%Y%m%d_%H%M%S).sql"
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c "COPY (SELECT * FROM membership_cards) TO STDOUT WITH CSV HEADER" > "backups/$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ 数据备份成功: backups/$BACKUP_FILE${NC}"
else
  echo -e "${RED}✗ 数据备份失败，终止操作${NC}"
  exit 1
fi

# 2. 执行验证脚本，检查修复前的状态
echo -e "${YELLOW}2. 检查修复前的状态...${NC}"
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -f scripts/validate_membership_cards.sql > "logs/pre_fix_validation_$(date +%Y%m%d_%H%M%S).log"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ 修复前状态检查完成${NC}"
else
  echo -e "${RED}✗ 修复前状态检查失败，但将继续执行${NC}"
fi

# 3. 应用修复脚本
echo -e "${YELLOW}3. 应用修复脚本...${NC}"
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -f supabase/migrations/20250401000000_fix_membership_card_inconsistencies.sql

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ 修复脚本应用成功${NC}"
else
  echo -e "${RED}✗ 修复脚本应用失败，将尝试恢复备份${NC}"
  PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c "DELETE FROM membership_cards; COPY membership_cards FROM STDIN WITH CSV HEADER" < "backups/$BACKUP_FILE"
  echo -e "${YELLOW}已尝试恢复备份，请检查数据库状态${NC}"
  exit 1
fi

# 4. 执行验证脚本，检查修复后的状态
echo -e "${YELLOW}4. 检查修复后的状态...${NC}"
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -f scripts/validate_membership_cards.sql > "logs/post_fix_validation_$(date +%Y%m%d_%H%M%S).log"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ 修复后状态检查完成${NC}"
else
  echo -e "${RED}✗ 修复后状态检查失败${NC}"
  exit 1
fi

# 5. 完成
echo -e "${GREEN}会员卡数据修复完成！${NC}"
echo -e "${YELLOW}请检查日志文件，确认修复结果${NC}"
echo -e "${YELLOW}如有问题，可使用备份文件恢复: backups/$BACKUP_FILE${NC}" 