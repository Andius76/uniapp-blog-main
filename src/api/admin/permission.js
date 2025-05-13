import http from '@/utils/request.js';

/**
 * 权限管理相关API
 */
export default {
  /**
   * 获取权限列表 (复数形式)
   * @param {Object} params 查询参数
   * @param {number} params.page 页码
   * @param {number} params.size 每页数量
   * @param {string} params.keyword 搜索关键词(可选)
   * @returns {Promise} 返回Promise对象
   */
  getPermissionList(params) {
    console.log('正在请求权限列表，参数:', JSON.stringify(params));
    
    // 直接使用复数形式的API路径
    return http.get('/api/admin/permissions', params, { withToken: true });
  },
  
  /**
   * 获取权限详情
   * @param {number} id 权限ID
   * @returns {Promise} 返回Promise对象
   */
  getPermissionDetail(id) {
    // 直接使用复数形式
    return http.get(`/api/admin/permissions/${id}`, {}, { withToken: true });
  },
  
  /**
   * 添加权限
   * @param {Object} data 权限数据
   * @param {string} data.name 权限名称
   * @param {string} data.code 权限标识符
   * @param {string} data.path 权限路径(可选)
   * @param {string} data.description 权限描述(可选)
   * @returns {Promise} 返回Promise对象
   */
  addPermission(data) {
    // 直接使用复数形式
    return http.post('/api/admin/permissions', data, { withToken: true });
  },
  
  /**
   * 更新权限
   * @param {number} id 权限ID
   * @param {Object} data 权限数据
   * @param {string} data.name 权限名称
   * @param {string} data.code 权限标识符
   * @param {string} data.path 权限路径(可选)
   * @param {string} data.description 权限描述(可选)
   * @returns {Promise} 返回Promise对象
   */
  updatePermission(id, data) {
    // 直接使用复数形式
    return http.put(`/api/admin/permissions/${id}`, data, { withToken: true });
  },
  
  /**
   * 删除权限
   * @param {number} id 权限ID
   * @returns {Promise} 返回Promise对象
   */
  deletePermission(id) {
    // 直接使用复数形式
    return http.delete(`/api/admin/permissions/${id}`, {}, { withToken: true });
  },
  
  /**
   * 获取所有权限
   * @returns {Promise} 返回Promise对象
   */
  getAllPermissions() {
    // 直接使用复数形式
    return http.get('/api/admin/permissions/all', {}, { withToken: true });
  },
  
  /**
   * 获取角色拥有的权限
   * @param {number} roleId 角色ID
   * @returns {Promise} 返回Promise对象
   */
  getRolePermissions(roleId) {
    // 使用标准角色权限路径
    return http.get(`/api/admin/roles/${roleId}/permissions`, {}, { withToken: true });
  }
} 