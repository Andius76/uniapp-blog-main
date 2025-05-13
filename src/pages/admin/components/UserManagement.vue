<template>
  <view class="user-management fade-in">
    <!-- 搜索和过滤区域 -->
    <view class="filter-container">
      <view class="search-box">
        <uni-search-bar
          placeholder="搜索用户名、邮箱"
          v-model="searchKeyword"
          @confirm="searchUsers"
          @cancel="resetSearch"
          @clear="resetSearch"
        ></uni-search-bar>
      </view>
      <view class="filter-box">
        <picker 
          @change="onStatusChange" 
          :value="statusFilterIndex" 
          :range="statusOptions"
        >
          <view class="picker-box">
            <text>状态：{{ statusOptions[statusFilterIndex] }}</text>
            <uni-icons type="arrow-down" size="14" color="#666"></uni-icons>
          </view>
        </picker>
      </view>
    </view>

    <!-- 用户表格 -->
    <view class="table-container">
      <view class="table-header">
        <view class="th" style="flex: 1;">ID</view>
        <view class="th" style="flex: 1;">头像</view>
        <view class="th" style="flex: 2;">用户名</view>
        <view class="th" style="flex: 3;">邮箱</view>
        <view class="th" style="flex: 2;">注册时间</view>
        <view class="th" style="flex: 1;">状态</view>
        <view class="th" style="flex: 2;">操作</view>
      </view>
      
      <view class="table-body">
        <view v-if="loading" class="loading-container">
          <uni-load-more status="loading" :contentText="loadingText"></uni-load-more>
        </view>
        
        <view v-else-if="users.length === 0" class="no-data">
          <view class="no-data-icon">🔍</view>
          <text>暂无用户数据</text>
        </view>
        
        <view v-else class="table-row" v-for="(user, index) in users" :key="user.id">
          <view class="td" style="flex: 1;">{{ user.id }}</view>
          <view class="td" style="flex: 1;">
            <image class="user-avatar" :src="user.avatar || '/static/images/avatar.png'" mode="aspectFill"></image>
          </view>
          <view class="td" style="flex: 2;">{{ user.nickname }}</view>
          <view class="td" style="flex: 3;">{{ user.email }}</view>
          <view class="td" style="flex: 2;">{{ formatDate(user.createTime) }}</view>
          <view class="td" style="flex: 1;">
            <text :class="['status-badge', Number(user.status) === 1 ? 'status-normal' : 'status-disabled']">
              {{ Number(user.status) === 1 ? '正常' : '禁用' }}
            </text>
          </view>
          <view class="td actions" style="flex: 2;">
            <button class="btn btn-sm" @click="viewUserDetail(user)">查看</button>
            <button 
              class="btn btn-sm" 
              :class="Number(user.status) === 1 ? 'btn-warning' : 'btn-success'"
              @click="toggleUserStatus(user)"
            >
              {{ Number(user.status) === 1 ? '禁用' : '启用' }}
            </button>
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
    
    <!-- 用户详情弹窗 -->
    <uni-popup ref="detailPopup" type="dialog">
      <uni-popup-dialog
        :title="'用户详情'"
        :mode="'base'"
        :before-close="true"
        confirmText="关闭"
        @confirm="closeDetailDialog"
        @close="closeDetailDialog"
      >
        <view class="user-detail">
          <view class="detail-header">
            <image class="detail-avatar" :src="currentUser.avatar || '/static/images/avatar.png'" mode="aspectFill"></image>
            <view class="detail-name">{{ currentUser.nickname }}</view>
          </view>
          
          <view class="detail-item">
            <text class="detail-label">用户ID：</text>
            <text class="detail-value">{{ currentUser.id }}</text>
          </view>
          
          <view class="detail-item">
            <text class="detail-label">邮箱：</text>
            <text class="detail-value">{{ currentUser.email }}</text>
          </view>
          
          <view class="detail-item">
            <text class="detail-label">注册时间：</text>
            <text class="detail-value">{{ formatDate(currentUser.createTime) }}</text>
          </view>
          
          <view class="detail-item">
            <text class="detail-label">最后登录：</text>
            <text class="detail-value">{{ formatDate(currentUser.updateTime) }}</text>
          </view>
          
          <view class="detail-item">
            <text class="detail-label">状态：</text>
            <text :class="['detail-value', Number(currentUser.status) === 1 ? 'text-success' : 'text-danger']">
              {{ Number(currentUser.status) === 1 ? '正常' : '禁用' }}
            </text>
          </view>
          
          <view class="detail-item">
            <text class="detail-label">个人简介：</text>
            <text class="detail-value detail-bio">{{ currentUser.bio || '暂无简介' }}</text>
          </view>
        </view>
      </uni-popup-dialog>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import uniSearchBar from '@/uni_modules/uni-search-bar/components/uni-search-bar/uni-search-bar.vue';
import uniPopup from '@/uni_modules/uni-popup/components/uni-popup/uni-popup.vue';
import uniPopupDialog from '@/uni_modules/uni-popup/components/uni-popup-dialog/uni-popup-dialog.vue';
import uniLoadMore from '@/uni_modules/uni-load-more/components/uni-load-more/uni-load-more.vue';
import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';
import { userApi } from '@/api/admin';

// 搜索关键词
const searchKeyword = ref('');

// 状态过滤
const statusOptions = ['全部', '正常', '禁用'];
const statusFilterIndex = ref(0);
const statusFilters = ['', '1', '0'];

// 用户列表数据
const users = ref([]);

// 当前查看的用户
const currentUser = ref({});

// 加载状态
const loading = ref(false);

// 分页信息
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

// 弹窗引用
const detailPopup = ref(null);

// 加载文本
const loadingText = {
  contentdown: '显示更多',
  contentrefresh: '加载中...',
  contentnomore: '没有更多数据了'
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '未知';
  
  // 简化日期格式
  if (dateStr.includes(' ')) {
    const parts = dateStr.split(' ');
    const date = parts[0];
    const time = parts[1].substring(0, 5); // 只保留小时和分钟
    return `${date} ${time}`;
  }
  
  return dateStr;
};

// 获取用户列表
const fetchUsers = async (page = 1) => {
  loading.value = true;
  currentPage.value = page;
  
  console.log('开始请求用户列表，页码:', page);
  
  try {
    // 构造查询参数
    const params = {
      page: page,
      size: pageSize.value,
      status: statusFilters[statusFilterIndex.value],
      keyword: searchKeyword.value
    };
    
    console.log('发送请求参数:', JSON.stringify(params));
    
    const res = await userApi.getUserList(params);
    
    console.log('获取用户列表成功:', JSON.stringify(res));
    
    // 确保返回的数据格式正确
    if (res && res.data) {
      // 正确处理嵌套数据结构
      if (res.data.records) {
        // 数据在res.data.records中
        users.value = res.data.records;
        total.value = res.data.total || 0;
        currentPage.value = res.data.current || page;
        pageSize.value = res.data.size || pageSize.value;
      } else {
        // 兼容处理，如果没有嵌套records属性
        users.value = Array.isArray(res.data) ? res.data : [];
        total.value = res.total || 0;
      }
      
      console.log('处理后的用户列表数据:', users.value);
      console.log('总记录数:', total.value);
    } else {
      console.error('返回数据格式错误:', res);
      users.value = [];
      total.value = 0;
    }
  } catch (error) {
    console.error('获取用户列表失败:', error);
    uni.showToast({
      title: '获取用户列表失败',
      icon: 'none'
    });
    users.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

// 切换页码
const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  fetchUsers(page);
};

// 搜索用户
const searchUsers = () => {
  console.log('搜索用户:', searchKeyword.value);
  fetchUsers(1); // 重置到第一页
};

// 重置搜索
const resetSearch = () => {
  searchKeyword.value = '';
  fetchUsers(1);
};

// 状态筛选变更
const onStatusChange = (e) => {
  statusFilterIndex.value = e.detail.value;
  console.log('状态筛选变更为:', statusOptions[statusFilterIndex.value]);
  fetchUsers(1);
};

// 查看用户详情
const viewUserDetail = async (user) => {
  console.log('查看用户详情:', user);
  currentUser.value = { ...user };
  
  try {
    // 获取完整的用户详情
    const res = await userApi.getUserDetail(user.id);
    if (res && res.data) {
      currentUser.value = res.data;
    }
  } catch (error) {
    console.error('获取用户详情失败:', error);
  }
  
  detailPopup.value.open();
};

// 关闭用户详情弹窗
const closeDetailDialog = () => {
  detailPopup.value.close();
};

// 切换用户状态
const toggleUserStatus = async (user) => {
  console.log('切换用户状态:', user);
  
  // 切换状态值：1 -> 0 或 0 -> 1
  const newStatus = Number(user.status) === 1 ? 0 : 1;
  
  try {
    loading.value = true;
    
    console.log('发送状态更新请求，用户ID:', user.id, '新状态:', newStatus);
    const res = await userApi.updateUserStatus(user.id, newStatus);
    console.log('更新用户状态成功:', res);
    
    // 更新本地数据
    user.status = newStatus;
    
    uni.showToast({
      title: newStatus === 1 ? '已启用用户' : '已禁用用户',
      icon: 'success'
    });
  } catch (error) {
    console.error('更新用户状态失败:', error);
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
};

// 初始化
onMounted(() => {
  console.log('UserManagement组件已挂载，开始获取用户列表');
  setTimeout(() => {
    // 延迟100ms执行，确保组件完全渲染
    fetchUsers();
  }, 100);
});
</script>

<style>
.user-management {
  width: 100%;
}

.filter-container {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.search-box {
  flex: 1;
}

.filter-box {
  margin-left: 10px;
}

.picker-box {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #f7f7f7;
  border-radius: 4px;
  font-size: 14px;
  color: #333;
}

.table-container {
  width: 100%;
  border: 1px solid #eee;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 15px;
}

.table-header {
  display: flex;
  background-color: #f7f9fc;
  font-weight: 500;
  border-bottom: 1px solid #eee;
}

.th {
  padding: 12px 8px;
  text-align: left;
  font-size: 13px;
  color: #333;
}

.table-body {
  background-color: #fff;
}

.table-row {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.table-row:hover {
  background-color: #f9fafc;
}

.table-row:last-child {
  border-bottom: none;
}

.td {
  padding: 12px 8px;
  font-size: 13px;
  color: #666;
  word-break: break-all;
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.status-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
}

.status-normal {
  background-color: #e6f7e6;
  color: #52c41a;
}

.status-disabled {
  background-color: #fff2f0;
  color: #ff4d4f;
}

.actions {
  display: flex;
  gap: 6px;
}

.btn {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  background-color: #f5f7fa;
  color: #333;
  border: 1px solid #ddd;
  margin-left: 0;
  transition: all 0.15s ease-in-out;
  position: relative;
  overflow: hidden;
}

.btn:active {
  transform: translateY(2px) scale(0.98);
  box-shadow: 0 0 0 rgba(0, 0, 0, 0);
}

.btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1) translate(-50%, -50%);
  transform-origin: 50% 50%;
}

.btn:active::after {
  animation: ripple 0.4s ease-out;
}

@keyframes ripple {
  0% {
    transform: scale(0) translate(-50%, -50%);
    opacity: 1;
  }
  70% {
    transform: scale(40) translate(-50%, -50%);
    opacity: 0.5;
  }
  100% {
    transform: scale(60) translate(-50%, -50%);
    opacity: 0;
  }
}

.btn-primary {
  background-color: #4361ee;
  color: #fff;
  border-color: #4361ee;
  box-shadow: 0 2px 4px rgba(67, 97, 238, 0.2);
}

.btn-primary:hover {
  background-color: #3b56d9;
  border-color: #3b56d9;
}

.btn-success {
  background-color: #52c41a;
  color: #fff;
  border-color: #52c41a;
  box-shadow: 0 2px 4px rgba(82, 196, 26, 0.2);
}

.btn-success:hover {
  background-color: #49af17;
  border-color: #49af17;
}

.btn-warning {
  background-color: #faad14;
  color: #fff;
  border-color: #faad14;
  box-shadow: 0 2px 4px rgba(250, 173, 20, 0.2);
}

.btn-warning:hover {
  background-color: #e8a012;
  border-color: #e8a012;
}

.btn-danger {
  background-color: #ff4d4f;
  color: #fff;
  border-color: #ff4d4f;
  box-shadow: 0 2px 4px rgba(255, 77, 79, 0.2);
}

.btn-danger:hover {
  background-color: #f5222d;
  border-color: #f5222d;
}

.btn-sm {
  padding: 3px 8px;
  font-size: 12px;
}

.loading-container {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.no-data {
  padding: 30px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.no-data-icon {
  font-size: 36px;
  margin-bottom: 8px;
  color: #ccc;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.page-info {
  font-size: 13px;
  color: #666;
}

.page-controls {
  display: flex;
  gap: 8px;
}

/* 用户详情弹窗样式 */
.user-detail {
  padding: 10px 0;
}

.detail-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.detail-avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 10px;
}

.detail-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.detail-item {
  margin-bottom: 12px;
}

.detail-label {
  color: #666;
  font-size: 13px;
  margin-right: 6px;
}

.detail-value {
  color: #333;
  font-size: 13px;
}

.detail-bio {
  display: block;
  margin-top: 4px;
  color: #666;
  font-size: 13px;
  line-height: 1.5;
}

.text-success {
  color: #52c41a;
}

.text-danger {
  color: #ff4d4f;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn 0.3s ease;
}

.btn-default {
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style> 