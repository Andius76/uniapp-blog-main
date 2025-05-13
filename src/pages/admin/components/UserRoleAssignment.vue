<template>
  <view class="user-role-assignment">
    <!-- 搜索区域 -->
    <view class="search-container">
      <uni-search-bar
        v-model="searchKeyword"
        placeholder="搜索用户昵称或邮箱"
        @confirm="searchUsers"
        @cancel="resetSearch"
        @clear="resetSearch"
      ></uni-search-bar>
    </view>
    
    <!-- 用户表格 -->
    <view class="table-container">
      <view class="table-header">
        <view class="th" style="flex: 0.8;">ID</view>
        <view class="th" style="flex: 1.5;">头像</view>
        <view class="th" style="flex: 2;">用户昵称</view>
        <view class="th" style="flex: 3;">邮箱</view>
        <view class="th" style="flex: 2.5;">已分配角色</view>
        <view class="th" style="flex: 2;">操作</view>
      </view>
      
      <view class="table-body">
        <view v-if="loading" class="loading-container">
          <uni-load-more status="loading" :contentText="loadingText"></uni-load-more>
        </view>
        
        <view v-else-if="users.length === 0" class="no-data">
          <text>暂无用户数据</text>
        </view>
        
        <view v-else class="table-row" v-for="(user, index) in users" :key="user.id">
          <view class="td" style="flex: 0.8;">{{ user.id }}</view>
          <view class="td avatar-cell" style="flex: 1.5;">
            <image class="avatar" :src="user.avatar || '/static/images/avatar.png'" mode="aspectFill"></image>
          </view>
          <view class="td" style="flex: 2;">{{ user.nickname }}</view>
          <view class="td" style="flex: 3;">{{ user.email }}</view>
          <view class="td" style="flex: 2.5;">
            <view class="role-tags">
              <view 
                v-for="(role, rIndex) in user.roles" 
                :key="rIndex"
                class="role-tag"
                :class="{ 'admin-role': role.name === '管理员', 'super-admin-role': role.name === '超级管理员' }"
              >
                {{ role.name }}
              </view>
              <view v-if="!user.roles || user.roles.length === 0" class="no-role">
                无角色
              </view>
            </view>
          </view>
          <view class="td actions" style="flex: 2;">
            <button class="btn btn-sm btn-primary" @click="assignRole(user)">分配角色</button>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 分页 -->
    <view class="pagination" v-if="users.length > 0">
      <view class="page-info">
        <text>共 {{ total }} 条记录，当前 {{ currentPage }}/{{ totalPages }} 页</text>
      </view>
      <view class="page-controls">
        <button 
          class="btn btn-sm" 
          :disabled="currentPage <= 1"
          @click="changePage(currentPage - 1)"
        >上一页</button>
        <button 
          class="btn btn-sm" 
          :disabled="currentPage >= totalPages"
          @click="changePage(currentPage + 1)"
        >下一页</button>
      </view>
    </view>
    
    <!-- 角色分配弹窗 -->
    <uni-popup ref="popup" type="dialog">
      <uni-popup-dialog
        :title="'为 ' + (currentUser.nickname || '') + ' 分配角色'"
        :mode="'input'"
        :before-close="true"
        @confirm="saveUserRoles"
        @close="closeDialog"
      >
        <view class="dialog-form">
          <text class="form-tip">请为该用户选择一个或多个角色：</text>
          
          <checkbox-group @change="handleRoleChange" class="role-checkbox-group">
            <view 
              v-for="(role, index) in allRoles" 
              :key="role.id" 
              class="role-checkbox-item"
            >
              <checkbox 
                :value="role.id.toString()" 
                :checked="selectedRoles.includes(role.id)"
                color="#4361ee"
              />
              <view class="role-info">
                <text class="role-name">{{ role.name }}</text>
                <text class="role-desc">{{ role.description }}</text>
              </view>
            </view>
          </checkbox-group>
          
          <text class="warning-text" v-if="showWarning">
            注意：分配超级管理员角色将赋予该用户最高系统权限，请谨慎操作！
          </text>
        </view>
      </uni-popup-dialog>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import uniPopup from '@/uni_modules/uni-popup/components/uni-popup/uni-popup.vue';
import uniPopupDialog from '@/uni_modules/uni-popup/components/uni-popup-dialog/uni-popup-dialog.vue';
import uniLoadMore from '@/uni_modules/uni-load-more/components/uni-load-more/uni-load-more.vue';
import uniSearchBar from '@/uni_modules/uni-search-bar/components/uni-search-bar/uni-search-bar.vue';
import { userRoleApi, roleApi } from '@/api/admin';

// 用户列表数据
const users = ref([]);

// 加载状态
const loading = ref(false);

// 分页信息
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

// 搜索关键词
const searchKeyword = ref('');

// 弹窗引用
const popup = ref(null);

// 当前编辑的用户
const currentUser = reactive({
  id: null,
  nickname: '',
  email: '',
  avatar: '',
  roles: []
});

// 所有可用角色
const allRoles = ref([]);

// 已选择的角色ID列表
const selectedRoles = ref([]);

// 是否显示超管警告
const showWarning = computed(() => {
  return selectedRoles.value.includes(1); // 假设ID=1是超级管理员角色
});

// 加载文本
const loadingText = {
  contentdown: '显示更多',
  contentrefresh: '加载中...',
  contentnomore: '没有更多数据了'
};

// 获取用户列表
const fetchUsers = async (page = 1) => {
  loading.value = true;
  currentPage.value = page;
  
  try {
    const res = await userRoleApi.getUserList({
      page: page,
      size: pageSize.value,
      keyword: searchKeyword.value
    });
    
    // 修正数据获取方式，匹配后端返回的数据结构
    users.value = res.data.records || [];
    total.value = res.data.total || 0;
    currentPage.value = res.data.current || 1;
  } catch (error) {
    console.error('获取用户列表失败:', error);
    uni.showToast({
      title: '获取用户列表失败',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
};

// 获取所有角色
const fetchRoles = async () => {
  try {
    const res = await roleApi.getRoleList({
      size: 999 // 获取所有角色
    });
    
    // 处理后端返回的角色数据结构
    allRoles.value = res.data.list || [];
  } catch (error) {
    console.error('获取角色列表失败:', error);
  }
};

// 切换页码
const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  fetchUsers(page);
};

// 搜索用户
const searchUsers = () => {
  fetchUsers(1); // 重置到第一页
};

// 重置搜索
const resetSearch = () => {
  searchKeyword.value = '';
  fetchUsers(1);
};

// 分配角色
const assignRole = async (user) => {
  // 复制用户数据
  Object.assign(currentUser, { ...user });
  
  // 获取用户当前角色
  try {
    console.log('获取用户角色, 用户ID:', user.id);
    const res = await userRoleApi.getUserRoles(user.id);
    console.log('获取用户角色成功:', res);
    selectedRoles.value = res.data ? res.data.map(role => role.id) : [];
  } catch (error) {
    console.error('获取用户角色失败:', error);
    // 回退到使用页面已有的角色数据
    selectedRoles.value = user.roles ? user.roles.map(role => role.id) : [];
    
    // 显示错误信息
    uni.showToast({
      title: '获取用户角色失败，已使用本地数据',
      icon: 'none'
    });
  }
  
  // 打开弹窗
  popup.value.open();
};

// 处理角色选择变化
const handleRoleChange = (e) => {
  console.log('角色选择变更:', e.detail.value);
  // 转换为数字数组
  selectedRoles.value = e.detail.value.map(id => parseInt(id));
};

// 分配用户角色
const saveUserRoles = async () => {
  loading.value = true;
  
  try {
    console.log('保存用户角色, 用户ID:', currentUser.id, '角色IDs:', selectedRoles.value);
    await userRoleApi.assignUserRoles(currentUser.id, selectedRoles.value);
    
    // 更新本地数据
    await fetchUsers(currentPage.value);
    
    uni.showToast({
      title: '角色分配成功',
      icon: 'success'
    });
    
    closeDialog();
  } catch (error) {
    console.error('保存用户角色失败:', error);
    
    // 检查权限问题
    if (error.statusCode === 403) {
      uni.showModal({
        title: '权限不足',
        content: '您没有分配用户角色的权限，请联系管理员',
        showCancel: false
      });
    } else {
      uni.showToast({
        title: error.message || '保存失败',
        icon: 'none'
      });
    }
  } finally {
    loading.value = false;
  }
};

// 关闭弹窗
const closeDialog = () => {
  popup.value.close();
};

// 初始化
onMounted(() => {
  fetchUsers();
  fetchRoles();
});
</script>

<style>
.user-role-assignment {
  width: 100%;
}

.search-container {
  margin-bottom: 20px;
}

.table-container {
  width: 100%;
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
}

.table-header {
  display: flex;
  background-color: #f5f5f5;
  font-weight: bold;
}

.th {
  padding: 15px 10px;
  text-align: left;
  font-size: 14px;
  color: #333;
}

.table-body {
  background-color: #fff;
}

.table-row {
  display: flex;
  border-bottom: 1px solid #eee;
}

.table-row:last-child {
  border-bottom: none;
}

.td {
  padding: 15px 10px;
  font-size: 14px;
  color: #666;
  word-break: break-all;
  display: flex;
  align-items: center;
}

.avatar-cell {
  justify-content: center;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.role-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.role-tag {
  background-color: #eee;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  color: #666;
}

.admin-role {
  background-color: #e6f7ff;
  color: #1890ff;
}

.super-admin-role {
  background-color: #f6ffed;
  color: #52c41a;
}

.no-role {
  color: #999;
  font-size: 12px;
}

.actions {
  display: flex;
  justify-content: center;
}

.loading-container {
  padding: 30px;
  display: flex;
  justify-content: center;
}

.no-data {
  padding: 30px;
  text-align: center;
  color: #999;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.page-info {
  color: #666;
  font-size: 14px;
}

.page-controls {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 15px;
  border-radius: 4px;
  font-size: 14px;
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  margin-left: 10px;
}

.btn-primary {
  background-color: #4361ee;
  color: #fff;
  border-color: #4361ee;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
  margin-left: 0;
}

.dialog-form {
  padding: 10px 0;
}

.form-tip {
  display: block;
  margin-bottom: 15px;
  font-size: 14px;
  color: #333;
}

.role-checkbox-group {
  max-height: 250px;
  overflow-y: auto;
}

.role-checkbox-item {
  display: flex;
  align-items: flex-start;
  padding: 10px;
  border-bottom: 1px solid #f5f5f5;
}

.role-checkbox-item:last-child {
  border-bottom: none;
}

.role-info {
  margin-left: 10px;
  display: flex;
  flex-direction: column;
}

.role-name {
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.role-desc {
  font-size: 12px;
  color: #666;
}

.warning-text {
  display: block;
  margin-top: 15px;
  color: #ff4d4f;
  font-size: 12px;
}
</style> 