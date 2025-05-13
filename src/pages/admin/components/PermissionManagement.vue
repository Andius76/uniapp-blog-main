<template>
  <!-- 
  /**
   * 权限管理组件
   * 
   * 功能：
   * 1. 权限列表展示、分页、搜索
   * 2. 权限的添加、编辑、删除
   * 3. 角色权限分配
   * 
   * 错误处理：
   * 1. 表单验证 - 防止提交无效数据
   * 2. 网络请求错误 - 包括后端业务错误和HTTP错误
   * 3. 特殊错误处理 - 如权限标识符重复错误(Duplicate entry for key 'idx_code')
   * 4. 权限标识符格式建议 - 推荐使用"资源:操作"格式
   */
  -->
  <view class="permission-management">
    <view class="tab-container">
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'permissions' }"
        @click="activeTab = 'permissions'"
      >
        <text>权限列表</text>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'assignment' }"
        @click="activeTab = 'assignment'"
      >
        <text>权限分配</text>
      </view>
    </view>
    
    <!-- 权限列表标签页 -->
    <view v-if="activeTab === 'permissions'" class="tab-content">
      <!-- 操作栏 -->
      <view class="operation-bar">
        <button class="btn btn-primary" @click="showCreateDialog">新增权限</button>
      </view>
      
      <!-- 权限表格 -->
      <view class="table-container">
        <view class="table-header">
          <view class="th" style="flex: 0.8;">ID</view>
          <view class="th" style="flex: 2;">权限名称</view>
          <view class="th" style="flex: 2;">权限路径</view>
          <view class="th" style="flex: 3;">描述</view>
          <view class="th" style="flex: 2;">创建时间</view>
          <view class="th" style="flex: 2.5;">操作</view>
        </view>
        
        <view class="table-body">
          <view v-if="loading" class="loading-container">
            <uni-load-more status="loading" :contentText="loadingText"></uni-load-more>
          </view>
          
          <view v-else-if="permissions.length === 0" class="no-data">
            <text>暂无权限数据</text>
          </view>
          
          <view v-else class="table-row" v-for="(permission, index) in permissions" :key="permission.id">
            <view class="td" style="flex: 0.8;">{{ permission.id }}</view>
            <view class="td" style="flex: 2;">{{ permission.name }}</view>
            <view class="td" style="flex: 2;">{{ permission.path || '无' }}</view>
            <view class="td" style="flex: 3;">{{ permission.description || '暂无描述' }}</view>
            <view class="td" style="flex: 2;">{{ formatDate(permission.createTime) }}</view>
            <view class="td actions" style="flex: 2.5;">
              <button class="btn btn-sm" @click="editPermission(permission)" :disabled="permission.isSystem === '1'">编辑</button>
              <button class="btn btn-sm btn-danger" @click="deletePermission(permission)" :disabled="permission.isSystem === '1'">删除</button>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 分页 -->
      <view class="pagination" v-if="permissions.length > 0">
        <view class="page-info">
          <text>共 {{ totalPermissions }} 条记录，当前 {{ currentPermissionPage }}/{{ totalPermissionPages }} 页</text>
        </view>
        <view class="page-controls">
          <button 
            class="btn btn-sm" 
            :disabled="currentPermissionPage <= 1"
            @click="changePermissionPage(currentPermissionPage - 1)"
          >上一页</button>
          <button 
            class="btn btn-sm" 
            :disabled="currentPermissionPage >= totalPermissionPages"
            @click="changePermissionPage(currentPermissionPage + 1)"
          >下一页</button>
        </view>
      </view>
    </view>
    
    <!-- 权限分配标签页 -->
    <view v-if="activeTab === 'assignment'" class="tab-content">
      <!-- 操作提示 -->
      <view class="tips-container">
        <uni-icons type="info" size="16" color="#4361ee"></uni-icons>
        <text class="tips-text">在此页面可以为不同角色分配权限，分配后的权限将立即生效。</text>
      </view>

      <!-- 角色选择 -->
      <view class="selection-wrapper">
        <text class="selection-label">当前角色：</text>
        <view class="select-box">
          <picker 
            @change="onRoleChange" 
            :value="selectedRoleIndex" 
            :range="roleOptions" 
            range-key="label"
          >
            <view class="uni-input">
              {{ selectedRoleName || '请选择角色' }}
              <uni-icons type="arrow-down" size="14" color="#666"></uni-icons>
            </view>
          </picker>
        </view>
        <button 
          class="btn btn-sm refresh-btn" 
          @click="refreshCurrentRolePermissions" 
          :disabled="!selectedRole"
        >
          <uni-icons type="refresh" size="12" color="#666"></uni-icons>
          <text style="margin-left: 4px;">刷新权限</text>
        </button>
      </view>
      
      <!-- 加载中 -->
      <view v-if="loadingAssignments" class="loading-container">
        <uni-load-more status="loading" :contentText="loadingText"></uni-load-more>
      </view>
      
      <!-- 权限树/列表 -->
      <view v-else class="permission-assign-container">
        <!-- 检查是否有角色被选中 -->
        <view v-if="!selectedRole" class="no-data">
          <view class="no-data-icon">👆</view>
          <text>请先选择一个角色</text>
          <text class="no-data-hint">在上方下拉框中选择需要配置的角色</text>
        </view>
        
        <!-- 权限分配列表 -->
        <view v-else class="permission-assign-list">
          <view class="assign-header">
            <view class="assign-title">
              <text class="title-text">给"{{ selectedRoleName }}"分配权限</text>
              <text class="assign-subtitle">已选择 {{ selectedPermissions.length }} 项权限 / 共 {{ allPermissions.length }} 项</text>
            </view>
            <view class="assign-actions">
              <button class="btn btn-sm" @click="selectAll">全选</button>
              <button class="btn btn-sm" @click="deselectAll">取消全选</button>
              <button 
                class="btn btn-primary" 
                @click="saveAssignments" 
                :disabled="savingAssignments"
              >
                <text v-if="savingAssignments">保存中...</text>
                <text v-else>保存</text>
              </button>
            </view>
          </view>
          
          <!-- 搜索框 -->
          <view class="search-container">
            <uni-search-bar 
              placeholder="搜索权限名称、描述或路径" 
              v-model="permissionSearchText" 
              @input="onPermissionSearch"
              radius="5"
              cancelButton="none"
              clearButton="auto"
              bgColor="#f5f5f5"
            />
          </view>
          
          <!-- 分类切换 -->
          <view class="category-tabs">
              <view 
              class="category-tab" 
              :class="{ active: permissionCategory === 'all' }"
              @click="permissionCategory = 'all'"
            >
              <text>全部 ({{ allPermissions.length }})</text>
            </view>
            <view 
              class="category-tab" 
              :class="{ active: permissionCategory === 'selected' }"
              @click="permissionCategory = 'selected'"
            >
              <text>已选择 ({{ selectedPermissions.length }})</text>
            </view>
            <view 
              class="category-tab" 
              :class="{ active: permissionCategory === 'unselected' }"
              @click="permissionCategory = 'unselected'"
            >
              <text>未选择 ({{ allPermissions.length - selectedPermissions.length }})</text>
            </view>
          </view>
          
          <!-- 权限卡片 -->
          <view class="permission-cards">
            <view v-if="filteredPermissions.length === 0" class="no-data">
              <text>{{ permissionSearchText ? '没有找到匹配的权限' : '没有可用的权限' }}</text>
            </view>
            
            <checkbox-group @change="handlePermissionChange" class="checkbox-group">
              <view 
                v-for="(perm, index) in filteredPermissions" 
                :key="perm.id" 
                class="permission-card"
                :class="{ 'selected-card': selectedPermissions.includes(perm.id) }"
              >
                <checkbox 
                  :value="perm.id.toString()" 
                  :checked="selectedPermissions.includes(perm.id)"
                  color="#4361ee"
                  class="permission-checkbox"
                />
                <view class="permission-content" @click="togglePermission(perm.id)">
                  <view class="permission-header">
                  <text class="permission-name">{{ perm.name }}</text>
                    <text v-if="perm.isSystem === '1'" class="permission-tag system-tag">系统</text>
                    <text v-else class="permission-tag custom-tag">自定义</text>
                  </view>
                  <view class="permission-body">
                    <text class="permission-code">{{ perm.code }}</text>
                  <text class="permission-desc">{{ perm.description || '无描述' }}</text>
                  <text class="permission-path" v-if="perm.path">路径: {{ perm.path }}</text>
                  </view>
                  <view class="permission-footer">
                    <text class="permission-id">ID: {{ perm.id }}</text>
                    <text class="permission-time">{{ formatDate(perm.createTime) }}</text>
                  </view>
                </view>
              </view>
            </checkbox-group>
          </view>
          
          <!-- 底部保存按钮 -->
          <view class="assign-footer">
            <view class="statistics">
              <text>当前显示: {{ filteredPermissions.length }} 项</text>
              <text>已选择: {{ selectedPermissions.length }} 项</text>
              <text>总计: {{ allPermissions.length }} 项</text>
            </view>
            <button 
              class="btn btn-primary btn-block" 
              @click="saveAssignments"
              :disabled="savingAssignments"
            >
              <text v-if="savingAssignments">保存中...</text>
              <text v-else>保存权限配置</text>
            </button>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 权限编辑弹窗 -->
    <uni-popup ref="popup" type="dialog">
      <uni-popup-dialog
        :title="dialogTitle"
        :mode="'input'"
        :before-close="true"
        @confirm="savePermission"
        @close="closeDialog"
        width="90%"
      >
        <view class="dialog-form" style="max-width: 100%; padding: 10px;">
          <view class="form-item">
            <text class="form-label">权限名称 <text style="color: #ff4d4f;">*</text></text>
            <input 
              class="form-input" 
              v-model="currentPermission.name"
              placeholder="请输入权限名称" 
            />
          </view>
          
          <view class="form-item">
            <text class="form-label">权限标识符 <text style="color: #ff4d4f;">*</text></text>
            <input 
              class="form-input" 
              v-model="currentPermission.code"
              placeholder="请输入权限标识符，如：user:add" 
              @input="validatePermissionCode"
            />
            <text style="font-size: 12px; color: #999; margin-top: 3px; display: block; word-break: break-word;">唯一标识符，用于系统识别权限，建议采用"资源:操作"格式，如：user:view, article:edit</text>
            <text v-if="codeError" style="font-size: 12px; color: #ff4d4f; margin-top: 3px; display: block;">{{ codeError }}</text>
          </view>
          
          <view class="form-item">
            <text class="form-label">权限路径</text>
            <input 
              class="form-input" 
              v-model="currentPermission.path"
              placeholder="请输入权限路径，如：/api/admin/users" 
            />
            <text style="font-size: 12px; color: #999; margin-top: 3px; display: block;">API访问路径，用于后端权限控制，可选填</text>
          </view>
          
          <view class="form-item">
            <text class="form-label">权限描述</text>
            <textarea 
              class="form-textarea" 
              v-model="currentPermission.description"
              placeholder="请输入权限描述" 
            />
          </view>
        </view>
      </uni-popup-dialog>
    </uni-popup>
    
    <!-- 确认删除弹窗 -->
    <uni-popup ref="confirmPopup" type="dialog">
      <uni-popup-dialog
        title="删除确认"
        content="确定要删除该权限吗？删除后将无法恢复，且拥有该权限的角色将失去此权限。"
        :before-close="true"
        @confirm="confirmDelete"
        @close="closeConfirmDialog"
      ></uni-popup-dialog>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';
import uniLoadMore from '@/uni_modules/uni-load-more/components/uni-load-more/uni-load-more.vue';
import uniPopup from '@/uni_modules/uni-popup/components/uni-popup/uni-popup.vue';
import uniPopupDialog from '@/uni_modules/uni-popup/components/uni-popup-dialog/uni-popup-dialog.vue';
import uniSearchBar from '@/uni_modules/uni-search-bar/components/uni-search-bar/uni-search-bar.vue';
import { permissionApi, roleApi, rolePermissionApi } from '@/api/admin';

// 当前活动标签
const activeTab = ref('permissions');

// 权限列表数据
const permissions = ref([]);

// 所有权限（不分页，用于分配）
const allPermissions = ref([]);

// 加载状态
const loading = ref(false);
const loadingAssignments = ref(false);
const savingAssignments = ref(false);

// 权限列表分页
const currentPermissionPage = ref(1);
const permissionPageSize = ref(10);
const totalPermissions = ref(0);
const totalPermissionPages = computed(() => Math.ceil(totalPermissions.value / permissionPageSize.value));

// 角色数据
const roles = ref([]);

// 角色选择器选项
const roleOptions = computed(() => {
  return roles.value.map(role => ({
    value: role.id,
    label: role.name
  }));
});

// 当前选中的角色ID
const selectedRole = ref(null);
// 当前选中的角色索引
const selectedRoleIndex = ref(0);
// 当前选中的角色名称
const selectedRoleName = computed(() => {
  if (!selectedRole.value) return '';
  const role = roles.value.find(r => r.id === selectedRole.value);
  return role ? role.name : '';
});

// 当前编辑的权限
const currentPermission = reactive({
  id: null,
  name: '',
  code: '',
  path: '',
  description: '',
  createTime: null,
  isSystem: '0' // 是否系统内置权限，'1'表示是
});

// 已选择的权限ID列表（用于角色分配权限）
const selectedPermissions = ref([]);

// 弹窗引用
const popup = ref(null);
const confirmPopup = ref(null);

// 弹窗标题
const dialogTitle = ref('新增权限');

// 待删除的权限ID
const permissionToDeleteId = ref(null);

// 加载文本
const loadingText = {
  contentdown: '显示更多',
  contentrefresh: '加载中...',
  contentnomore: '没有更多数据了'
};

// 权限搜索相关
const permissionSearchText = ref('');
const permissionCategory = ref('all');

// 权限标识符错误提示
const codeError = ref('');

// 验证权限标识符
const validatePermissionCode = () => {
  // 重置错误提示
  codeError.value = '';
  
  // 检查是否为空
  if (!currentPermission.code || currentPermission.code.trim() === '') {
    codeError.value = '权限标识符不能为空';
    return false;
  }
  
  // 检查长度，至少3个字符
  if (currentPermission.code.length < 3) {
    codeError.value = '权限标识符至少需要3个字符';
    return false;
  }
  
  // 检查是否为纯数字
  if (/^\d+$/.test(currentPermission.code)) {
    codeError.value = '权限标识符不能是纯数字';
    return false;
  }
  
  // 检查格式，建议使用 resource:action 格式
  if (!currentPermission.code.includes(':')) {
    codeError.value = '建议使用"资源:操作"格式，如：user:add';
    // 这里我们只显示建议，但仍然允许保存
  }
  
  return true;
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

// 过滤后的权限列表
const filteredPermissions = computed(() => {
  if (!allPermissions.value.length) return [];
  
  // 先按照分类过滤
  let filtered = [...allPermissions.value];
  
  if (permissionCategory.value === 'selected') {
    filtered = filtered.filter(p => selectedPermissions.value.includes(p.id));
  } else if (permissionCategory.value === 'unselected') {
    filtered = filtered.filter(p => !selectedPermissions.value.includes(p.id));
  }
  
  // 如果没有搜索文本，直接返回分类过滤结果
  if (!permissionSearchText.value) return filtered;
  
  // 否则继续按搜索文本过滤
  const searchText = permissionSearchText.value.toLowerCase();
  return filtered.filter(p => {
    return (
      (p.name && p.name.toLowerCase().includes(searchText)) ||
      (p.description && p.description.toLowerCase().includes(searchText)) ||
      (p.path && p.path.toLowerCase().includes(searchText)) ||
      (p.code && p.code.toLowerCase().includes(searchText))
    );
  });
});

// 处理权限搜索
const onPermissionSearch = (e) => {
  permissionSearchText.value = e;
  console.log('搜索关键词:', permissionSearchText.value);
};

// 刷新当前角色的权限
const refreshCurrentRolePermissions = async () => {
  if (!selectedRole.value) {
    uni.showToast({
      title: '请先选择一个角色',
      icon: 'none'
    });
    return;
  }
  
  console.log('刷新角色权限, 角色ID:', selectedRole.value);
  
  // 显示加载中
  uni.showLoading({
    title: '获取权限中...',
    mask: true
  });
  
  try {
    await fetchRolePermissions(selectedRole.value);
    
    uni.showToast({
      title: '权限数据已刷新',
      icon: 'success'
    });
    
    // 添加诊断信息
    console.log('权限刷新结果:');
    console.log('- 角色ID:', selectedRole.value);
    console.log('- 角色名称:', selectedRoleName.value);
    console.log('- 权限数量:', selectedPermissions.value.length);
    
    // 如果权限为空且是超级管理员角色，显示警告
    if (selectedPermissions.value.length === 0 && selectedRoleName.value.includes('超级管理员')) {
      uni.showModal({
        title: '权限配置异常',
        content: '检测到超级管理员角色没有权限配置。这可能会导致管理功能无法正常工作，建议分配所有权限。',
        confirmText: '分配全部权限',
        cancelText: '稍后处理',
        success: (res) => {
          if (res.confirm) {
            // 分配所有权限
            selectAll();
            // 自动保存
            setTimeout(() => {
              saveAssignments();
            }, 300);
          }
        }
      });
    }
  } catch (error) {
    console.error('刷新权限失败:', error);
    uni.showToast({
      title: '权限刷新失败',
      icon: 'none'
    });
  } finally {
    uni.hideLoading();
  }
};

// 获取角色已有权限 - 增加更多错误处理和日志
const fetchRolePermissions = async (roleId) => {
  loadingAssignments.value = true;
  
  try {
    console.log('开始获取角色权限, 角色ID:', roleId);
    
    // 使用标准API路径获取角色权限
    const res = await rolePermissionApi.getRolePermissions(roleId);
    
    console.log('获取角色权限响应:', JSON.stringify(res));
    
    // 确保返回的数据格式正确
    if (res && Array.isArray(res.data)) {
      // 更新选中的权限
      selectedPermissions.value = res.data.map(p => p.id);
      console.log('解析后的角色权限IDs:', selectedPermissions.value);
    } else {
      console.error('角色权限返回格式错误:', res);
      selectedPermissions.value = [];
      
      // 显示错误提示
      uni.showToast({
        title: '获取角色权限失败，数据格式错误',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('获取角色权限失败:', error);
    selectedPermissions.value = [];
    
    // 详细的错误诊断
    let errorMsg = '获取角色权限失败';
    if (error.statusCode) {
      switch (error.statusCode) {
        case 401:
          errorMsg = '登录已过期，请重新登录';
          break;
        case 403:
          errorMsg = '没有权限访问，请检查角色权限';
          break;
        case 404:
          errorMsg = '未找到权限数据，请确认角色配置';
          break;
        case 500:
          errorMsg = '服务器内部错误，请联系管理员';
          break;
        default:
          errorMsg = `请求失败(${error.statusCode})，请稍后重试`;
      }
    }
    
    // 友好的错误提示
    uni.showToast({
      title: errorMsg,
      icon: 'none',
      duration: 3000
    });
  } finally {
    loadingAssignments.value = false;
  }
};

// 获取权限列表
const fetchPermissions = async (page = 1) => {
  loading.value = true;
  currentPermissionPage.value = page;
  
  console.log('开始请求权限列表，页码:', page);
  
  try {
    // 构造查询参数
    const params = {
      page: page,
      size: permissionPageSize.value
    };
    
    console.log('发送请求参数:', JSON.stringify(params));
    
    const res = await permissionApi.getPermissionList(params);
    
    console.log('获取权限列表响应:', JSON.stringify(res));
    
    // 确保返回的数据格式正确
    if (res && res.data) {
      if (Array.isArray(res.data)) {
        // 直接返回数组形式
    permissions.value = res.data;
        totalPermissions.value = res.total || 0;
      } else if (res.data.list && Array.isArray(res.data.list)) {
        // 返回包含list的对象形式
        permissions.value = res.data.list;
        totalPermissions.value = res.data.total || 0;
      } else {
        console.error('返回数据格式异常:', res);
        permissions.value = [];
        totalPermissions.value = 0;
      }
      console.log('解析后权限列表:', JSON.stringify(permissions.value));
      console.log('总权限数:', totalPermissions.value);
    } else {
      console.error('返回数据格式错误:', res);
      permissions.value = [];
      totalPermissions.value = 0;
    }
  } catch (error) {
    console.error('获取权限列表失败:', error);
    uni.showToast({
      title: '获取权限列表失败',
      icon: 'none'
    });
    permissions.value = [];
    totalPermissions.value = 0;
  } finally {
    loading.value = false;
  }
};

// 获取所有权限（不分页）- 改进错误处理和加载逻辑
const fetchAllPermissions = async () => {
  try {
    console.log('开始获取所有权限数据');
    
    // 显示加载状态
    loadingAssignments.value = true;
    
    // 构造查询参数，获取所有权限
    const params = {
      page: 1,  // 添加页码参数，从第1页开始
      size: 999 // 获取所有权限
    };
    
    console.log('发送请求参数:', JSON.stringify(params));
    
    // 直接使用复数形式的API
    const res = await permissionApi.getPermissionList(params);
    
    console.log('获取所有权限响应:', JSON.stringify(res));
    
    // 确保返回的数据格式正确
    if (res && res.data) {
      if (Array.isArray(res.data)) {
        // 直接返回数组形式
        allPermissions.value = res.data;
      } else if (res.data.list && Array.isArray(res.data.list)) {
        // 返回包含list的对象形式
        allPermissions.value = res.data.list;
      } else {
        console.error('返回数据格式异常:', res);
        allPermissions.value = [];
        
        // 显示错误提示
        uni.showToast({
          title: '权限数据格式错误',
          icon: 'none'
        });
      }
      console.log('解析后所有权限列表:', JSON.stringify(allPermissions.value));
      console.log('权限总数量:', allPermissions.value.length);
    } else {
      console.error('返回数据格式错误:', res);
      allPermissions.value = [];
      
      // 显示错误提示
      uni.showToast({
        title: '获取权限列表失败',
        icon: 'none'
      });
    }
    
    if (allPermissions.value.length === 0) {
      console.warn('警告：获取到的权限列表为空');
      
      // 显示空数据提示
      uni.showToast({
        title: '没有可用的权限数据',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('获取所有权限失败:', error);
    allPermissions.value = [];
    
    // 友好的错误提示
    uni.showToast({
      title: '获取权限列表失败，请稍后重试',
      icon: 'none'
    });
  } finally {
    loadingAssignments.value = false;
  }
};

// 获取所有角色 - 改进错误处理
const fetchRoles = async () => {
  try {
    console.log('开始获取角色列表');
    const res = await roleApi.getRoleList({
      size: 999 // 获取所有角色
    });
    
    console.log('获取角色列表响应:', JSON.stringify(res));
    
    if (res && res.data && res.data.list) {
      roles.value = res.data.list;
      console.log('解析后角色列表:', JSON.stringify(roles.value));
    } else {
      console.error('返回角色数据格式错误:', res);
      roles.value = [];
      
      // 显示错误提示
      uni.showToast({
        title: '角色数据格式错误',
        icon: 'none'
      });
    }
    
    // 如果没有角色数据，显示提示
    if (roles.value.length === 0) {
      uni.showToast({
        title: '没有可用的角色数据',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('获取角色列表失败:', error);
    roles.value = [];
    
    // 友好的错误提示
    uni.showToast({
      title: '获取角色列表失败，请稍后重试',
      icon: 'none'
    });
  }
};

// 切换权限页码
const changePermissionPage = (page) => {
  if (page < 1 || page > totalPermissionPages.value) return;
  fetchPermissions(page);
};

// 角色选择变化 - 完善逻辑
const onRoleChange = (e) => {
  const index = e.detail.value;
  selectedRoleIndex.value = index;
  const selectedRoleValue = roleOptions.value[index].value;
  
  // 避免重复加载相同角色
  if (selectedRole.value === selectedRoleValue) {
    console.log('角色未变更，无需重新加载权限');
    return;
  }
  
  selectedRole.value = selectedRoleValue;
  console.log(`角色选择已变更为: ${selectedRoleValue} (${roleOptions.value[index].label})`);
  
  // 获取该角色的权限
  if (selectedRole.value) {
    fetchRolePermissions(selectedRole.value);
  } else {
    console.warn('未选择有效角色，无法获取权限');
    selectedPermissions.value = [];
  }
};

// 显示创建权限弹窗
const showCreateDialog = () => {
  // 重置表单
  Object.assign(currentPermission, {
    id: null,
    name: '',
    code: '',
    path: '',
    description: '',
    createTime: null,
    isSystem: '0'
  });
  
  // 重置错误提示
  codeError.value = '';
  
  dialogTitle.value = '新增权限';
  popup.value.open();
};

// 编辑权限
const editPermission = (permission) => {
  if (permission.isSystem === '1') {
    uni.showToast({
      title: '系统内置权限不可编辑',
      icon: 'none'
    });
    return;
  }
  
  // 复制权限数据
  Object.assign(currentPermission, { ...permission });
  
  // 重置错误提示
  codeError.value = '';
  
  dialogTitle.value = '编辑权限';
  popup.value.open();
};

// 保存权限
const savePermission = async () => {
  // 表单验证
  if (!currentPermission.name) {
    uni.showToast({
      title: '权限名称不能为空',
      icon: 'none'
    });
    return;
  }
  
  // 验证权限标识符
  if (!validatePermissionCode()) {
    uni.showToast({
      title: codeError.value,
      icon: 'none'
    });
    return;
  }
  
  loading.value = true;
  
  try {
    if (!currentPermission.id) {
      // 新增权限
      await permissionApi.addPermission({
        name: currentPermission.name,
        code: currentPermission.code,
        path: currentPermission.path,
        description: currentPermission.description
      });
      
      uni.showToast({
        title: '添加成功',
        icon: 'success'
      });
    } else {
      // 更新权限
      await permissionApi.updatePermission(currentPermission.id, {
        name: currentPermission.name,
        code: currentPermission.code,
        path: currentPermission.path,
        description: currentPermission.description
      });
      
      uni.showToast({
        title: '更新成功',
        icon: 'success'
      });
    }
    
    // 刷新权限列表
    fetchPermissions(currentPermissionPage.value);
    // 刷新所有权限列表
    fetchAllPermissions();
    // 关闭弹窗
    closeDialog();
  } catch (error) {
    console.error('保存权限失败:', error);
    
    // 检查是否是权限标识符重复错误
    let errorMsg = '保存失败';
    
    if (error.response && error.response.data && error.response.data.message) {
      errorMsg = error.response.data.message;
    } else if (error.message) {
      errorMsg = error.message;
    }
    
    // 判断错误类型并提供更具体的错误提示
    if (errorMsg.includes('Duplicate entry') && errorMsg.includes('idx_code')) {
      // 权限标识符重复错误
      errorMsg = `权限标识符"${currentPermission.code}"已存在，请使用其他标识符`;
      
      // 标记权限标识符输入框错误
      codeError.value = '此权限标识符已被使用，请更换一个';
      
      // 显示带图标的错误提示
      uni.showModal({
        title: '添加失败',
        content: errorMsg,
        showCancel: false,
        confirmText: '我知道了'
      });
      return;
    }
    
    // 其他错误的通用提示
    uni.showToast({
      title: errorMsg,
      icon: 'none',
      duration: 3000
    });
  } finally {
    loading.value = false;
  }
};

// 关闭弹窗
const closeDialog = () => {
  popup.value.close();
};

// 删除权限
const deletePermission = (permission) => {
  if (permission.isSystem === '1') {
    uni.showToast({
      title: '系统内置权限不可删除',
      icon: 'none'
    });
    return;
  }
  
  permissionToDeleteId.value = permission.id;
  confirmPopup.value.open();
};

// 确认删除
const confirmDelete = async () => {
  loading.value = true;
  
  try {
    await permissionApi.deletePermission(permissionToDeleteId.value);
    
    uni.showToast({
      title: '删除成功',
      icon: 'success'
    });
    
    // 刷新权限列表
    if (permissions.value.length === 1 && currentPermissionPage.value > 1) {
      fetchPermissions(currentPermissionPage.value - 1);
    } else {
      fetchPermissions(currentPermissionPage.value);
    }
    
    // 刷新所有权限列表
    fetchAllPermissions();
  } catch (error) {
    console.error('删除权限失败:', error);
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
  permissionToDeleteId.value = null;
};

// 处理权限选择变化
const handlePermissionChange = (e) => {
  // 转换为数字数组
  selectedPermissions.value = e.detail.value.map(id => parseInt(id));
};

// 通过点击卡片切换权限
const togglePermission = (permissionId) => {
  // 检查权限是否已选中
  const index = selectedPermissions.value.indexOf(permissionId);
  
  if (index === -1) {
    // 如果未选中，则添加到选中列表
    selectedPermissions.value.push(permissionId);
  } else {
    // 如果已选中，则从选中列表中移除
    selectedPermissions.value.splice(index, 1);
  }
  
  console.log(`切换权限 ${permissionId}, 当前选中数量: ${selectedPermissions.value.length}`);
};

// 全选
const selectAll = () => {
  selectedPermissions.value = allPermissions.value.map(p => p.id);
};

// 取消全选
const deselectAll = () => {
  selectedPermissions.value = [];
};

// 保存权限分配 - 增强版
const saveAssignments = async () => {
  if (!selectedRole.value) {
    uni.showToast({
      title: '请先选择一个角色',
      icon: 'none'
    });
    return;
  }
  
  savingAssignments.value = true;
  
  try {
    console.log('开始保存权限分配，角色ID:', selectedRole.value, '权限IDs:', selectedPermissions.value);
    
    if (selectedPermissions.value.length === 0) {
      // 提示用户确认是否要清空权限
      return new Promise((resolve) => {
        uni.showModal({
          title: '确认操作',
          content: '您当前未选择任何权限，这将清空该角色的所有权限。确定要继续吗？',
          success: async (res) => {
            if (res.confirm) {
              // 用户确认清空权限
              await doSaveAssignments();
              resolve();
            } else {
              savingAssignments.value = false;
              resolve();
            }
          }
        });
      });
    } else {
      // 直接保存权限
      await doSaveAssignments();
    }
  } catch (error) {
    console.error('保存权限分配失败:', error);
    uni.showToast({
      title: error.message || '保存失败',
      icon: 'none'
    });
  } finally {
    savingAssignments.value = false;
  }
};

// 实际执行保存权限的方法
const doSaveAssignments = async () => {
  try {
    const res = await rolePermissionApi.assignPermissions(selectedRole.value, selectedPermissions.value);
    console.log('保存权限分配响应:', JSON.stringify(res));
    
    uni.showToast({
      title: '权限分配保存成功',
      icon: 'success'
    });
    
    // 刷新角色权限确保前后端数据一致
    await fetchRolePermissions(selectedRole.value);
    return true;
  } catch (error) {
    console.error('执行权限分配失败:', error);
    uni.showToast({
      title: error.message || '保存失败',
      icon: 'none'
    });
    return false;
  }
};

// 从URL获取roleId参数
const getRouteParams = () => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  
  if (currentPage && currentPage.options) {
    if (currentPage.options.roleId) {
      const roleId = parseInt(currentPage.options.roleId);
      selectedRole.value = roleId;
      
      activeTab.value = 'assignment'; // 自动切换到权限分配标签页
      
      // 获取该角色的权限
      fetchRolePermissions(roleId);
      
      // 更新选择器索引
      const index = roles.value.findIndex(r => r.id === roleId);
      if (index !== -1) {
        selectedRoleIndex.value = index;
      }
    }
  }
};

// 初始化 - 优化逻辑顺序和错误处理
onMounted(() => {
  console.log('PermissionManagement组件已挂载，开始获取数据');
  
  // 使用简化版的初始化，减少复杂性
  setTimeout(async () => {
    try {
      // 先获取所有权限（用于分配）
      await fetchAllPermissions();
      console.log('所有权限加载完成');
      
      // 再获取角色数据
      await fetchRoles();
      console.log('角色列表加载完成');
      
      // 处理路由参数
      getRouteParams();
      
      // 检查权限配置
      setTimeout(() => {
        checkSuperAdminPermissions();
      }, 500);
    } catch (error) {
      console.error('初始化数据加载失败:', error);
      uni.showToast({
        title: '数据加载失败，请重试',
        icon: 'none'
      });
    }
  }, 100);
});

// 检查超级管理员权限配置
const checkSuperAdminPermissions = async () => {
  try {
    console.log('检查超级管理员权限配置...');
    
    // 查找超级管理员角色
    const superAdminRole = roles.value.find(role => 
      role.name === '超级管理员' && role.isSystem === '1'
    );
    
    if (!superAdminRole) {
      console.warn('未找到超级管理员角色，跳过权限检查');
      return;
    }
    
    console.log('找到超级管理员角色:', superAdminRole);
    
    // 获取超级管理员权限
    loadingAssignments.value = true;
    
    try {
      // 获取超级管理员权限
      const res = await rolePermissionApi.getRolePermissions(superAdminRole.id);
      
      if (res && Array.isArray(res.data)) {
        const permissions = res.data;
        console.log('超级管理员权限数量:', permissions.length);
        
        // 如果超级管理员权限为空或少于最小阈值（例如5个基础权限）
        if (permissions.length < 5) {
          console.warn('超级管理员权限配置不完整，只有', permissions.length, '个权限');
          
          // 询问是否自动配置
          uni.showModal({
            title: '权限配置检测',
            content: '检测到超级管理员角色权限配置不完整。为确保系统正常运行，建议为超级管理员分配完整权限。',
            confirmText: '自动配置',
            cancelText: '稍后处理',
            success: (modalRes) => {
              if (modalRes.confirm) {
                // 选择超级管理员角色
                const index = roles.value.findIndex(r => r.id === superAdminRole.id);
                if (index !== -1) {
                  // 设置为当前选中角色
                  selectedRoleIndex.value = index;
                  selectedRole.value = superAdminRole.id;
                  
                  // 全选所有权限
                  selectAll();
                  
                  // 显示提示
                  uni.showToast({
                    title: '已全选权限，请保存',
                    icon: 'none',
                    duration: 2000
                  });
                  
                  // 切换到权限分配标签页
                  activeTab.value = 'assignment';
                }
              }
            }
          });
        } else {
          console.log('超级管理员权限配置正常');
        }
      }
    } catch (error) {
      console.error('获取超级管理员权限失败:', error);
    } finally {
      loadingAssignments.value = false;
    }
  } catch (err) {
    console.error('检查超级管理员权限配置失败:', err);
  }
};
</script>

<style>
.permission-management {
  width: 100%;
}

.tab-container {
  display: flex;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}

.tab-item {
  padding: 12px 20px;
  cursor: pointer;
  position: relative;
}

.tab-item.active {
  color: #4361ee;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #4361ee;
}

.tab-content {
  flex: 1;
}

.operation-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
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

.btn-danger {
  background-color: #ff4d4f;
  color: #fff;
  border-color: #ff4d4f;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn-block {
  display: block;
  width: 100%;
  margin: 10px 0;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.actions {
  display: flex;
  justify-content: space-around;
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

.dialog-form {
  padding: 10px 0;
  box-sizing: border-box;
  overflow: hidden;
}

.form-item {
  margin-bottom: 15px;
  width: 100%;
  box-sizing: border-box;
}

.form-label {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
  color: #333;
}

.form-input {
  width: 100%;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0 10px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-textarea {
  width: 100%;
  height: 80px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  font-size: 14px;
  box-sizing: border-box;
}

/* 权限分配相关样式 */
.selection-wrapper {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.selection-label {
  font-size: 16px;
  color: #333;
  margin-right: 10px;
  font-weight: bold;
}

.select-box {
  width: 200px;
  border: 1px solid #ddd;
  border-radius: 4px;
  height: 40px;
  background-color: #fff;
}

.uni-input {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  padding: 0 10px;
  font-size: 14px;
}

.permission-assign-container {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
  background-color: #fff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.assign-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
}

.assign-title {
  display: flex;
  flex-direction: column;
}

.title-text {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.assign-subtitle {
  font-size: 13px;
  color: #666;
}

.assign-actions {
  display: flex;
  gap: 10px;
}

.category-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.category-tab {
  padding: 8px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  font-size: 14px;
  transition: all 0.2s;
}

.category-tab.active {
  color: #fff;
  background-color: #4361ee;
  border-color: #4361ee;
  font-weight: bold;
}

.permission-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
  padding: 10px 0;
  margin-bottom: 20px;
}

.permission-card {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.permission-card:hover {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.selected-card {
  background-color: #f0f7ff;
  border-color: #4361ee;
}

.permission-checkbox {
  margin-right: 10px;
  margin-top: 4px;
}

.permission-content {
  flex: 1;
}

.permission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.permission-name {
  font-weight: bold;
  color: #333;
  font-size: 16px;
}

.permission-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  color: #fff;
}

.system-tag {
  background-color: #ff4d4f;
}

.custom-tag {
  background-color: #4361ee;
}

.permission-body {
  margin-bottom: 8px;
}

.permission-code {
  display: inline-block;
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
  font-family: monospace;
}

.permission-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
  display: block;
}

.permission-path {
  font-size: 12px;
  color: #999;
  display: block;
}

.permission-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.assign-footer {
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.statistics {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  background-color: #f9f9f9;
  padding: 10px;
  border-radius: 6px;
}

/* 操作提示样式 */
.tips-container {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  background-color: #e6f7ff;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #1890ff;
}

.tips-text {
  font-size: 14px;
  color: #555;
  margin-left: 10px;
}

.no-data {
  padding: 30px;
  text-align: center;
  color: #999;
}

.no-data-icon {
  font-size: 28px;
  margin-bottom: 10px;
}

.no-data-hint {
  font-size: 12px;
  color: #999;
  margin-top: 10px;
  display: block;
}

/* 刷新按钮样式 */
.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  font-size: 13px;
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-left: 10px;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background-color: #e0e0e0;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style> 