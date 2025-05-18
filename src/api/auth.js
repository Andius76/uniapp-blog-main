/**
 * 认证相关API接口封装
 * 文件位置: /src/api/auth.js
 * 
 * 该文件封装了所有与用户认证相关的API请求，包括：
 * - 发送验证码
 * - 用户注册
 * - 用户登录
 * - 管理员登录
 * - 重置密码
 * 
 * 所有API都基于/src/utils/request.js中的请求工具，
 * 该工具处理了不同平台(APP/H5/小程序)的基础URL、请求拦截和响应拦截。
 */

// 导入请求工具
import request from '@/utils/request.js';

/**
 * 发送邮箱验证码
 * @param {Object|string} params - 请求参数或邮箱字符串
 * @returns {Promise} - 返回Promise对象
 */
export const sendVerificationCode = (params) => {
  // 确保从params中获取email字符串
  const email = typeof params === 'object' ? params.email : params;
  return request.post(`/api/auth/send-email-code?email=${encodeURIComponent(email)}`);
};

/**
 * 用户注册
 * @param {Object} params - 注册参数
 * @param {string} params.email - 邮箱
 * @param {string} params.email_code - 邮箱验证码
 * @param {string} params.password - 密码
 * @returns {Promise} - 返回Promise对象
 */
export const register = (params) => {
  return request.post('/api/auth/register', params);
};

/**
 * 用户登录
 * @param {Object} data - 请求数据
 * @param {string} data.email - 邮箱
 * @param {string} data.password - 密码
 * @param {boolean} data.remember - 是否记住登录状态
 * @param {boolean} data.isAdmin - 是否是管理员登录
 * @returns {Promise} - 返回Promise对象
 */
export function login(data) {
  // 判断是否是管理员登录
  if (data.isAdmin) {
    // 管理员登录使用username作为后端接收参数
    return request.post('/api/admin/login', {
      username: data.username || data.email, // 优先使用username，兼容旧调用
      password: data.password
    });
  }
  return request.post('/api/auth/login', data);
}

/**
 * 忘记密码（发送重置链接）
 * @param {Object} data - 请求数据
 * @param {string} data.email - 邮箱地址
 * @returns {Promise} - 返回Promise对象
 */
export function forgetPassword(data) {
  return request.post('/api/auth/forget-password', data);
}

/**
 * 重置密码
 * @param {Object} data - 请求数据
 * @param {string} data.email - 邮箱地址
 * @param {string} data.email_code - 验证码
 * @param {string} data.new_password - 新密码
 * @returns {Promise} - 返回Promise对象
 */
export function resetPassword(data) {
  return request.post('/api/auth/reset-password', data);
}