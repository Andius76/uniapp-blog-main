/**
 * 路由守卫 - 处理页面访问权限
 * 文件位置: /src/utils/routeGuard.js
 */

// 定义无需登录即可访问的页面路径
const whiteList = [
  '/pages/login/login', 
  '/pages/register/register',
  '/pages/forget-password/forget-password',
  '/pages/index/index',
];

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录
 */
function isLoggedIn() {
  return !!uni.getStorageSync('token');
}

/**
 * 获取当前页面路径
 * @param {Object} options - 页面参数
 * @returns {string} 页面路径
 */
function getCurrentPagePath(options) {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  let path = `/${currentPage.route}`;
  
  // 处理页面参数
  if (options && Object.keys(options).length > 0) {
    const queryParams = Object.keys(options)
      .map(key => `${key}=${options[key]}`)
      .join('&');
    path += `?${queryParams}`;
  }
  
  return path;
}

/**
 * 路由守卫方法，在页面onLoad时调用
 * @param {Object} options - 页面参数
 */
function routeGuard(options) {
  const currentPath = getCurrentPagePath(options);
  
  // 是否在白名单中
  const isWhitelisted = whiteList.some(path => currentPath.startsWith(path));
  
  // 如果不在白名单中且未登录，则跳转到登录页
  if (!isWhitelisted && !isLoggedIn()) {
    uni.showToast({
      title: '请先登录',
      icon: 'none',
      duration: 1500
    });
    
    // 记录当前页面，以便登录后返回
    const redirectUrl = encodeURIComponent(currentPath);
    
    // 延迟跳转，确保提示显示
    setTimeout(() => {
      uni.redirectTo({
        url: `/pages/login/login?redirect=${redirectUrl}`
      });
    }, 1500);
    
    return false;
  }
  
  return true;
}

export default routeGuard;
