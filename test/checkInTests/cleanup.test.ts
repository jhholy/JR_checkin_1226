import { describe, it } from 'vitest';
import { cleanupTestData } from '../helpers/testData';

describe('Database Cleanup', () => {
  it('should clean up test data', async () => {
    console.log('开始清理测试数据...');
    await cleanupTestData();
    console.log('测试数据清理完成');
  });
});  