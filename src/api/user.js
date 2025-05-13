// 用户相关API接口

import request from '@/utils/request';

/**
 * 获取当前登录用户的个人信息
 * @returns {Promise} 返回用户信息
 */
export function getUserInfo() {
  return request.get('/api/user/info');
}

/**
 * 更新用户个人资料
 * @param {Object} data 用户资料数据
 * @param {String} data.nickname 用户昵称
 * @param {String} data.bio 个人简介
 * @returns {Promise} 更新结果
 */
export function updateUserProfile(data) {
  return request.put('/api/user/profile', data);
}

/**
 * 上传用户头像
 * @param {String} filePath 本地临时文件路径
 * @returns {Promise} 上传结果
 */
export function uploadUserAvatar(filePath) {
  return new Promise((resolve, reject) => {
    // 获取基础URL，与request.js保持一致
    const baseUrl = request.config ? request.config.baseUrl : 'http://localhost:8080';
    
    // 获取token
    const token = uni.getStorageSync('token');
    
    uni.uploadFile({
      url: `${baseUrl}/api/user/avatar`,
      filePath: filePath,
      name: 'avatar',
      header: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (uploadRes) => {
        try {
          // 将返回的字符串转换为JSON对象
          const result = JSON.parse(uploadRes.data);
          
          // 处理业务状态码
          if (result.code === 200) {
            // 确保头像URL是完整的
            if (result.data && result.data.avatarUrl) {
              // 如果返回的avatarUrl是相对路径，则拼接基础URL
              if (result.data.avatarUrl.startsWith('/')) {
                result.data.avatarUrl = baseUrl + result.data.avatarUrl;
              }
            }
            
            // 存储头像URL到本地，更新用户信息
            const userInfo = uni.getStorageSync('userInfo') || {};
            if (result.data && result.data.avatarUrl) {
              userInfo.avatar = result.data.avatarUrl;
              uni.setStorageSync('userInfo', userInfo);
            }
            
            resolve(result);
          } else {
            // 显示错误提示
            uni.showToast({
              title: result.message || '头像上传失败',
              icon: 'none'
            });
            reject(new Error(result.message || '头像上传失败'));
          }
        } catch (e) {
          reject(new Error('解析响应数据失败'));
        }
      },
      fail: (error) => {
        uni.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
        reject(error);
      }
    });
  });
}

/**
 * 获取用户关注列表
 * @param {Object} params 查询参数
 * @param {Number} params.page 页码
 * @param {Number} params.pageSize 每页条数
 * @returns {Promise} 关注列表数据
 */
export function getUserFollows(params) {
  return request.get('/api/user/follows', params);
}

/**
 * 获取用户粉丝列表
 * @param {Object} params 查询参数
 * @param {Number} params.page 页码
 * @param {Number} params.pageSize 每页条数
 * @returns {Promise} 粉丝列表数据
 */
export function getUserFollowers(params) {
  return request.get('/api/user/followers', params);
}

/**
 * 关注/取消关注用户
 * @param {Number} userId 用户ID
 * @param {Boolean} isFollow 是否关注，true为关注，false为取消关注
 * @returns {Promise} 操作结果
 */
export function followUser(userId, isFollow) {
  return isFollow ? 
    request.post(`/api/user/follow/${userId}`) : 
    request.delete(`/api/user/follow/${userId}`);
}

/**
 * 检查是否关注了指定用户
 * @param {Number} userId 要检查的用户ID
 * @returns {Promise} 关注状态结果
 */
export function checkUserFollow(userId) {
  return new Promise((resolve, reject) => {
    // 设置超时处理
    const timeoutId = setTimeout(() => {
      console.warn(`检查关注状态请求超时: userId=${userId}`);
      // 改为返回一个包含错误信息的对象，而不是直接reject
      resolve({
        code: 500,
        message: '请求超时',
        data: false
      });
    }, 5000); // 5秒超时
    
    // 发起请求
    request.get(`/api/user/check-follow/${userId}`)
      .then(result => {
        clearTimeout(timeoutId); // 清除超时
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timeoutId); // 清除超时
        console.error(`检查关注状态失败: userId=${userId}`, error);
        
        // 如果是404错误，说明用户不存在，返回特定对象
        if (error && error.code === 404) {
          resolve({
            code: 404,
            message: '用户不存在',
            data: false
          });
        } else {
          // 其他错误也返回包装后的对象，避免reject导致UI显示错误
          resolve({
            code: error.code || 500,
            message: error.message || '检查关注状态失败',
            data: false
          });
        }
      });
  });
} 