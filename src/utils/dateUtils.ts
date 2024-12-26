// Add new function to format date
export const formatDate = (date: string): string => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(date));
};

export const isWithinClassHours = (classType: 'morning' | 'evening'): boolean => {
  const now = new Date();
  const hour = now.getHours();
  const minutes = now.getMinutes();
  const time = hour + minutes / 60;

  return classType === 'morning' 
    ? time >= 8.5 && time <= 11  // 8:30 - 11:00
    : time >= 16.5 && time <= 19; // 16:30 - 19:00
};

export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
};

export const formatDateForDB = (date: Date | string | null): string | null => {
  if (!date) return null;
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return null;
    
    return dateObj.toISOString();
  } catch {
    return null;
  }
};