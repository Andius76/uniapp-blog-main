import { getBaseUrl } from './request';

/**
 * 格式化头像URL
 * @param {String} url - 头像URL
 * @returns {String} - 格式化后的URL
 */
export function formatAvatarUrl(url) {
  // 对于空值或未定义，返回默认头像
  if (!url) return '/static/images/avatar.png';
  
  // 移除URL中可能存在的多余空格
  url = url.trim();
  
  // 确保不是字符串形式的null或undefined
  if (url === 'null' || url === 'undefined') {
    return '/static/images/avatar.png';
  }
  
  // 完整URL处理：如果已经是完整URL（包含http）则不处理
  if (url.startsWith('http')) {
    // 检查并修复双斜杠问题
    if (url.includes('//uploads')) {
      url = url.replace('//uploads', '/uploads');
    }
    return url;
  }
  // 静态资源处理：如果是静态资源路径则不处理
  else if (url.startsWith('/static')) {
    return url;
  }
  // 其他情况：添加基础URL前缀
  else {
    if (url.startsWith('/')) {
      return getBaseUrl() + url;
    } else {
      return getBaseUrl() + '/' + url;
    }
  }
} 