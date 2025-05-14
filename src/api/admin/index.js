/**
 * 管理员API接口封装
 * 文件位置: /src/api/admin/index.js
 * 
 * 该文件封装了所有与管理后台相关的API请求，包括：
 * - 用户管理
 * - 文章管理
 * - 角色和权限管理
 * 
 * 所有API都基于/src/utils/request.js中的请求工具，
 * 该工具处理了不同平台(APP/H5/小程序)的基础URL、请求拦截和响应拦截。
 */

// 导入请求工具
import Request from '@/utils/request.js';

// 导入权限API
import permissionApi from './permission.js';
// 导入角色-权限关系API
import rolePermissionApi from './rolePermission.js';

// 用户管理API
export const userApi = {
  /**
   * 获取用户列表
   * @param {Object} params 查询参数
   * @param {number} params.page 页码
   * @param {number} params.size 每页数量
   * @param {string} params.keyword 搜索关键词
   * @param {number} params.status 用户状态
   * @returns {Promise} 返回Promise对象
   */
  getUserList(params) {
    return Request.get('/api/admin/users', { params });
  },
  
  /**
   * 获取用户详情
   * @param {number} id 用户ID
   * @returns {Promise} 返回Promise对象
   */
  getUserDetail(id) {
    return Request.get(`/api/admin/users/${id}`);
  },
  
  /**
   * 更新用户状态
   * @param {number} id 用户ID
   * @param {number} status 用户状态：0-禁用，1-正常
   * @returns {Promise} 返回Promise对象
   */
  updateUserStatus(id, status) {
    return Request.put(`/api/admin/users/${id}/status`, { status });
  },
  
  /**
   * 删除用户
   * @param {number} id 用户ID
   * @returns {Promise} 返回Promise对象
   */
  deleteUser(id) {
    return Request.delete(`/api/admin/users/${id}`);
  }
};

// 文章管理API
export const articleApi = {
  /**
   * 获取文章列表
   * @param {Object} params 查询参数
   * @param {number} params.page 页码
   * @param {number} params.size 每页数量
   * @param {string} params.status 文章状态：空字符串-全部，0-草稿，1-已发布，2-待审核，3-已下架
   * @param {string} params.keyword 搜索关键词
   * @returns {Promise} 返回Promise对象
   */
  getArticleList(params) {
    return Request.get('/api/admin/articles', { params });
  },
  
  /**
   * 获取文章详情
   * @param {number} id 文章ID
   * @returns {Promise} 返回Promise对象
   */
  getArticleDetail(id) {
    return Request.get(`/api/admin/articles/${id}`);
  },
  
  /**
   * 更新文章状态
   * @param {number} id 文章ID
   * @param {string} status 文章状态：0-草稿，1-已发布，2-待审核，3-已下架
   * @returns {Promise} 返回Promise对象
   */
  updateArticleStatus(id, status) {
    console.log(`更新文章${id}的状态为${status}`);
    return Request.put(`/api/admin/articles/${id}/status?status=${status}`);
  },
  
  /**
   * 删除文章
   * @param {number} id 文章ID
   * @returns {Promise} 返回Promise对象
   */
  deleteArticle(id) {
    return Request.delete(`/api/admin/articles/${id}`);
  }
};

// 角色管理API
export const roleApi = {
  /**
   * 获取角色列表
   * @param {Object} params 查询参数
   * @param {number} params.page 页码
   * @param {number} params.size 每页数量
   * @param {string} params.keyword 搜索关键词(可选)
   * @returns {Promise} 返回Promise对象
   */
  getRoleList(params) {
    console.log('正在请求角色列表，参数:', JSON.stringify(params));
    return Request.get('/api/admin/roles', { params })
      .catch(error => {
        console.error('获取角色列表失败:', error);
        // 如果是403错误，可能是权限问题
        if (error.statusCode === 403) {
          console.log('权限不足，请检查管理员权限');
          uni.showToast({
            title: '权限不足，请尝试重新登录',
            icon: 'none',
            duration: 2000
          });
          // 可以选择跳转到登录页
          setTimeout(() => {
            uni.redirectTo({
              url: '/pages/admin-login/admin-login'
            });
          }, 1500);
        }
        return Promise.reject(error);
      });
  },
  
  /**
   * 获取角色详情
   * @param {number} id 角色ID
   * @returns {Promise} 返回Promise对象
   */
  getRoleDetail(id) {
    return Request.get(`/api/admin/roles/${id}`);
  },
  
  /**
   * 添加角色
   * @param {Object} role 角色信息
   * @param {string} role.name 角色名称
   * @param {string} role.description 角色描述
   * @param {string} role.status 角色状态：0-禁用，1-启用
   * @returns {Promise} 返回Promise对象
   */
  addRole(role) {
    return Request.post('/api/admin/roles', role);
  },
  
  /**
   * 更新角色
   * @param {number} id 角色ID
   * @param {Object} role 角色信息
   * @param {string} role.name 角色名称
   * @param {string} role.description 角色描述
   * @param {string} role.status 角色状态：0-禁用，1-启用
   * @returns {Promise} 返回Promise对象
   */
  updateRole(id, role) {
    return Request.put(`/api/admin/roles/${id}`, role);
  },
  
  /**
   * 更新角色状态
   * @param {number} id 角色ID
   * @param {string} status 角色状态：0-禁用，1-启用
   * @returns {Promise} 返回Promise对象
   */
  updateRoleStatus(id, status) {
    return Request.put(`/api/admin/roles/${id}/status`, { status });
  },
  
  /**
   * 删除角色
   * @param {number} id 角色ID
   * @returns {Promise} 返回Promise对象
   */
  deleteRole(id) {
    return Request.delete(`/api/admin/roles/${id}`);
  },

  /**
   * 获取管理员的角色列表
   * @param {number} adminId 管理员ID
   * @returns {Promise} 返回Promise对象
   */
  getAdminRoles(adminId) {
    console.log('获取管理员角色，管理员ID:', adminId);
    return Request.get(`/api/admin/adminRoles/${adminId}`);
  },
  
  /**
   * 为管理员分配角色
   * @param {number} adminId 管理员ID
   * @param {number} roleId 角色ID
   * @returns {Promise} 返回Promise对象
   */
  assignAdminRole(adminId, roleId) {
    console.log('为管理员分配角色，管理员ID:', adminId, '角色ID:', roleId);
    return Request.post(`/api/admin/adminRoles`, { adminId, roleId });
  },

  /**
   * 获取角色拥有的权限
   * @param {number} roleId 角色ID
   * @returns {Promise} 返回Promise对象
   */
  getRolePermissions(roleId) {
    return Request.get(`/api/admin/roles/${roleId}/permissions`);
  },
  
  /**
   * 给角色分配权限
   * @param {number} roleId 角色ID
   * @param {Array} permissionIds 权限ID数组
   * @returns {Promise} 返回Promise对象
   */
  assignPermissions(roleId, permissionIds) {
    return Request.post(`/api/admin/roles/${roleId}/permissions`, {
      permissionIds
    });
  }
};

// 导出权限API
export { permissionApi, rolePermissionApi };

// 用户角色相关API
export const userRoleApi = {
  // 获取用户列表（带角色信息）
  getUserList(params) {
    return Request.get('/api/admin/users/roles', { params }, { withToken: true });
  },
  
  // 获取用户拥有的角色
  getUserRoles(userId) {
    return Request.get(`/api/admin/users/roles/${userId}`, {}, { withToken: true });
  },
  
  // 给用户分配角色
  assignUserRoles(userId, roleIds) {
    console.log('分配用户角色，用户ID:', userId, '角色IDs:', roleIds);
    return Request.post(`/api/admin/users/roles/${userId}`, {
      roleIds
    }, { withToken: true });
  },
  
  // 获取管理员列表（带角色信息）
  getAdminList(params) {
    return Request.get('/api/admin/users/roles/admin', { params }, { withToken: true });
  },
  
  // 获取管理员拥有的角色
  getAdminRoles(adminId) {
    return Request.get(`/api/admin/users/roles/admin/${adminId}`, {}, { withToken: true });
  },
  
  // 为管理员分配角色
  assignAdminRoles(adminId, roleIds) {
    console.log('分配管理员角色，管理员ID:', adminId, '角色IDs:', roleIds);
    
    // 构造请求对象
    const requestData = Array.isArray(roleIds) ? { roleIds: roleIds } : roleIds;
    
    // 使用专门的管理员角色分配接口
    return Request.post(`/api/admin/users/roles/admin/${adminId}`, requestData, { withToken: true })
    .catch(error => {
      console.error('分配管理员角色失败:', error);
      
      // 处理403权限错误
      if (error.statusCode === 403 || (error.response && error.response.status === 403)) {
        console.log('权限不足，无法分配管理员角色');
        // 这里不直接弹出提示，由页面组件处理具体的提示信息
      }
      
      // 将错误传递给调用方
      return Promise.reject(error);
    });
  }
};

// 导出默认接口组合
export default {
  user: userApi,
  article: articleApi,
  role: roleApi,
  permission: permissionApi,
  rolePermission: rolePermissionApi,
  userRole: userRoleApi
}; 