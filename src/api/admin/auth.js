/**
 * 管理员认证相关API接口封装
 * 文件位置: /src/api/admin/auth.js
 * 
 * 该文件封装了所有与管理员认证相关的API请求，包括：
 * - 管理员登录
 * - 获取管理员信息
 * - 管理员退出登录
 */

// 导入请求工具
import request from '@/utils/request.js'

/**
 * 管理员登录
 * @param {Object} data - 登录信息
 * @param {String} data.username - 用户名
 * @param {String} data.password - 密码
 * @returns {Promise} - 返回登录结果
 */
export function adminLogin(data) {
  console.log('调用管理员登录API:', data);
  return request.post('/api/admin/login', data);
}

/**
 * 获取管理员信息
 * @returns {Promise} - 返回Promise对象
 */
export function getAdminInfo() {
  return request.get('/api/admin/info');
}

/**
 * 管理员退出登录
 * @returns {Promise} - 返回Promise对象
 */
export function adminLogout() {
  return request.post('/api/admin/logout');
} 