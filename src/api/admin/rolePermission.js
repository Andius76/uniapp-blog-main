import request from '@/utils/request.js';

/**
 * 角色-权限关系管理API
 */
export default {
  /**
   * 获取角色拥有的权限ID列表
   * @param {number} roleId 角色ID
   * @returns {Promise} 返回Promise对象
   */
  getRolePermissions(roleId) {
    console.log('获取角色权限，角色ID:', roleId);
    return request.get(`/api/admin/roles/${roleId}/permissions`);
  },
  
  /**
   * 为角色分配权限
   * @param {number} roleId 角色ID
   * @param {Array<number>} permissionIds 权限ID数组
   * @returns {Promise} 返回Promise对象
   */
  assignPermissions(roleId, permissionIds) {
    console.log('分配角色权限，角色ID:', roleId, '权限IDs:', permissionIds);
    return request.post(`/api/admin/roles/${roleId}/permissions`, { permissionIds });
  }
} 