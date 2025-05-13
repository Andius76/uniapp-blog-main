/**
 * 评论相关API接口封装
 * 文件位置: /src/api/comment.js
 * 
 * 该文件封装了所有与评论相关的API请求，包括：
 * - 获取评论详情
 * - 点赞/取消点赞评论
 * - 删除评论
 * 
 * 所有API都基于/src/utils/request.js中的请求工具，
 * 确保了请求的一致性和错误处理。
 */

import http from '@/utils/request';

/**
 * 获取评论详情
 * @param {number|string} commentId - 评论ID
 * @return {Promise} - 返回包含评论详情的Promise
 */
export function getCommentDetail(commentId) {
  return http.get(`/api/comment/${commentId}`);
}

/**
 * 点赞或取消点赞评论
 * @param {number|string} commentId - 评论ID
 * @param {boolean} isLike - 是否点赞，true为点赞，false为取消点赞
 * @return {Promise} - 返回操作结果的Promise
 */
export function likeComment(commentId, isLike) {
  if (isLike) {
    return http.post(`/api/comment/like/${commentId}`);
  } else {
    return http.delete(`/api/comment/like/${commentId}`);
  }
}

/**
 * 删除评论
 * @param {number|string} commentId - 评论ID
 * @return {Promise} - 返回操作结果的Promise
 */
export function deleteComment(commentId) {
  return http.delete(`/api/comment/${commentId}`);
}

/**
 * 获取用户的所有评论
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码，从1开始
 * @param {number} params.pageSize - 每页条数
 * @return {Promise} - 返回包含评论列表的Promise
 */
export function getUserComments(params = {}) {
  return http.get('/api/comment/user', {
    params: {
      page: params.page || 1,
      pageSize: params.pageSize || 10
    }
  });
}

/**
 * 获取用户收到的评论
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码，从1开始
 * @param {number} params.pageSize - 每页条数
 * @return {Promise} - 返回包含评论列表的Promise
 */
export function getReceivedComments(params = {}) {
  return http.get('/api/comment/received', {
    params: {
      page: params.page || 1,
      pageSize: params.pageSize || 10
    }
  });
} 