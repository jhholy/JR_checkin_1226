import { useState, useEffect } from 'react';

interface CacheData<T> {
  data: T;
  timestamp: number;
}

interface CacheConfig {
  key: string;
  ttl: number; // 缓存有效期（毫秒）
}

export function useDashboardCache<T>(
  fetchData: () => Promise<T>,
  config: CacheConfig
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // 检查缓存
        const cached = localStorage.getItem(config.key);
        if (cached) {
          const { data: cachedData, timestamp }: CacheData<T> = JSON.parse(cached);
          const isValid = Date.now() - timestamp < config.ttl;
          
          if (isValid) {
            setData(cachedData);
            setLoading(false);
            return;
          }
        }

        // 缓存无效或不存在，获取新数据
        const newData = await fetchData();
        
        // 更新缓存
        const cacheData: CacheData<T> = {
          data: newData,
          timestamp: Date.now()
        };
        localStorage.setItem(config.key, JSON.stringify(cacheData));
        
        setData(newData);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [config.key, config.ttl]);

  return { data, loading, error };
} 