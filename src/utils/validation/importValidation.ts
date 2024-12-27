export const validateImportData = (data: any[]) => {
  const errors: string[] = [];
  
  data.forEach((row, index) => {
    // 验证会员姓名
    if (!row.memberName?.trim()) {
      errors.push(`第 ${index + 1} 行：会员姓名不能为空`);
    }

    // 验证课程类型
    if (!['morning', 'evening'].includes(row.classType)) {
      errors.push(`第 ${index + 1} 行：课程类型必须是 morning 或 evening`);
    }

    // 验证签到时间
    if (!row.checkInTime || isNaN(new Date(row.checkInTime).getTime())) {
      errors.push(`第 ${index + 1} 行：签到时间格式不正确`);
    }

    // 验证额外签到标记
    if (typeof row.isExtra !== 'boolean') {
      errors.push(`第 ${index + 1} 行：额外签到必须是布尔值`);
    }
  });

  return errors;
}; 