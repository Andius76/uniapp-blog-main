import http from '@/utils/request';

/**
 * 获取消息列表
 * @param {Object} params - 请求参数
 * @param {Number} params.type - 消息类型：0-系统公告，1-点赞通知，2-关注通知，3-评论通知，不传则获取所有类型
 * @param {Number} params.page - 页码，默认1
 * @param {Number} params.pageSize - 每页条数，默认10
 * @returns {Promise} - 返回消息列表Promise
 */
export function getMessages(params) {
  return http.get('/api/message', params);
}

/**
 * 将指定消息标记为已读
 * @param {Number} messageId - 消息ID
 * @returns {Promise} - 返回操作结果Promise
 */
export function markMessageRead(messageId) {
  return http.put(`/api/message/read/${messageId}`);
}

/**
 * 批量标记消息为已读
 * @param {Number} type - 消息类型：0-系统公告，1-点赞通知，2-关注通知，3-评论通知，不传则标记所有类型
 * @returns {Promise} - 返回操作结果Promise
 */
export function markAllMessagesRead(type) {
  const params = type !== undefined ? { type } : {};
  return http.put('/api/message/read-all', params);
}

/**
 * 获取未读消息数量
 * @returns {Promise} - 返回未读消息数量Promise
 */
export function getUnreadMessageCount() {
  return http.get('/api/message/unread-count');
} 