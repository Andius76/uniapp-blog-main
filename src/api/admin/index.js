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
import http from '@/utils/request.js';

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
    return http.get('/api/admin/users', params);
  },
  
  /**
   * 获取用户详情
   * @param {number} id 用户ID
   * @returns {Promise} 返回Promise对象
   */
  getUserDetail(id) {
    return http.get(`/api/admin/users/${id}`);
  },
  
  /**
   * 更新用户状态
   * @param {number} id 用户ID
   * @param {number} status 用户状态：0-禁用，1-正常
   * @returns {Promise} 返回Promise对象
   */
  updateUserStatus(id, status) {
    return http.put(`/api/admin/users/${id}/status`, { status });
  },
  
  /**
   * 删除用户
   * @param {number} id 用户ID
   * @returns {Promise} 返回Promise对象
   */
  deleteUser(id) {
    return http.delete(`/api/admin/users/${id}`);
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
    return http.get('/api/admin/articles', params);
  },
  
  /**
   * 获取文章详情
   * @param {number} id 文章ID
   * @returns {Promise} 返回Promise对象
   */
  getArticleDetail(id) {
    return http.get(`/api/admin/articles/${id}`);
  },
  
  /**
   * 更新文章状态
   * @param {number} id 文章ID
   * @param {string} status 文章状态：0-草稿，1-已发布，2-待审核，3-已下架
   * @returns {Promise} 返回Promise对象
   */
  updateArticleStatus(id, status) {
    console.log(`更新文章${id}的状态为${status}`);
    return http.put(`/api/admin/articles/${id}/status?status=${status}`);
  },
  
  /**
   * 删除文章
   * @param {number} id 文章ID
   * @returns {Promise} 返回Promise对象
   */
  deleteArticle(id) {
    return http.delete(`/api/admin/articles/${id}`);
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
    return http.get('/api/admin/roles', params)
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
    return http.get(`/api/admin/roles/${id}`);
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
    return http.post('/api/admin/roles', role);
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
    return http.put(`/api/admin/roles/${id}`, role);
  },
  
  /**
   * 更新角色状态
   * @param {number} id 角色ID
   * @param {string} status 角色状态：0-禁用，1-启用
   * @returns {Promise} 返回Promise对象
   */
  updateRoleStatus(id, status) {
    return http.put(`/api/admin/roles/${id}/status`, { status });
  },
  
  /**
   * 删除角色
   * @param {number} id 角色ID
   * @returns {Promise} 返回Promise对象
   */
  deleteRole(id) {
    return http.delete(`/api/admin/roles/${id}`);
  },

  /**
   * 获取管理员的角色列表
   * @param {number} adminId 管理员ID
   * @returns {Promise} 返回Promise对象
   */
  getAdminRoles(adminId) {
    console.log('获取管理员角色，管理员ID:', adminId);
    return http.get(`/api/admin/adminRoles/${adminId}`);
  },
  
  /**
   * 为管理员分配角色
   * @param {number} adminId 管理员ID
   * @param {number} roleId 角色ID
   * @returns {Promise} 返回Promise对象
   */
  assignAdminRole(adminId, roleId) {
    console.log('为管理员分配角色，管理员ID:', adminId, '角色ID:', roleId);
    return http.post(`/api/admin/adminRoles`, { adminId, roleId });
  }
};

// 导出权限API
export { permissionApi, rolePermissionApi };

// 导出默认接口组合
export default {
  user: userApi,
  article: articleApi,
  role: roleApi,
  permission: permissionApi,
  rolePermission: rolePermissionApi
}; 