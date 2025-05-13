<template>
  <view class="admin-container">
    <!-- 头部导航 -->
    <view class="header">
      <view class="logo">
        <text class="logo-text">博客管理系统</text>
      </view>
      <view class="user-info" @click.stop="toggleUserMenu">
        <image class="avatar" :src="userInfo.avatar || '/static/images/avatar.png'" mode="aspectFill"></image>
        <text class="username">{{ userInfo.nickname }}</text>
        <uni-icons type="arrow-down" size="12" color="#fff"></uni-icons>
        
        <!-- 用户菜单 -->
        <view class="user-menu" v-if="showUserMenu">
          <view class="menu-item" @click="logout">
            <uni-icons type="logout" size="16" color="#666"></uni-icons>
            <text>退出登录</text>
          </view>
        </view>
      </view>
    </view>
    
    <view class="main-content">
      <!-- 侧边栏导航 -->
      <view class="sidebar-container">
        <scroll-view class="sidebar" scroll-y>
          <view class="debug-info">菜单数: {{filteredMenuList.length}}</view>
          
          <!-- 按照分类分组显示菜单 -->
          <block v-for="category in menuCategories" :key="category">
            <view class="menu-category" v-if="getCategoryMenus(category).length > 0">
              <text class="category-title">{{ category }}</text>
              
              <view 
                v-for="(menu, index) in getCategoryMenus(category)" 
                :key="menu.id" 
                class="menu-item"
                :class="{ active: currentMenu === menu.id }"
                @click="handleMenuClick(menu)"
              >
                <uni-icons :type="menu.icon" size="18" :color="currentMenu === menu.id ? '#4361ee' : '#666'"></uni-icons>
                <text class="menu-text">{{ menu.name }}</text>
              </view>
            </view>
          </block>
        </scroll-view>
      </view>
      
      <!-- 内容区域 -->
      <view class="content-wrapper">
        <!-- 面包屑导航 -->
        <view class="breadcrumb">
          <text>{{ currentMenuName }}</text>
        </view>
        
        <!-- 主要内容区域 -->
        <view class="content">
          <!-- 根据currentComponent显示不同组件 -->
          <component :is="componentMap[currentComponent]"></component>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
// 统一使用 @ 路径导入组件
import UserManagement from '@/pages/admin/components/UserManagement.vue';
import ArticleManagement from '@/pages/admin/components/ArticleManagement.vue';
import RoleManagement from '@/pages/admin/components/RoleManagement.vue';
import PermissionManagement from '@/pages/admin/components/PermissionManagement.vue';
import UserRoleAssignment from '@/pages/admin/components/UserRoleAssignment.vue';
import AdminRoleAssignment from '@/pages/admin/components/AdminRoleAssignment.vue';

// 用户信息
const userInfo = ref({
  nickname: '管理员',
  avatar: '/static/images/avatar.png'
});

// 用户菜单显示状态
const showUserMenu = ref(false);

// 当前选中的菜单
const currentMenu = ref('dashboard');

// 点击切换用户菜单
const toggleUserMenu = (e) => {
  e.stopPropagation();
  showUserMenu.value = !showUserMenu.value;
};

// 关闭用户菜单的处理函数
const closeUserMenu = () => {
  showUserMenu.value = false;
};

// 菜单列表
const menuList = reactive([
  // 通用功能
  {
    id: 'dashboard',
    name: '控制台',
    icon: 'home',
    component: 'Dashboard',
    roles: ['ADMIN', 'SUPER_ADMIN'],
    category: '系统概览'
  },
  
  // 管理员模块
  {
    id: 'userManagement',
    name: '用户管理',
    icon: 'person',
    component: 'UserManagement',
    roles: ['ADMIN', 'SUPER_ADMIN'],
    category: '管理员功能'
  },
  {
    id: 'articleManagement',
    name: '文章管理',
    icon: 'upload',  // 更改为更合适的文章管理图标
    component: 'ArticleManagement',
    roles: ['ADMIN', 'SUPER_ADMIN'],
    category: '管理员功能'
  },
  
  // 超级管理员模块
  {
    id: 'roleManagement',
    name: '角色管理',
    icon: 'staff',
    component: 'RoleManagement',
    roles: ['SUPER_ADMIN'],
    category: '超级管理员功能'
  },
  {
    id: 'permissionManagement',
    name: '权限配置',
    icon: 'locked',
    component: 'PermissionManagement',
    roles: ['SUPER_ADMIN'],
    category: '超级管理员功能'
  },
  {
    id: 'userRoleAssignment',
    name: '用户角色分配',
    icon: 'auth',
    component: 'UserRoleAssignment',
    roles: ['SUPER_ADMIN'],
    category: '超级管理员功能'
  },
  {
    id: 'adminRoleAssignment',
    name: '管理员分配',
    icon: 'settings',
    component: 'AdminRoleAssignment',
    roles: ['SUPER_ADMIN'],
    category: '超级管理员功能'
  }
]);

// 当前用户角色列表 - 默认包含所有角色便于调试
const userRoles = ref(['SUPER_ADMIN', 'ADMIN']);

// 过滤后的菜单
const filteredMenuList = computed(() => {
  console.log('当前用户角色:', userRoles.value);
  const filtered = menuList.filter(menu => {
    // 判断当前用户是否有权限查看该菜单
    const hasPermission = menu.roles.some(role => userRoles.value.includes(role));
    console.log(`菜单 ${menu.name} 权限检查:`, hasPermission);
    return hasPermission;
  });
  console.log('过滤后的菜单列表:', filtered);
  return filtered.length > 0 ? filtered : menuList; // 如果过滤后为空，显示所有菜单
});

// 当前菜单名称
const currentMenuName = computed(() => {
  const menu = menuList.find(item => item.id === currentMenu.value);
  return menu ? menu.name : '';
});

// 当前显示的组件名称
const currentComponent = computed(() => {
  const menu = menuList.find(item => item.id === currentMenu.value);
  return menu ? menu.component : null;
});

// 组件映射
const componentMap = {
  UserManagement,
  ArticleManagement,
  RoleManagement,
  PermissionManagement,
  UserRoleAssignment,
  AdminRoleAssignment,
  // 默认控制台组件
  Dashboard: {
    template: `
      <view class="dashboard">
        <view class="dashboard-header">
          <text class="welcome-text">欢迎使用博客管理系统</text>
          <text class="date-text">{{ getCurrentDate() }}</text>
        </view>
        
        <view class="stat-cards">
          <view class="stat-card">
            <view class="stat-card-header">用户总数</view>
            <view class="stat-card-value">1,256</view>
            <view class="stat-card-footer">
              <text class="stat-trend stat-up">↑12.5%</text>
              <text class="stat-period">较上月</text>
            </view>
          </view>
          
          <view class="stat-card">
            <view class="stat-card-header">文章总数</view>
            <view class="stat-card-value">328</view>
            <view class="stat-card-footer">
              <text class="stat-trend stat-up">↑8.3%</text>
              <text class="stat-period">较上月</text>
            </view>
          </view>
          
          <view class="stat-card">
            <view class="stat-card-header">评论总数</view>
            <view class="stat-card-value">2,187</view>
            <view class="stat-card-footer">
              <text class="stat-trend stat-down">↓3.2%</text>
              <text class="stat-period">较上月</text>
            </view>
          </view>
        </view>
        
        <view class="recent-activities">
          <view class="section-title">最近活动</view>
          
          <view class="activity-list">
            <view class="activity-item">
              <view class="activity-time">10:30</view>
              <view class="activity-content">
                <text class="activity-user">张三</text>
                <text class="activity-action">发表了新文章</text>
                <text class="activity-target">《Vue3实战指南》</text>
              </view>
            </view>
            
            <view class="activity-item">
              <view class="activity-time">09:15</view>
              <view class="activity-content">
                <text class="activity-user">李四</text>
                <text class="activity-action">评论了文章</text>
                <text class="activity-target">《JavaScript进阶技巧》</text>
              </view>
            </view>
            
            <view class="activity-item">
              <view class="activity-time">昨天</view>
              <view class="activity-content">
                <text class="activity-user">系统</text>
                <text class="activity-action">进行了数据备份</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    `,
    setup() {
      const getCurrentDate = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const weekday = weekdays[now.getDay()];
        
        return `${year}年${month}月${day}日 ${weekday}`;
      };
      
      return {
        getCurrentDate
      };
    }
  }
};

// 全局点击事件处理函数
const handleGlobalClick = (e) => {
  // 点击用户菜单区域外时关闭菜单
  const userMenuEl = document.querySelector('.user-info');
  if (userMenuEl && !userMenuEl.contains(e.target)) {
    showUserMenu.value = false;
  }
};

// 初始化函数
const init = () => {
  console.log('正在初始化管理员首页...');
  
  // 获取用户信息
  try {
    const adminInfoStr = uni.getStorageSync('admin_info');
    console.log('原始管理员信息:', adminInfoStr);
    
    if (adminInfoStr) {
      let parsedInfo;
      if (typeof adminInfoStr === 'string') {
        try {
          parsedInfo = JSON.parse(adminInfoStr);
        } catch (e) {
          console.error('解析管理员信息失败:', e);
          parsedInfo = { nickname: '管理员' };
        }
      } else {
        parsedInfo = adminInfoStr;
      }
      userInfo.value = parsedInfo;
      console.log('处理后的管理员信息:', userInfo.value);
    }
    
    // 获取用户角色
    const rolesData = uni.getStorageSync('admin_roles');
    console.log('原始角色数据:', rolesData);
    
    if (rolesData) {
      try {
        const roles = typeof rolesData === 'string' ? JSON.parse(rolesData) : rolesData;
        
        if (Array.isArray(roles) && roles.length > 0) {
          // 提取角色名称并转换为大写
          const roleNames = roles.map(role => {
            const name = role.name || role.roleName || '';
            return name.toUpperCase();
          }).filter(name => name);
          
          console.log('提取的角色名称:', roleNames);
          
          // 转换为系统使用的角色代码
          if (roleNames.includes('超级管理员') || roleNames.includes('SUPER_ADMIN')) {
            userRoles.value = ['SUPER_ADMIN', 'ADMIN'];
          } else if (roleNames.includes('内容管理员') || roleNames.includes('ADMIN')) {
            userRoles.value = ['ADMIN'];
          } else {
            // 保持默认角色确保能看到菜单
            console.log('未找到匹配的角色，使用默认角色');
          }
        } else {
          console.log('角色数据不是数组或为空，使用默认角色');
        }
      } catch (e) {
        console.error('处理角色数据出错:', e);
      }
    } else {
      console.log('未找到角色数据，使用默认角色');
    }
    
    console.log('最终使用的角色:', userRoles.value);
    
    // 默认选中第一个有权限的菜单
    if (filteredMenuList.value.length > 0) {
      currentMenu.value = filteredMenuList.value[0].id;
      console.log('默认选中菜单:', currentMenu.value);
    }
  } catch (e) {
    console.error('初始化过程出错:', e);
  }
};

// 生命周期钩子
onMounted(() => {
  console.log('管理员首页组件已挂载');
  init();
  
  // 在H5环境下处理点击事件
  // #ifdef H5
  document.addEventListener('click', handleGlobalClick);
  // #endif
});

// 组件卸载前移除事件监听
onBeforeUnmount(() => {
  document.removeEventListener('click', handleGlobalClick);
});

// 处理菜单点击
const handleMenuClick = (menu) => {
  currentMenu.value = menu.id;
  // 在移动端可能需要关闭侧边栏
  if (window.innerWidth < 768) {
    // 如果添加了侧边栏切换功能，这里可以关闭侧边栏
  }
};

// 退出登录
const logout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        // 清除管理员登录信息
        uni.removeStorageSync('admin_token');
        uni.removeStorageSync('admin_info');
        uni.removeStorageSync('admin_roles');
        
        // 跳转到登录页
        uni.redirectTo({
          url: '/pages/admin-login/admin-login'
        });
      }
      showUserMenu.value = false;
    }
  });
};

// 添加菜单分类计算和获取方法
const menuCategories = computed(() => {
  // 获取所有可见菜单的不重复分类
  const categories = filteredMenuList.value.map(menu => menu.category);
  return [...new Set(categories)];
});

const getCategoryMenus = (category) => {
  return filteredMenuList.value.filter(menu => menu.category === category);
};
</script>

<style>
.admin-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f7fa;
  overflow: hidden;
}

/* 头部导航样式 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 50px;
  background-color: #4361ee;
  padding: 0 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.logo {
  display: flex;
  align-items: center;
}

.logo-text {
  color: #ffffff;
  font-size: 16px;
  font-weight: bold;
}

.user-info {
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;
  border-radius: 4px;
  padding: 4px 8px;
  transition: all 0.2s;
}

.user-info:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  margin-right: 8px;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.username {
  color: #ffffff;
  font-size: 13px;
  margin-right: 4px;
}

/* 用户菜单 */
.user-menu {
  position: absolute;
  top: 38px;
  right: 0;
  width: 110px;
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 100;
  animation: fadeIn 0.2s ease;
  overflow: hidden;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.user-menu .menu-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  transition: background-color 0.2s;
}

.user-menu .menu-item:hover {
  background-color: #f5f7fa;
}

.user-menu .menu-item text {
  margin-left: 6px;
  color: #333;
  font-size: 13px;
}

/* 主要内容区域 */
.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 侧边栏导航 */
.sidebar-container {
  flex-shrink: 0;
  width: 180px;
  background-color: #ffffff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
  height: 100%;
  z-index: 10;
}

.sidebar {
  width: 180px;
  height: 100%;
  background-color: #ffffff;
  padding: 10px 0;
}

.sidebar .menu-item {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  cursor: pointer;
  transition: all 0.2s;
  margin: 2px 10px;
  border-radius: 4px;
}

.sidebar .menu-item:hover {
  background-color: #f5f7fa;
}

.sidebar .menu-item.active {
  background-color: #eef2ff;
  color: #4361ee;
}

.sidebar .menu-text {
  margin-left: 8px;
  color: #333;
  font-size: 13px;
}

.sidebar .menu-item.active .menu-text {
  color: #4361ee;
  font-weight: 500;
}

/* 内容区域 */
.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 15px;
}

.breadcrumb {
  height: 36px;
  background-color: #ffffff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 15px;
  margin-bottom: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.breadcrumb text {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.content {
  flex: 1;
  background-color: #ffffff;
  border-radius: 4px;
  padding: 15px;
  overflow-y: auto;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* Dashboard样式 */
.dashboard {
  padding: 10px 0;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.welcome-text {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.date-text {
  font-size: 13px;
  color: #666;
}

.stat-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  min-width: 180px;
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  padding: 15px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.stat-card-header {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.stat-card-value {
  font-size: 22px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.stat-card-footer {
  display: flex;
  align-items: center;
  font-size: 12px;
}

.stat-trend {
  margin-right: 5px;
  font-weight: 500;
}

.stat-up {
  color: #52c41a;
}

.stat-down {
  color: #ff4d4f;
}

.stat-period {
  color: #999;
}

.section-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.activity-list {
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.activity-item {
  display: flex;
  padding: 12px;
  border-bottom: 1px solid #f5f5f5;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-time {
  width: 50px;
  color: #999;
  font-size: 12px;
}

.activity-content {
  flex: 1;
  font-size: 13px;
  color: #333;
}

.activity-user {
  font-weight: 500;
  color: #4361ee;
}

.activity-action {
  margin: 0 3px;
}

.activity-target {
  color: #5c6b77;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .sidebar {
    width: 160px;
  }
  
  .stat-card {
    min-width: 140px;
  }
  
  .content-wrapper {
    padding: 10px;
  }
  
  .content {
    padding: 12px;
  }
}

/* 调试信息 */
.debug-info {
  font-size: 12px;
  color: #999;
  padding: 5px 15px;
  margin-bottom: 10px;
  border-bottom: 1px dashed #eee;
}

/* 菜单分类样式 */
.menu-category {
  margin-bottom: 16px;
}

.category-title {
  display: block;
  font-size: 12px;
  color: #999;
  padding: 5px 15px;
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style> 