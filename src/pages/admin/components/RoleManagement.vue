<template>
  <view class="role-management fade-in">
    <!-- 操作栏 -->
    <view class="operation-bar">
      <view class="left-operations">
        <text class="title">角色管理</text>
        <button class="refresh-btn" @click="fetchRoles(currentPage)">
          <uni-icons type="refresh" size="12" color="#666"></uni-icons>
          <text style="margin-left: 4px;">刷新</text>
        </button>
      </view>
      <button class="btn btn-primary" @click="showCreateDialog">
        <uni-icons type="plusempty" size="12" color="#fff" class="btn-icon"></uni-icons>
        新建角色
      </button>
    </view>

    <!-- 角色表格 -->
    <view class="table-container">
      <view class="table-header">
        <view class="th" style="flex: 0.8;">ID</view>
        <view class="th" style="flex: 2;">角色名称</view>
        <view class="th" style="flex: 3;">描述</view>
        <view class="th" style="flex: 1.5;">状态</view>
        <view class="th" style="flex: 2;">创建时间</view>
        <view class="th" style="flex: 2.5;">操作</view>
      </view>
      
      <view class="table-body">
        <view v-if="loading" class="loading-container">
          <uni-load-more status="loading" :contentText="loadingText"></uni-load-more>
        </view>
        
        <view v-else-if="roles.length === 0" class="no-data">
          <view class="no-data-icon">🔍</view>
          <text>暂无角色数据</text>
        </view>
        
        <view v-else class="table-row" v-for="(role, index) in roles" :key="role.id">
          <view class="td" style="flex: 0.8;">{{ role.id }}</view>
          <view class="td" style="flex: 2;">{{ role.name }}</view>
          <view class="td" style="flex: 3;">{{ role.description || '暂无描述' }}</view>
          <view class="td" style="flex: 1.5;">
            <text :class="role.status === '1' ? 'status-active' : 'status-inactive'">
              {{ role.status === '1' ? '启用' : '禁用' }}
            </text>
          </view>
          <view class="td" style="flex: 2;">{{ formatDate(role.createTime) }}</view>
          <view class="td actions" style="flex: 2.5;">
            <button class="btn btn-sm" @click="editRole(role)" :disabled="role.isSystem === '1'">编辑</button>
            <button class="btn btn-sm btn-danger" @click="deleteRole(role)" :disabled="role.isSystem === '1'">删除</button>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 分页 -->
    <view class="pagination" v-if="roles.length > 0">
      <view class="page-info">
        <text>共 {{ totalRoles }} 条记录，当前 {{ currentPage }}/{{ totalPages }} 页</text>
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
    
    <!-- 角色编辑弹窗 -->
    <uni-popup ref="popup" type="dialog">
      <uni-popup-dialog
        :title="dialogTitle"
        :mode="'input'"
        :before-close="true"
        @confirm="handleDialogConfirm"
        @close="closeDialog"
      >
        <view class="dialog-form">
          <view class="form-item">
            <text class="form-label">角色名称</text>
            <input 
              class="form-input" 
              v-model="currentRole.name"
              placeholder="请输入角色名称" 
            />
          </view>
          
          <view class="form-item">
            <text class="form-label">角色描述</text>
            <textarea 
              class="form-textarea" 
              v-model="currentRole.description"
              placeholder="请输入角色描述" 
            />
          </view>
          
          <view class="form-item">
            <text class="form-label">状态</text>
            <radio-group @change="handleStatusChange">
              <label class="radio-label">
                <radio value="1" :checked="currentRole.status === '1'" color="#4361ee" />
                <text>启用</text>
              </label>
              <label class="radio-label">
                <radio value="0" :checked="currentRole.status === '0'" color="#4361ee" />
                <text>禁用</text>
              </label>
            </radio-group>
          </view>
        </view>
      </uni-popup-dialog>
    </uni-popup>
    
    <!-- 确认删除弹窗 -->
    <uni-popup ref="confirmPopup" type="dialog">
      <uni-popup-dialog
        title="删除确认"
        content="确定要删除该角色吗？删除后将无法恢复，且拥有该角色的用户将失去此角色。"
        :before-close="true"
        @confirm="confirmDelete"
        @close="closeConfirmDialog"
      ></uni-popup-dialog>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import uniPopup from '@/uni_modules/uni-popup/components/uni-popup/uni-popup.vue';
import uniPopupDialog from '@/uni_modules/uni-popup/components/uni-popup-dialog/uni-popup-dialog.vue';
import uniLoadMore from '@/uni_modules/uni-load-more/components/uni-load-more/uni-load-more.vue';
import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';
import { roleApi } from '@/api/admin';

// 角色列表数据
const roles = ref([]);

// 加载状态
const loading = ref(false);

// 分页信息
const currentPage = ref(1);
const pageSize = ref(10);
const totalRoles = ref(0);
const totalPages = computed(() => Math.ceil(totalRoles.value / pageSize.value));

// 生成要显示的页码数组
const displayedPages = computed(() => {
  const pages = [];
  const maxPagesToShow = 5; // 最多显示5个页码
  
  let startPage = Math.max(1, currentPage.value - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages.value, startPage + maxPagesToShow - 1);
  
  // 调整开始页码，确保显示足够的页码
  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  return pages;
});

// 颜色变量
const disabledColor = '#ccc';
const enabledColor = '#666';

// 弹窗引用
const popup = ref(null);
const confirmPopup = ref(null);

// 当前编辑的角色
const currentRole = reactive({
  id: null,
  name: '',
  description: '',
  status: '1',
  createTime: null,
  updateTime: null,
  isSystem: '0' // 是否系统内置角色，'1'表示是，默认'0'
});

// 弹窗标题
const dialogTitle = ref('新增角色');

// 待删除的角色ID
const roleToDeleteId = ref(null);

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

// 获取角色列表
const fetchRoles = async (page = 1) => {
  loading.value = true;
  currentPage.value = page;
  
  console.log('开始请求角色列表，页码:', page);
  
  try {
    // 构造查询参数
    const params = {
      page: page,
      size: pageSize.value
    };
    
    console.log('发送请求参数:', JSON.stringify(params));
    
    const res = await roleApi.getRoleList(params);
    
    console.log('获取角色列表成功:', JSON.stringify(res));
    
    // 确保返回的数据格式正确
    if (res && res.data && Array.isArray(res.data.list)) {
      roles.value = res.data.list;
      totalRoles.value = res.data.total || 0;
    } else {
      console.error('返回数据格式错误:', res);
      roles.value = [];
      totalRoles.value = 0;
    }
  } catch (error) {
    console.error('获取角色列表失败:', error);
    uni.showToast({
      title: '获取角色列表失败',
      icon: 'none'
    });
    roles.value = [];
    totalRoles.value = 0;
  } finally {
    loading.value = false;
  }
};

// 切换页码
const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  fetchRoles(page);
};

// 显示创建角色弹窗
const showCreateDialog = () => {
  dialogTitle.value = '新增角色';
  currentRole.id = null;
  currentRole.name = '';
  currentRole.description = '';
  currentRole.status = '1';
  currentRole.isSystem = '0'; // 新建时强制为'0'
  popup.value.open();
};

// 编辑角色
const editRole = (role) => {
  if (role.isSystem === '1') {
    uni.showToast({
      title: '系统内置角色不可编辑',
      icon: 'none'
    });
    return;
  }
  
  // 复制角色数据
  Object.assign(currentRole, { ...role });
  
  dialogTitle.value = '编辑角色';
  popup.value.open();
};

// 处理状态变更
const handleStatusChange = (e) => {
  currentRole.status = e.detail.value;
};

// 处理弹窗确认按钮点击
const handleDialogConfirm = () => {
  console.log('弹窗确认按钮被点击');
  saveRole();
};

// 保存角色
const saveRole = async () => {
  // 表单验证
  if (!currentRole.name) {
    uni.showToast({
      title: '角色名称不能为空',
      icon: 'none'
    });
    return;
  }
  
  loading.value = true;
  console.log('准备保存角色，当前角色数据:', JSON.stringify(currentRole));
  
  try {
    let res;
    
    // 构建请求数据对象
    const roleData = {
      name: currentRole.name,
      description: currentRole.description || '',
      status: currentRole.status,
      isSystem: currentRole.isSystem ? currentRole.isSystem : '0'
    };
    
    console.log('发送请求数据:', JSON.stringify(roleData));
    
    if (!currentRole.id) {
      // 新增角色
      console.log('正在添加新角色');
      res = await roleApi.addRole(roleData);
      
      console.log('添加角色成功:', JSON.stringify(res));
      uni.showToast({
        title: '添加成功',
        icon: 'success'
      });
    } else {
      // 更新角色
      console.log('正在更新角色ID:', currentRole.id);
      res = await roleApi.updateRole(currentRole.id, roleData);
      
      console.log('更新角色成功:', JSON.stringify(res));
      uni.showToast({
        title: '更新成功',
        icon: 'success'
      });
    }
    
    // 刷新角色列表
    await fetchRoles(currentPage.value);
    
    // 关闭弹窗
    closeDialog();
  } catch (error) {
    console.error('保存角色失败:', error);
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

// 切换角色状态
const toggleRoleStatus = async (role, value) => {
  if (role.isSystem === '1') {
    uni.showToast({
      title: '系统内置角色不可修改状态',
      icon: 'none'
    });
    return;
  }
  
  // 直接使用传入的布尔值
  const newStatus = value ? '1' : '0';
  
  console.log(`准备更新角色 ${role.id} 的状态为: ${newStatus} (${value})`);
  loading.value = true;
  
  try {
    const res = await roleApi.updateRoleStatus(role.id, newStatus);
    console.log('更新角色状态成功:', res);
    
    // 更新本地数据
    role.status = newStatus;
    
    uni.showToast({
      title: newStatus === '1' ? '角色已启用' : '角色已禁用',
      icon: 'success'
    });
  } catch (error) {
    console.error('更新角色状态失败:', error);
    uni.showToast({
      title: error.message || '操作失败',
      icon: 'none'
    });
    
    // 恢复Switch组件的状态
    setTimeout(() => {
      fetchRoles(currentPage.value);
    }, 200);
  } finally {
    loading.value = false;
  }
};

// 删除角色
const deleteRole = (role) => {
  if (role.isSystem === '1') {
    uni.showToast({
      title: '系统内置角色不可删除',
      icon: 'none'
    });
    return;
  }
  
  console.log('准备删除角色:', role);
  roleToDeleteId.value = role.id;
  confirmPopup.value.open();
};

// 确认删除
const confirmDelete = async () => {
  loading.value = true;
  console.log('正在删除角色ID:', roleToDeleteId.value);
  
  try {
    const res = await roleApi.deleteRole(roleToDeleteId.value);
    console.log('删除角色成功:', res);
    
    uni.showToast({
      title: '删除成功',
      icon: 'success'
    });
    
    // 刷新角色列表
    if (roles.value.length === 1 && currentPage.value > 1) {
      fetchRoles(currentPage.value - 1);
    } else {
      fetchRoles(currentPage.value);
    }
  } catch (error) {
    console.error('删除角色失败:', error);
    uni.showToast({
      title: error.message || '删除失败',
      icon: 'none'
    });
  } finally {
    loading.value = false;
    closeConfirmDialog();
  }
};

// 关闭确认弹窗
const closeConfirmDialog = () => {
  confirmPopup.value.close();
  roleToDeleteId.value = null;
};

// 初始化
onMounted(() => {
  console.log('RoleManagement组件已挂载，开始获取角色列表');
  setTimeout(() => {
    // 延迟100ms执行，确保组件完全渲染
    fetchRoles();
  }, 100);
});
</script>

<style>
.role-management {
  width: 100%;
}

.operation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.left-operations {
  display: flex;
  align-items: center;
}

.title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-right: 12px;
}

.refresh-btn {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 13px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background-color: #f0f2f5;
}

.btn {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  background-color: #f5f7fa;
  color: #333;
  border: 1px solid #ddd;
  margin-left: 8px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn:active {
  transform: translateY(1px);
}

.btn-primary {
  background-color: #4361ee;
  color: #fff;
  border-color: #4361ee;
}

.btn-primary:hover {
  background-color: #3b55d9;
  border-color: #3b55d9;
}

.btn-danger {
  background-color: #ff4d4f;
  color: #fff;
  border-color: #ff4d4f;
}

.btn-danger:hover {
  background-color: #f5222d;
  border-color: #f5222d;
}

.btn-sm {
  padding: 3px 8px;
  font-size: 12px;
}

.btn-icon {
  margin-right: 4px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.status-switch {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-active {
  color: #52c41a;
}

.status-inactive {
  color: #ff4d4f;
}

.actions {
  display: flex;
  justify-content: flex-start;
  gap: 6px;
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
  padding: 8px;
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.page-info {
  color: #666;
  font-size: 13px;
}

.page-controls {
  display: flex;
  gap: 6px;
}

.btn-page {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  font-size: 12px;
  border-radius: 4px;
  transition: all 0.2s;
}

.dialog-form {
  padding: 10px 0;
}

.form-item {
  margin-bottom: 15px;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.form-input {
  width: 100%;
  height: 34px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0 10px;
  font-size: 13px;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #4361ee;
  outline: none;
}

.form-textarea {
  width: 100%;
  height: 80px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 13px;
  resize: none;
  transition: border-color 0.2s;
}

.form-textarea:focus {
  border-color: #4361ee;
  outline: none;
}

.radio-label {
  margin-right: 20px;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn 0.3s ease;
}

@media screen and (max-width: 768px) {
  .td, .th {
    font-size: 12px;
    padding: 10px 6px;
  }
  
  .btn-sm {
    padding: 2px 6px;
    font-size: 11px;
  }
  
  .actions {
    flex-wrap: wrap;
  }
}
</style> 