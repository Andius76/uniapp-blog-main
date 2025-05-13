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
import http from '@/utils/request.js';

/**
 * 管理员登录
 * @param {Object} data - 请求数据
 * @param {string} data.username - 管理员账号
 * @param {string} data.password - 管理员密码
 * @returns {Promise} - 返回Promise对象
 */
export function adminLogin(data) {
  return http.post('/api/admin/login', {
    username: data.username,
    password: data.password
  });
}

/**
 * 获取管理员信息
 * @returns {Promise} - 返回Promise对象
 */
export function getAdminInfo() {
  return http.get('/api/admin/info');
}

/**
 * 管理员退出登录
 * @returns {Promise} - 返回Promise对象
 */
export function adminLogout() {
  return http.post('/api/admin/logout');
} 