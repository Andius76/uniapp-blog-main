<script setup>
import { onLaunch, onShow } from '@dcloudio/uni-app';

// 检查管理员登录状态
const checkAdminLoginStatus = () => {
  // 获取当前页面路径
  const pages = getCurrentPages();
  if (pages.length === 0) return;
  
  const currentPage = pages[pages.length - 1];
  const currentPath = `/${currentPage.route}`;
  
  // 如果不是管理员登录页且未登录，则重定向到管理员登录页
  if (currentPath !== '/pages/admin-login/admin-login' && !uni.getStorageSync('admin_token')) {
    uni.redirectTo({
      url: '/pages/admin-login/admin-login'
    });
  }
};

onLaunch(() => {
  console.log('Admin App Launch');
});

onShow(() => {
  // 每次切回应用时检查管理员登录状态
  checkAdminLoginStatus();
});
</script>

<style>
@import "@/static/icon/iconfont.css";

/* 全局样式 */
page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: #f5f7fa;
  color: #333;
}

/* 后台管理全局样式 */
.admin-container {
  padding: 20px;
  box-sizing: border-box;
}

.admin-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.admin-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #303133;
}

/* 表单通用样式 */
.admin-form-item {
  margin-bottom: 22px;
}

.admin-form-label {
  display: block;
  margin-bottom: 8px;
  color: #606266;
  font-size: 14px;
}

.admin-button {
  padding: 10px 20px;
  background-color: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.admin-button:hover {
  background-color: #66b1ff;
}

.admin-button:active {
  background-color: #3a8ee6;
}

.admin-button.danger {
  background-color: #f56c6c;
}

.admin-button.danger:hover {
  background-color: #f78989;
}

/* 全局弹窗层级修复 */
/* #ifdef H5 */
/* 确保uni弹窗显示在最顶层 */
.uni-popup {
  z-index: 99999 !important;
}

.uni-popup .uni-popup__mask {
  z-index: 99998 !important;
}

.uni-popup .uni-popup__wrapper {
  z-index: 99999 !important;
}

.uni-toast {
  z-index: 100000 !important;
}
/* #endif */
</style>