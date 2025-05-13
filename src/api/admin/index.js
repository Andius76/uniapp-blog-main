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

// 导出默认接口组合
export default {
  user: userApi,
  article: articleApi
}; 