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
          <view v-if="userInfo.email" class="user-role-info">
            <text>{{ isSuperAdmin ? '超级管理员' : '管理员' }}</text>
          </view>
          
          <!-- 按照分类分组显示菜单 -->
          <block v-for="category in menuCategories" :key="category">
            <view class="menu-category" v-if="getCategoryMenus(category).length > 0">
              <text class="category-title">{{ category }}</text>
              
              <view 
                v-for="(menu, index) in getCategoryMenus(category)" 
                :key="menu.id" 
                class="menu-item"
                :class="{ 
                  active: currentMenu === menu.id,
                  disabled: !canAccessMenu(menu)
                }"
                @click="handleMenuClick(menu)"
              >
                <uni-icons :type="menu.icon" size="18" :color="getMenuIconColor(menu)"></uni-icons>
                <text class="menu-text">{{ menu.name }}</text>
                
                <!-- 锁定图标 -->
                <uni-icons 
                  v-if="!canAccessMenu(menu)" 
                  type="locked" 
                  size="14" 
                  color="#999"
                  class="lock-icon"
                ></uni-icons>
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
  avatar: '/static/images/avatar.png',
  email: ''
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

// 当前用户角色列表
const userRoles = ref([]);
const userPermissions = ref([]);

// 判断是否是超级管理员
const isSuperAdmin = computed(() => {
  // 检查可能的超级管理员角色标识
  return userRoles.value.some(role => 
    role === 'ROLE_超级管理员' || 
    role === 'SUPER_ADMIN' || 
    role === '超级管理员');
});

// 检查是否可以访问菜单项
const canAccessMenu = (menu) => {
  console.log('检查菜单访问权限:', menu.name, '用户角色:', userRoles.value);
  
  // 调试输出
  const hasRole = userRoles.value.some(role => menu.roles.includes(role));
  console.log(`菜单[${menu.name}]权限检查:`, hasRole);
  
  // 超级管理员可以访问所有菜单
  if (isSuperAdmin.value) {
    console.log('超级管理员可访问所有菜单');
    return true;
  }
  
  // 处理管理员角色
  const isAdmin = userRoles.value.some(role => 
    role === 'ADMIN' || 
    role === 'ROLE_内容管理员' || 
    role === '内容管理员');
  
  // 管理员可以访问的基础菜单
  if (isAdmin && menu.roles.includes('ADMIN')) {
    console.log('管理员可访问常规菜单:', menu.name);
    return true;
  }
  
  // 检查具体权限
  return menu.roles.some(role => userRoles.value.includes(role));
};

// 获取菜单图标颜色
const getMenuIconColor = (menu) => {
  if (!canAccessMenu(menu)) return '#999'; // 灰色图标表示无法访问
  if (currentMenu.value === menu.id) return '#4361ee'; // 选中状态
  return '#666'; // 默认状态
};

// 过滤后的菜单（显示所有菜单，但部分功能禁用）
const filteredMenuList = computed(() => {
  console.log('当前用户角色:', userRoles.value);
  return menuList;
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

// 解析角色信息
const parseUserRoles = (rolesData) => {
  try {
    console.log('解析角色数据:', rolesData);
    let roles = [];
    
    // 从Token获取的权限列表(字符串数组)
    if (Array.isArray(rolesData)) {
      // 例如 ["USER", "ADMIN", "ROLE_超级管理员", "user:view", ...]
      roles = rolesData.filter(role => !!role);
    } 
    // 存储的对象数组格式
    else if (typeof rolesData === 'string') {
      try {
        const parsed = JSON.parse(rolesData);
        if (Array.isArray(parsed)) {
          roles = parsed.map(role => {
            // 处理对象格式 {name: "超级管理员"}
            if (typeof role === 'object' && role !== null) {
              return role.name || role.roleName || '';
            }
            // 处理字符串格式
            return role || '';
          }).filter(role => !!role);
        }
      } catch (e) {
        console.error('角色数据解析失败:', e);
        roles = [];
      }
    }
    
    console.log('解析后的角色:', roles);
    
    // 设置角色和权限
    userRoles.value = roles;
    
    // 分离权限
    const permissions = roles.filter(role => role.includes(':'));
    if (permissions.length > 0) {
      userPermissions.value = permissions;
    }
    
    // 临时添加调试角色，确保菜单可见（仅用于测试）
    // userRoles.value.push('ADMIN');
    
    return true;
  } catch (e) {
    console.error('解析角色数据出错:', e);
    return false;
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
    
    // 获取用户角色 - 从Token存储获取
    const tokenRoles = uni.getStorageSync('admin_token_roles');
    if (tokenRoles) {
      console.log('从Token获取的权限:', tokenRoles);
      parseUserRoles(tokenRoles);
    } else {
      // 兼容旧版 - 从存储获取角色对象
      const rolesData = uni.getStorageSync('admin_roles');
      if (rolesData) {
        console.log('从存储获取的角色数据:', rolesData);
        parseUserRoles(rolesData);
      } else {
        console.warn('未找到角色数据，使用默认角色');
      }
    }
    
    // 确保至少有基本权限
    ensureMinimumAccess();
    
    console.log('最终使用的角色:', userRoles.value);
    
    // 默认选中第一个有权限的菜单
    const accessibleMenus = menuList.filter(menu => canAccessMenu(menu));
    if (accessibleMenus.length > 0) {
      currentMenu.value = accessibleMenus[0].id;
      console.log('默认选中菜单:', currentMenu.value);
    }
  } catch (e) {
    console.error('初始化过程出错:', e);
    // 出错时确保基本权限
    ensureMinimumAccess();
  }
};

// 确保至少有基本权限（防止全部锁定）
const ensureMinimumAccess = () => {
  // 如果没有任何角色，给予最基本的ADMIN角色
  if (userRoles.value.length === 0) {
    console.warn('未检测到任何角色，添加基本角色');
    userRoles.value.push('ADMIN');
  }
  
  // 检查是否至少有一个菜单可访问
  const hasAccessibleMenu = menuList.some(menu => canAccessMenu(menu));
  if (!hasAccessibleMenu) {
    console.warn('检测到没有可访问的菜单，添加ADMIN角色');
    
    // 如果包含超级管理员相关字样，设为超级管理员
    const isLikelySuperAdmin = userInfo.value.email && (
      userInfo.value.email.includes('admin') || 
      userInfo.value.nickname?.includes('超级') ||
      userInfo.value.nickname?.includes('admin')
    );
    
    if (isLikelySuperAdmin) {
      console.log('根据用户信息推断为超级管理员');
      userRoles.value.push('SUPER_ADMIN');
    } else {
      userRoles.value.push('ADMIN');
    }
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
  // 如果菜单被禁用，则显示提示
  if (!canAccessMenu(menu)) {
    uni.showToast({
      title: '权限不足，无法访问',
      icon: 'none',
      duration: 2000
    });
    return;
  }
  
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
        uni.removeStorageSync('admin_token_roles');
        
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
  // 获取所有菜单的不重复分类
  const categories = menuList.map(menu => menu.category);
  return [...new Set(categories)];
});

const getCategoryMenus = (category) => {
  return menuList.filter(menu => menu.category === category);
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
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  font-size: 13px;
  color: #333333;
  transition: all 0.2s;
}

.menu-item:hover {
  background-color: #f5f7fa;
}

.menu-item uni-icons {
  margin-right: 6px;
}

/* 主要内容区域 */
.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 侧边栏样式 */
.sidebar-container {
  width: 200px;
  background-color: #ffffff;
  box-shadow: 1px 0 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: width 0.3s;
}

.sidebar {
  height: 100%;
  padding: 16px 0;
}

.menu-category {
  margin-bottom: 16px;
}

.category-title {
  display: block;
  padding: 8px 16px;
  font-size: 12px;
  color: #999999;
  text-transform: uppercase;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  font-size: 14px;
  color: #333333;
  position: relative;
  transition: all 0.2s;
  cursor: pointer;
  margin-bottom: 1px;
}

.menu-item:hover {
  background-color: #f5f7fa;
}

.menu-item.active {
  background-color: #edf2ff;
  color: #4361ee;
  font-weight: 500;
  border-right: 3px solid #4361ee;
}

.menu-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: transparent !important;
  color: #999 !important;
}

.menu-text {
  margin-left: 8px;
}

.lock-icon {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
}

/* 内容区域样式 */
.content-wrapper {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.breadcrumb {
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  background-color: #ffffff;
  border-bottom: 1px solid #eeeeee;
  font-size: 14px;
  color: #666666;
}

.content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

/* 用户角色信息显示 */
.user-role-info {
  text-align: center;
  padding: 10px 0;
  margin-bottom: 15px;
  border-bottom: 1px dashed #eee;
}

.user-role-info text {
  font-size: 12px;
  padding: 3px 8px;
  background-color: #f0f7ff;
  color: #4361ee;
  border-radius: 12px;
}

/* 调试信息 */
.debug-info {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin: 8px 0;
  padding: 4px;
  background-color: #f9f9f9;
  border-radius: 4px;
  display: none; /* 生产环境隐藏 */
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar-container {
    position: absolute;
    height: calc(100% - 50px);
    z-index: 99;
    transform: translateX(-100%);
    transition: transform 0.3s;
  }
  
  .sidebar-container.visible {
    transform: translateX(0);
  }
}
</style> 