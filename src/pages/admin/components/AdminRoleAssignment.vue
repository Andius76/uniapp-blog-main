<template>
  <view class="admin-role-assignment">
    <!-- 搜索区域 -->
    <view class="search-container">
      <uni-search-bar
        v-model="searchKeyword"
        placeholder="搜索管理员昵称或用户名"
        @confirm="searchAdmins"
        @cancel="resetSearch"
        @clear="resetSearch"
      ></uni-search-bar>
    </view>
    
    <!-- 管理员表格 -->
    <view class="table-container">
      <view class="table-header">
        <view class="th" style="flex: 0.8;">ID</view>
        <view class="th" style="flex: 1.5;">头像</view>
        <view class="th" style="flex: 2;">管理员昵称</view>
        <view class="th" style="flex: 3;">邮箱</view>
        <view class="th" style="flex: 2.5;">已分配角色</view>
        <view class="th" style="flex: 2;">操作</view>
      </view>
      
      <view class="table-body">
        <view v-if="loading" class="loading-container">
          <uni-load-more status="loading" :contentText="loadingText"></uni-load-more>
        </view>
        
        <view v-else-if="admins.length === 0" class="no-data">
          <text>暂无管理员数据</text>
        </view>
        
        <view v-else class="table-row" v-for="(admin, index) in admins" :key="admin.id">
          <view class="td" style="flex: 0.8;">{{ admin.id }}</view>
          <view class="td avatar-cell" style="flex: 1.5;">
            <image class="avatar" :src="admin.avatar || '/static/images/avatar.png'" mode="aspectFill"></image>
          </view>
          <view class="td" style="flex: 2;">{{ admin.nickname }}</view>
          <view class="td" style="flex: 3;">{{ admin.email }}</view>
          <view class="td" style="flex: 2.5;">
            <view class="role-tags">
              <view 
                v-for="(role, rIndex) in admin.roles" 
                :key="rIndex"
                class="role-tag"
                :class="{ 'admin-role': role.name === '管理员', 'super-admin-role': role.name === '超级管理员' }"
              >
                {{ role.name }}
              </view>
              <view v-if="!admin.roles || admin.roles.length === 0" class="no-role">
                无角色
              </view>
            </view>
          </view>
          <view class="td actions" style="flex: 2;">
            <button class="btn btn-sm btn-primary" @click="assignRole(admin)">分配角色</button>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 分页 -->
    <view class="pagination" v-if="admins.length > 0">
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
        :title="'为 ' + (currentAdmin.nickname || '') + ' 分配角色'"
        :mode="'input'"
        :before-close="true"
        @confirm="saveAdminRoles"
        @close="closeDialog"
      >
        <view class="dialog-form">
          <text class="form-tip">请为该管理员选择一个或多个角色：</text>
          
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
            注意：分配超级管理员角色将赋予该管理员最高系统权限，请谨慎操作！
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

// 管理员列表数据
const admins = ref([]);

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

// 当前编辑的管理员
const currentAdmin = reactive({
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

// 获取管理员列表
const fetchAdmins = async (page = 1) => {
  loading.value = true;
  currentPage.value = page;
  
  try {
    const res = await userRoleApi.getAdminList({
      page: page,
      size: pageSize.value,
      keyword: searchKeyword.value
    });
    
    // 修正数据获取方式，匹配后端返回的数据结构
    admins.value = res.data.records || [];
    total.value = res.data.total || 0;
    currentPage.value = res.data.current || 1;
  } catch (error) {
    console.error('获取管理员列表失败:', error);
    uni.showToast({
      title: '获取管理员列表失败',
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
  fetchAdmins(page);
};

// 搜索管理员
const searchAdmins = () => {
  fetchAdmins(1); // 重置到第一页
};

// 重置搜索
const resetSearch = () => {
  searchKeyword.value = '';
  fetchAdmins(1);
};

// 分配角色
const assignRole = async (admin) => {
  // 复制管理员数据
  Object.assign(currentAdmin, { ...admin });
  
  // 获取管理员当前角色
  try {
    const res = await userRoleApi.getAdminRoles(admin.id);
    selectedRoles.value = res.data ? res.data.map(role => role.id) : [];
  } catch (error) {
    console.error('获取管理员角色失败:', error);
    selectedRoles.value = admin.roles ? admin.roles.map(role => role.id) : [];
  }
  
  // 打开弹窗
  popup.value.open();
};

// 处理角色选择变化
const handleRoleChange = (e) => {
  // 转换为数字数组
  selectedRoles.value = e.detail.value.map(id => parseInt(id));
};

// 保存管理员角色
const saveAdminRoles = async () => {
  loading.value = true;
  
  try {
    await userRoleApi.assignAdminRoles(currentAdmin.id, selectedRoles.value);
    
    // 更新本地数据
    await fetchAdmins(currentPage.value);
    
    uni.showToast({
      title: '角色分配成功',
      icon: 'success'
    });
    
    closeDialog();
  } catch (error) {
    console.error('保存管理员角色失败:', error);
    uni.showToast({
      title: error.message || '保存失败',
      icon: 'none'
    });
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
  fetchAdmins();
  fetchRoles();
});
</script>

<style>
.admin-role-assignment {
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