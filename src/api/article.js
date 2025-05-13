/**
 * 文章相关API接口封装 - 管理员模块
 * 文件位置: /src/api/article.js
 * 
 * 该文件为管理员端提供文章相关的API，主要用于：
 * - 获取文章标签列表
 * - 用户端引用的部分文章操作函数
 */

import http from '@/utils/request';

/**
 * 获取文章标签列表
 * @return {Promise} - 返回包含标签列表的Promise
 */
export function getArticleTags() {
  // 使用管理员API路径
  return http.get('/api/admin/tags');
}

/**
 * 创建新标签
 * @param {string} tagName - 标签名称
 * @return {Promise} - 返回创建结果的Promise
 */
export function createTag(tagName) {
  return http.post('/api/admin/tags', { name: tagName });
}

/**
 * 删除标签
 * @param {number|string} tagId - 标签ID
 * @return {Promise} - 返回删除结果的Promise
 */
export function deleteTag(tagId) {
  return http.delete(`/api/admin/tags/${tagId}`);
}

/**
 * 更新标签
 * @param {number|string} tagId - 标签ID
 * @param {string} tagName - 新标签名称
 * @return {Promise} - 返回更新结果的Promise
 */
export function updateTag(tagId, tagName) {
  return http.put(`/api/admin/tags/${tagId}`, { name: tagName });
} 