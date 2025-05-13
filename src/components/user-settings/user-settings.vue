<template>
  <view class="user-settings-wrapper" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">
    <!-- 弹出层背景蒙版 -->
    <view class="mask" :class="{ 'visible': panelVisible }" @click="handleBackOrClose" v-if="visible"></view>
    
    <!-- 设置面板 -->
    <view 
      class="settings-panel" 
      :class="{ 
        'visible': panelVisible, 
        'fullscreen': true, 
        'sliding': isSliding,
        'weapp-fix': true /* 添加小程序专用样式 */
      }"
      :style="{ 
        transform: isSliding ? `translateY(${Math.max(0, touchStartY.value - touchCurrentY)}px)` : '',
        bottom: 0
      }"
    >
      <view class="panel-header">
        <text class="panel-title">
          {{ isConfirmingLogout ? '退出登录' : (isEditingNickname ? '修改昵称' : '用户设置') }}
        </text>
        <view class="close-btn" @click="handleBackOrClose">
          <uni-icons 
            :type="isEditingNickname || isConfirmingLogout ? 'left' : 'close'" 
            size="24" 
            color="#333"
          ></uni-icons>
        </view>
      </view>
      
      <!-- 主设置面板 -->
      <view 
        class="panel-content" 
        v-if="!isEditingNickname && !isConfirmingLogout"
        :class="{ 'panel-content--active': panelVisible }"
      >
        <!-- 账号信息（邮箱）- 不可更改 -->
        <view class="settings-item non-clickable">
          <view class="item-label">
            <uni-icons type="email" size="22" color="#666"></uni-icons>
            <text>账号</text>
          </view>
          <view class="item-content">
            <text class="email-preview">{{ userInfo.email || '未绑定邮箱' }}</text>
          </view>
        </view>
        
        <!-- 头像设置 -->
        <view class="settings-item" @click="changeAvatar">
          <view class="item-label">
            <uni-icons type="person" size="22" color="#666"></uni-icons>
            <text>修改头像</text>
          </view>
          <view class="item-content">
            <image 
              class="avatar-preview" 
              :src="processImageUrl(userInfo.avatar)" 
              mode="aspectFill"
              :class="{'avatar-updated': isAvatarUpdated}"
            ></image>
            <view class="item-right">
              <text v-if="isAvatarUpdated" class="success-text">更新成功</text>
              <uni-icons type="right" size="18" color="#999"></uni-icons>
            </view>
          </view>
        </view>
        
        <!-- 昵称设置 -->
        <view class="settings-item" @click="showNicknameEdit">
          <view class="item-label">
            <uni-icons type="chat" size="22" color="#666"></uni-icons>
            <text>修改昵称</text>
          </view>
          <view class="item-content">
            <text class="nickname-preview">{{ userInfo.nickname }}</text>
            <uni-icons type="right" size="18" color="#999"></uni-icons>
          </view>
        </view>
        
        <!-- 退出登录 -->
        <view class="settings-item logout-item" @click="showLogoutConfirm">
          <view class="item-label">
            <uni-icons type="logout" size="22" color="#ff6b6b"></uni-icons>
            <text class="logout-text">退出登录</text>
          </view>
        </view>
      </view>
      
      <!-- 昵称编辑面板 -->
      <view 
        class="nickname-edit-panel" 
        v-else-if="isEditingNickname"
        :class="{ 'panel-content--active': panelVisible }"
      >
        <view class="nickname-input-container">
          <input 
            class="nickname-input"
            type="text"
            v-model="newNickname"
            placeholder="请输入新昵称"
            maxlength="20"
            :focus="isEditingNickname"
            @focus="handleInputFocus"
            @blur="handleInputBlur"
          />
          <text class="char-count" :class="{ 'char-count--warning': newNickname.length >= 15 }">
            {{ newNickname.length }}/20
          </text>
        </view>
        
        <view class="nickname-actions">
          <view 
            class="nickname-action-btn cancel" 
            :class="{ 'disabled': isProcessing }"
            @click="cancelEditNickname($event)"
          >
            取消
          </view>
          <view 
            class="nickname-action-btn confirm" 
            :class="{ 
              'disabled': isProcessing || !newNickname.trim() || newNickname === originalNickname.value 
            }"
            @click="updateNickname"
          >
            确认
          </view>
        </view>
      </view>
      
      <!-- 退出登录确认面板 -->
      <view 
        class="logout-confirm-panel" 
        v-else-if="isConfirmingLogout"
        :class="{ 'panel-content--active': panelVisible }"
      >
        <view class="logout-confirm-content">
          <uni-icons type="help" size="60" color="#ff6b6b"></uni-icons>
          <text class="logout-confirm-text">确定要退出登录吗？</text>
        </view>
        
        <view class="logout-actions">
          <view 
            class="logout-action-btn cancel" 
            :class="{ 'disabled': isProcessing }"
            @click="cancelLogout($event)"
          >
            取消
          </view>
          <view 
            class="logout-action-btn confirm" 
            :class="{ 'disabled': isProcessing }"
            @click="logout"
          >
            确认退出
          </view>
        </view>
      </view>
      
      <!-- 版本信息 -->
      <view class="version-info" v-if="!isEditingNickname && !isConfirmingLogout">
        <text>当前版本: v1.0.0</text>
      </view>
    </view>
    
    <!-- 确认放弃修改弹窗 -->
    <uni-popup ref="confirmPopup" type="dialog">
      <uni-popup-dialog 
        type="warning"
        title="提示" 
        content="您有未保存的修改，确定放弃吗？" 
        @confirm="confirmAbandonChanges" 
        @close="cancelAbandonChanges"
        confirmText="放弃修改"
        cancelText="继续编辑"
      ></uni-popup-dialog>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, reactive, defineProps, defineEmits, watch, onMounted, onUnmounted, nextTick } from 'vue';
import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';
import uniPopup from '@/uni_modules/uni-popup/components/uni-popup/uni-popup.vue';
import uniPopupDialog from '@/uni_modules/uni-popup/components/uni-popup-dialog/uni-popup-dialog.vue';
import http from '@/utils/request';
import { getBaseUrl } from '@/utils/request'; // 引入统一的getBaseUrl函数

// 定义组件属性
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  userInfo: {
    type: Object,
    default: () => ({
      avatar: '/static/images/avatar.png',
      nickname: '用户昵称',
      bio: '这个人很懒，什么都没写',
      email: ''
    })
  },
  initialView: {
    type: String,
    default: 'main' // 可选值: 'main', 'nickname'
  }
});

// 定义事件
const emit = defineEmits(['update:visible', 'avatar-change', 'nickname-change', 'bio-change', 'logout', 'before-avatar-select']);

// 面板状态管理
const isEditingNickname = ref(false);
const isConfirmingLogout = ref(false);
const newNickname = ref('');
const confirmPopup = ref(null);
const hasUnsavedChanges = ref(false);
const originalNickname = ref('');
const isBackConfirming = ref(false);
const isAvatarUpdated = ref(false); // 新增：标记头像是否刚刚更新成功

// 滑动相关状态
const touchStartX = ref(0);
const touchStartY = ref(0);
const isSliding = ref(false);
const panelWidth = ref(0);
const touchThreshold = 50; // 滑动阈值
const gestureLocked = ref(false); // 防止连续触发
const panelVisible = ref(false); // 控制面板实际显示状态

// 添加处理状态
const isProcessing = ref(false);
const touchCurrentY = ref(0);
const isInputFocused = ref(false);

// 添加防抖控制
let debounceTimer = null;
const debounce = (fn, delay = 300) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    fn();
    debounceTimer = null;
  }, delay);
};

// 监听面板显示状态
watch(() => props.visible, (newVal) => {
  try {
    if (newVal) {
      // 设置面板为可见
      panelVisible.value = true;
      
      // #ifdef APP-PLUS || MP-WEIXIN
      // 在APP和小程序中特殊处理
      setTimeout(() => {
        if (panelVisible.value) {
          console.log('强制刷新设置面板显示状态');
          // 尝试强制刷新显示状态
          panelVisible.value = false;
          setTimeout(() => {
            panelVisible.value = true;
          }, 50);
        }
      }, 100);
      // #endif
      
      // 延迟添加动画类，确保过渡效果正常
      nextTick(() => {
        try {
          // 如果面板显示，根据初始视图设置显示界面
          if (props.initialView === 'nickname') {
            showNicknameEdit();
          }
          // 注册事件监听
          registerBackButtonListener();
          registerTabBarInterceptor();
          // 重置状态
          isSliding.value = false;
          gestureLocked.value = false;
          
          // 获取屏幕信息
          uni.getSystemInfo({
            success: (res) => {
              panelWidth.value = res.windowWidth;
            },
            fail: (err) => {
              console.error('获取系统信息失败:', err);
              panelWidth.value = 375; // 默认宽度
            }
          });
        } catch (e) {
          console.error('设置面板初始化失败:', e);
        }
      });
    } else {
      // 面板关闭时使用防抖，避免频繁切换状态
      debounce(() => {
        try {
          // 先移除动画类
          panelVisible.value = false;
          // 重置所有状态
          isEditingNickname.value = false;
          isConfirmingLogout.value = false;
          hasUnsavedChanges.value = false;
          
          // 移除事件监听
          unregisterBackButtonListener();
          unregisterTabBarInterceptor();
          
          // 锁定手势防止连续触发
          gestureLocked.value = true;
          setTimeout(() => {
            gestureLocked.value = false;
          }, 800);
        } catch (e) {
          console.error('关闭设置面板失败:', e);
        }
      });
    }
  } catch (e) {
    console.error('处理面板显示状态变化失败:', e);
  }
});

// 监听昵称输入变化，判断是否有未保存的修改
watch(() => newNickname.value, (newVal) => {
  if (isEditingNickname.value) {
    hasUnsavedChanges.value = newVal !== originalNickname.value;
  }
});

// 处理触摸相关的事件函数
const handleTouchStart = (e) => {
  // H5环境下忽略此操作，APP和小程序才执行
  // #ifndef H5
  if (!props.visible || gestureLocked.value) return;
  
  if (e.touches && e.touches.length > 0) {
    touchStartX.value = e.touches[0].clientX;
    touchStartY.value = e.touches[0].clientY;
  }
  // #endif
};

// 处理返回或关闭
const handleBackOrClose = (e) => {
  // #ifdef H5
  if (e) e.stopPropagation();
  // #endif
  
  if (isEditingNickname.value && hasUnsavedChanges.value) {
    // 如果有未保存的修改，显示确认弹窗
    showConfirmAbandonDialog();
  } else if (isEditingNickname.value) {
    // 返回主设置页面
    cancelEditNickname(e);
  } else if (isConfirmingLogout.value) {
    // 返回主设置页面
    cancelLogout(e);
  } else {
    // 关闭整个设置面板
    closeSettings();
  }
};

// 显示确认放弃修改弹窗
const showConfirmAbandonDialog = () => {
  isBackConfirming.value = true;
  nextTick(() => {
    confirmPopup.value.open();
  });
};

// 确认放弃修改
const confirmAbandonChanges = () => {
  if (isEditingNickname.value) {
    cancelEditNickname();
  }
  
  isBackConfirming.value = false;
  hasUnsavedChanges.value = false;
  
  // 如果是在主设置面板，则关闭整个设置
  if (!isEditingNickname.value && !isConfirmingLogout.value) {
    closeSettings();
  }
};

// 取消放弃修改
const cancelAbandonChanges = () => {
  isBackConfirming.value = false;
};

// 关闭设置面板
const closeSettings = () => {
  // 如果正在处理中，直接返回
  if (gestureLocked.value) return;
  
  // 锁定手势
  gestureLocked.value = true;
  
  // 添加关闭动画
  panelVisible.value = false;
  
  // 延迟发送关闭事件，等待动画完成
  setTimeout(() => {
    emit('update:visible', false);
    gestureLocked.value = false;
  }, 300);
};

/**
 * 处理图片URL，确保能正确显示
 * @param {String} imageUrl - 图片URL
 * @returns {String} 处理后的URL
 */
const processImageUrl = (imageUrl) => {
  if (!imageUrl) {
    return '/static/images/avatar.png';
  }
  
  // 如果已经是完整URL或本地路径，直接返回
  if (imageUrl.startsWith('http') || imageUrl.startsWith('/static/')) {
    return imageUrl;
  }
  
  // 如果是后端返回的相对路径，拼接基础URL
  if (imageUrl.startsWith('/uploads/')) {
    // 获取基础URL
    const baseUrl = getBaseUrl();
    return baseUrl + imageUrl;
  }
  
  // 其他情况，可能是文件名，拼接完整路径
  return '/static/images/avatar.png';
};

/**
 * 获取基础URL
 */
// 已引入统一的getBaseUrl，不需要本地定义

// 修改头像
const changeAvatar = (e) => {
  // H5环境下阻止事件冒泡
  // #ifdef H5
  if (e) e.stopPropagation();
  // #endif
  
  // 重置状态
  isAvatarUpdated.value = false;
  
  // 触发头像选择前事件，通知父组件正在进行特殊操作
  emit('before-avatar-select');
  
  // 获取token
  const token = uni.getStorageSync('token');
  console.log('当前token:', token); // 调试日志
  if (!token) {
    uni.showModal({
      title: '提示',
      content: '登录信息已失效，请重新登录',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({
            url: '/pages/login/login'
          });
        }
      }
    });
    return;
  }
  
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePaths = res.tempFilePaths;
      console.log('选择图片成功，临时路径:', tempFilePaths[0]); // 添加调试日志
      
      // 验证文件大小（限制为2MB）
      uni.getFileInfo({
        filePath: tempFilePaths[0],
        success: (fileInfo) => {
          const fileSizeInMB = fileInfo.size / (1024 * 1024);
          console.log('文件大小:', fileSizeInMB, 'MB'); // 添加调试日志
          
          if (fileSizeInMB > 2) {
            uni.showToast({
              title: '图片大小不能超过2MB',
              icon: 'none'
            });
            return;
          }
      
          // 显示上传中提示
          uni.showLoading({
            title: '上传中...'
          });
          
          const baseUrl = getBaseUrl();
          console.log('上传接口URL:', baseUrl + '/api/user/avatar'); // 添加调试日志
          
          // 特殊处理微信小程序环境下的文件路径
          // #ifdef MP-WEIXIN
          console.log('微信小程序环境，特殊处理文件路径');
          // 检查文件是否存在
          uni.saveFile({
            tempFilePath: tempFilePaths[0],
            success: function(saveRes) {
              console.log('文件已保存，永久路径:', saveRes.savedFilePath);
              // 使用保存后的文件路径进行上传
              uploadAvatarFile(baseUrl, saveRes.savedFilePath, token);
            },
            fail: function(err) {
              console.error('保存文件失败:', err);
              uni.hideLoading();
              uni.showToast({
                title: '文件读取失败',
                icon: 'none'
              });
            }
          });
          // #endif
          
          // 非微信小程序环境直接上传
          // #ifndef MP-WEIXIN
          uploadAvatarFile(baseUrl, tempFilePaths[0], token);
          // #endif
        },
        fail: (err) => {
          console.error('获取文件信息失败:', err);
          handleUploadError('获取文件信息失败');
        }
      });
    },
    fail: (err) => {
      console.log('用户取消选择头像:', err);
      // 用户取消选择头像，通知父组件操作已结束
      emit('avatar-change', props.userInfo.avatar);
    }
  });
};

// 抽取上传头像的函数
const uploadAvatarFile = (baseUrl, filePath, token) => {
  console.log('准备上传文件，路径:', filePath); // 添加调试日志
  
  // 直接上传头像到服务器
  uni.uploadFile({
    url: baseUrl + '/api/user/avatar',
    filePath: filePath,
    name: 'avatar', // 确保参数名与后端API一致
    header: {
      // 确保使用正确的Bearer格式
      'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
    },
    success: (uploadRes) => {
      uni.hideLoading();
      
      console.log('头像上传响应:', uploadRes);
      console.log('响应状态码:', uploadRes.statusCode);
      
      // 处理403错误
      if (uploadRes.statusCode === 403) {
        uni.showModal({
          title: '授权失败',
          content: '登录信息已过期，请重新登录',
          confirmText: '去登录',
          success: (res) => {
            if (res.confirm) {
              // 清除token
              uni.removeStorageSync('token');
              uni.navigateTo({
                url: '/pages/login/login'
              });
            }
          }
        });
        return;
      }
      
      try {
        // 解析响应数据
        let responseData = uploadRes.data;
        if (typeof responseData === 'string') {
          responseData = JSON.parse(responseData);
        }
        
        console.log('解析后的响应数据:', responseData);
        
        // 专门处理创建目录失败的错误
        if (responseData.code === 500 && responseData.message && responseData.message.includes('创建上传目录失败')) {
          console.error('服务器存储错误:', responseData.message);
          uni.hideLoading();
          uni.showModal({
            title: '上传失败',
            content: '服务器无法创建保存头像的目录，这是服务器配置问题。请联系管理员解决存储权限问题，或稍后再试。',
            showCancel: false,
            confirmText: '我知道了'
          });
          return;
        }
        
        // 检查响应状态
        if (uploadRes.statusCode === 200 && responseData.code === 200) {
          // 获取头像URL
          let avatarUrl = '';
          if (responseData.data && responseData.data.avatarUrl) {
            avatarUrl = responseData.data.avatarUrl;
          } else if (responseData.data) {
            avatarUrl = typeof responseData.data === 'string' ? responseData.data : '';
          }
          
          // 设置头像更新成功状态
          isAvatarUpdated.value = true;
          
          // 通知父组件头像已更改
          emit('avatar-change', avatarUrl || filePath);
          
          // 显示成功提示
          uni.showToast({
            title: '头像更新成功',
            icon: 'success',
            duration: 2000
          });
          
          // 3秒后重置状态
          setTimeout(() => {
            isAvatarUpdated.value = false;
          }, 3000);
          
          // #ifdef MP-WEIXIN
          // 微信小程序环境下，清理保存的临时文件
          if (filePath.indexOf('wxfile://') === 0) {
            uni.removeSavedFile({
              filePath: filePath,
              fail: (err) => {
                console.log('清理临时文件失败:', err);
              }
            });
          }
          // #endif
        } else {
          // 其他错误
          const errorMsg = responseData.message || '头像上传失败';
          handleUploadError(errorMsg);
        }
      } catch (e) {
        console.error('处理上传响应失败:', e);
        handleUploadError('处理响应数据失败');
      }
    },
    fail: (err) => {
      uni.hideLoading();
      console.error('头像上传请求失败:', err);
      handleUploadError(err.errMsg || '网络错误，上传失败');
    }
  });
};

// 处理上传错误
const handleUploadError = (errorMsg) => {
  console.error('头像上传错误:', errorMsg);
  
  // 特别处理"创建上传目录失败"错误
  if (errorMsg.includes('创建上传目录失败')) {
    uni.showModal({
      title: '服务器存储错误',
      content: '服务器无法创建保存头像的目录，这是服务器配置问题。请联系管理员解决或稍后再试。',
      showCancel: false,
      confirmText: '我知道了'
    });
    // 可能需要向服务器发送错误报告或记录日志
    console.warn('服务器文件系统错误，可能是目录权限问题');
  } else if (errorMsg.includes('权限不足') || errorMsg.includes('授权失败')) {
    // 处理授权相关错误
    uni.showModal({
      title: '授权失败',
      content: '您的登录信息已过期，请重新登录',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          uni.removeStorageSync('token');
          uni.navigateTo({
            url: '/pages/login/login'
          });
        }
      }
    });
  } else {
    // 延迟显示错误提示，避免被其他UI元素覆盖
    setTimeout(() => {
      uni.showToast({
        title: errorMsg.length > 20 ? errorMsg.substring(0, 20) + '...' : errorMsg,
        icon: 'none',
        duration: 3000
      });
    }, 100);
  }
};

// 显示昵称编辑界面
const showNicknameEdit = (e) => {
  // H5环境下阻止事件冒泡
  // #ifdef H5
  if (e) e.stopPropagation();
  // #endif
  
  originalNickname.value = props.userInfo.nickname;
  newNickname.value = props.userInfo.nickname;
  isEditingNickname.value = true;
  hasUnsavedChanges.value = false;
};

// 取消编辑昵称
const cancelEditNickname = (e) => {
  // H5环境下阻止事件冒泡
  // #ifdef H5
  if (e) e.stopPropagation();
  // #endif
  
  isEditingNickname.value = false;
  hasUnsavedChanges.value = false;
  // 返回主设置页面而不是关闭整个面板
};

// 处理输入框焦点
const handleInputFocus = () => {
  isInputFocused.value = true;
};

const handleInputBlur = () => {
  isInputFocused.value = false;
};

// 处理触摸移动
const handleTouchMove = (e) => {
  // H5环境下忽略此操作，APP和小程序才执行
  // #ifndef H5
  if (!props.visible || gestureLocked.value) return;
  
  if (!e.touches[0] || !touchStartX.value) return;
  
  const currentX = e.touches[0].clientX;
  const currentY = e.touches[0].clientY;
  touchCurrentY.value = currentY;
  
  // 计算水平和垂直滑动距离
  const diffX = currentX - touchStartX.value;
  const diffY = currentY - touchStartY.value;
  
  // 判断是否为水平滑动（水平位移大于垂直位移）
  if (Math.abs(diffX) > Math.abs(diffY)) {
    if (diffX > touchThreshold) {
      // 检查是否有未保存的更改
      if (isEditingNickname.value && hasUnsavedChanges.value) {
        showConfirmAbandonDialog();
        touchStartX.value = 0;
        touchCurrentY.value = 0;
        return;
      } else if (isEditingNickname.value) {
        cancelEditNickname(e);
        touchStartX.value = 0;
        touchCurrentY.value = 0;
        return;
      } else if (isConfirmingLogout.value) {
        cancelLogout(e);
        touchStartX.value = 0;
        touchCurrentY.value = 0;
        return;
      } else {
        isSliding.value = true;
        e.preventDefault();
      }
    }
  }
  // #endif
  
  // #ifdef H5
  // H5环境下特殊处理，从右向左滑动时关闭侧边栏
  if (!props.visible || gestureLocked.value) return;
  
  if (e.touches && e.touches[0] && touchStartX.value) {
    const currentX = e.touches[0].clientX;
    // 计算水平滑动距离
    const diffX = currentX - touchStartX.value;
    
    // 从右向左滑动超过阈值时关闭设置面板
    if (diffX < -touchThreshold) {
      closeSettings();
      touchStartX.value = 0;
    }
  }
  // #endif
};

// 处理触摸结束
const handleTouchEnd = (e) => {
  // H5环境下忽略此操作，APP和小程序才执行
  // #ifndef H5
  if (!props.visible || gestureLocked.value) return;
  
  // 如果正在滑动，则关闭设置面板
  if (isSliding.value) {
    closeSettings();
    isSliding.value = false;
  }
  
  // 重置触摸起始点
  touchStartX.value = 0;
  touchStartY.value = 0;
  // #endif
};

// 显示退出登录确认
const showLogoutConfirm = (e) => {
  // H5环境下阻止事件冒泡
  // #ifdef H5
  if (e) e.stopPropagation();
  // #endif
  
  isConfirmingLogout.value = true;
};

// 更新昵称方法
const updateNickname = async () => {
  if (isProcessing.value || !newNickname.value.trim() || newNickname.value === originalNickname.value) {
    return;
  }
  
  isProcessing.value = true;
  
  try {
    uni.showLoading({
      title: '更新中...'
    });
    
    // 这里添加实际的API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 通知父组件昵称已更改
    emit('nickname-change', newNickname.value);
    
    uni.showToast({
      title: '昵称更新成功',
      icon: 'success'
    });
    
    // 更新原始昵称，清除未保存标记
    originalNickname.value = newNickname.value;
    hasUnsavedChanges.value = false;
    
    // 返回主设置界面
    isEditingNickname.value = false;
  } catch (error) {
    uni.showToast({
      title: '更新失败，请重试',
      icon: 'error'
    });
  } finally {
    uni.hideLoading();
    isProcessing.value = false;
  }
};

// 取消退出登录
const cancelLogout = (e) => {
  // H5环境下阻止事件冒泡
  // #ifdef H5
  if (e) e.stopPropagation();
  // #endif
  
  isConfirmingLogout.value = false;
  // 返回主设置页面而不是关闭整个面板
};

// 更新退出登录方法
const logout = async () => {
  if (isProcessing.value) return;
  
  isProcessing.value = true;
  
  try {
    uni.showLoading({
      title: '退出中...'
    });
    
    // 这里添加实际的退出登录逻辑
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 通知父组件用户已退出登录
    emit('logout');
    closeSettings();
    
    uni.showToast({
      title: '已退出登录',
      icon: 'success'
    });
  } catch (error) {
    uni.showToast({
      title: '退出失败，请重试',
      icon: 'error'
    });
  } finally {
    uni.hideLoading();
    isProcessing.value = false;
  }
};

// 注册返回按钮监听
const registerBackButtonListener = () => {
  // #ifdef APP-PLUS
  // 仅在APP环境使用plus对象
  if (plus && plus.key) {
    plus.key.addEventListener('backbutton', handleBackButton);
  }
  // #endif
  
  // APP和小程序环境都使用拦截器
  // #ifdef APP-PLUS || MP-WEIXIN
  uni.addInterceptor('navigateBack', {
    success: handleBackButtonInterceptor
  });
  // #endif
};

// 移除返回按钮监听
const unregisterBackButtonListener = () => {
  // #ifdef APP-PLUS
  // 仅在APP环境使用plus对象
  if (plus && plus.key) {
    plus.key.removeEventListener('backbutton', handleBackButton);
  }
  // #endif
  
  // APP和小程序环境都使用拦截器
  // #ifdef APP-PLUS || MP-WEIXIN
  try {
    uni.removeInterceptor('navigateBack');
  } catch (e) {
    console.error('移除拦截器失败:', e);
  }
  // #endif
};

// 处理返回按钮
const handleBackButton = () => {
  // 如果设置面板可见，拦截返回事件
  if (props.visible) {
    handleBackOrClose();
    return true; // 返回true表示已拦截处理
  }
  return false; // 未拦截，交由系统处理
};

// 拦截返回导航
const handleBackButtonInterceptor = (e) => {
  if (props.visible) {
    // 阻止默认返回行为
    e.cancel = true;
    // 自定义处理
    handleBackOrClose();
  }
  return e;
};

// 注册TabBar点击拦截器
const registerTabBarInterceptor = () => {
  // #ifdef MP-WEIXIN || APP-PLUS
  try {
    uni.addInterceptor('switchTab', {
      invoke: interceptTabBarClick
    });
  } catch (e) {
    console.error('注册TabBar拦截器失败:', e);
  }
  // #endif
};

// 移除TabBar点击拦截器
const unregisterTabBarInterceptor = () => {
  // #ifdef MP-WEIXIN || APP-PLUS
  try {
    uni.removeInterceptor('switchTab');
  } catch (e) {
    console.error('移除TabBar拦截器失败:', e);
  }
  // #endif
};

// 拦截TabBar点击
const interceptTabBarClick = (e) => {
  if (props.visible) {
    // 如果有未保存的修改，显示确认弹窗
    if (hasUnsavedChanges.value) {
      showConfirmAbandonDialog();
      return false; // 拦截点击
    } else {
      // 直接关闭设置面板
      closeSettings();
    }
  }
  return e; // 不拦截
};

// 组件挂载时
onMounted(() => {
  // 监听页面路由变化，确保关闭设置面板
  try {
    // #ifdef APP-PLUS
    // TabBar中间按钮点击监听仅在APP中有效
    uni.onTabBarMidButtonTap(() => {
      if (props.visible) {
        if (hasUnsavedChanges.value) {
          showConfirmAbandonDialog();
        } else {
          closeSettings();
        }
      }
    });
    // #endif
  } catch (e) {
    console.error('注册TabBar中间按钮点击监听失败:', e);
  }
  
  // 获取系统信息
  uni.getSystemInfo({
    success: (res) => {
      panelWidth.value = res.windowWidth;
    },
    fail: (err) => {
      console.error('获取系统信息失败:', err);
      // 设置默认宽度
      panelWidth.value = 375;
    }
  });
  
  // 如果组件可见，立即设置面板可见状态
  if (props.visible) {
    panelVisible.value = true;
    
    // #ifdef APP-PLUS || MP-WEIXIN
    // 在APP和小程序环境中添加额外延迟初始化
    setTimeout(() => {
      // 再次确保面板可见
      if (props.visible && !panelVisible.value) {
        panelVisible.value = true;
      }
    }, 100);
    // #endif
  }
});

// 组件卸载时
onUnmounted(() => {
  try {
    // 确保移除所有事件监听器
    unregisterBackButtonListener();
    unregisterTabBarInterceptor();
  } catch (e) {
    console.error('移除事件监听器失败:', e);
  }
});
</script>

<style lang="scss">
/* 全局样式修复 */
page {
  --window-height: 100vh;
}

.user-settings-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  
  // #ifdef H5
  // H5环境下强制禁止点击事件冒泡导致面板消失
  pointer-events: auto !important;
  // #endif
  
  .mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 9998;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: auto;
    
    &.visible {
      opacity: 1;
    }
  }
  
  .settings-panel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 10000;
    background-color: #ffffff;
    
    // #ifdef H5
    // H5环境样式，侧边设置风格
    position: fixed !important;
    top: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    left: auto !important;
    width: 360px !important; // 桌面端宽度
    max-width: 85% !important; // 移动端最大宽度百分比
    height: 100vh !important;
    max-height: 100vh !important;
    border-radius: 8px 0 0 8px !important;
    transform: translateX(100%) !important;
    transition: transform 0.3s ease !important;
    box-shadow: -4px 0 16px rgba(0, 0, 0, 0.1) !important;
    overflow-y: auto !important; // 允许内容滚动

    &.visible {
      transform: translateX(0) !important;
    }
    
    // H5侧边栏样式优化
    .panel-header {
      position: sticky !important;
      top: 0 !important;
      background-color: #fff !important;
      z-index: 10 !important;
    }
    
    .panel-content {
      height: auto !important;
      min-height: calc(100vh - 150px) !important;
    }
    // #endif
    
    // #ifdef MP-WEIXIN
    /* 微信小程序专用样式 */
    width: 100% !important;
    height: 85vh;
    border-radius: 20rpx 20rpx 0 0;
    transform: translateY(100%);
    // #endif
    
    // #ifdef APP-PLUS
    /* APP专用样式 */
    height: 80vh;
    border-radius: 30rpx 30rpx 0 0;
    transform: translateY(100%);
    // #endif
    
    // #ifndef H5 || APP-PLUS || MP-WEIXIN
    /* 其他平台样式 */
    height: 80vh;
    border-radius: 30rpx 30rpx 0 0;
    transform: translateY(100%);
    // #endif
    
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.1);
    
    &.visible {
      transform: translateY(0) !important;
    }
    
    /* 小程序专用修复 */
    &.weapp-fix {
      // #ifdef MP-WEIXIN
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      // #endif
    }
    
    &.fullscreen {
      // #ifndef H5
      height: 80vh;
      // #endif
      
      .panel-content {
        -webkit-overflow-scrolling: touch; // 增加iOS滚动惯性
      }
    }
    
    &.sliding {
      transition: none;
    }
    
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 30rpx;
      border-bottom: 2rpx solid #f5f5f5;
      background-color: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(10px);
      position: sticky;
      top: 0;
      z-index: 1;
      
      .panel-title {
        font-size: 32rpx;
        font-weight: 600;
        color: #333;
      }
      
      .close-btn {
        padding: 10rpx;
        margin: -10rpx;
        border-radius: 50%;
        transition: background-color 0.2s ease;
        
        &:active {
          background-color: #f5f5f5;
        }
      }
    }
    
    .panel-content {
      flex: 1;
      padding: 20rpx 0;
      overflow-y: auto;
      
      .settings-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 30rpx;
        border-bottom: 2rpx solid #f5f5f5;
        transition: background-color 0.2s ease;
        
        &:active {
          background-color: #f9f9f9;
        }
        
        &.non-clickable {
          background-color: #fafafa;
          
          &:active {
            background-color: #fafafa;
          }
        }
        
        .item-label {
          display: flex;
          align-items: center;
          
          text {
            font-size: 28rpx;
            color: #333;
            margin-left: 15rpx;
          }
        }
        
        .item-content {
          display: flex;
          align-items: center;
          
          .avatar-preview {
            width: 80rpx;
            height: 80rpx;
            border-radius: 50%;
            margin-right: 15rpx;
            background-color: #eee;
            border: 2rpx solid #f0f0f0;
            transition: transform 0.2s ease, box-shadow 0.3s ease;
            
            &:active {
              transform: scale(0.95);
            }
            
            &.avatar-updated {
              border-color: #4361ee;
              box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.2);
              animation: avatar-pulse 1.5s infinite;
            }
          }
          
          .item-right {
            display: flex;
            align-items: center;
            
            .success-text {
              font-size: 24rpx;
              color: #4361ee;
              margin-right: 8rpx;
            }
          }
          
          .nickname-preview,
          .bio-preview,
          .email-preview {
            font-size: 28rpx;
            color: #666;
            margin-right: 15rpx;
            max-width: 300rpx;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          .email-preview {
            color: #999;
            user-select: none;
          }
        }
        
        &.logout-item {
          margin-top: 50rpx;
          border-top: 10rpx solid #f5f5f5;
          
          .logout-text {
            color: #ff6b6b;
          }
          
          &:active {
            background-color: #fff5f5;
          }
        }
      }
    }
    
    // 昵称编辑面板
    .nickname-edit-panel {
      flex: 1;
      padding: 30rpx;
      
      .nickname-input-container {
        position: relative;
        margin-top: 20rpx;
        
        .nickname-input {
          width: 100%;
          height: 90rpx;
          background-color: #f8f8f8;
          border: 2rpx solid #eee;
          border-radius: 8rpx;
          padding: 0 20rpx;
          font-size: 30rpx;
          color: #333;
          transition: border-color 0.2s ease;
          
          &:focus {
            border-color: #4361ee;
            background-color: #fff;
          }
        }
        
        .char-count {
          position: absolute;
          right: 20rpx;
          bottom: -50rpx;
          font-size: 24rpx;
          color: #999;
        }
      }
      
      .nickname-actions {
        display: flex;
        justify-content: space-between;
        margin-top: 80rpx;
        
        .nickname-action-btn {
          width: 45%;
          height: 80rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8rpx;
          font-size: 30rpx;
          transition: all 0.2s ease;
          
          &.cancel {
            background-color: #f8f8f8;
            color: #666;
            border: 2rpx solid #eee;
            
            &:active {
              background-color: #f0f0f0;
            }
          }
          
          &.confirm {
            background-color: #4361ee;
            color: #fff;
            
            &:active {
              background-color: #3651d4;
              transform: translateY(2rpx);
            }
          }
        }
      }
    }
    
    // 退出登录确认面板
    .logout-confirm-panel {
      flex: 1;
      padding: 40rpx 30rpx;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      
      .logout-confirm-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 60rpx;
        
        .logout-confirm-text {
          font-size: 34rpx;
          color: #333;
          margin-top: 30rpx;
          font-weight: 500;
        }
      }
      
      .logout-actions {
        display: flex;
        justify-content: space-between;
        margin-bottom: 60rpx;
        
        .logout-action-btn {
          width: 45%;
          height: 80rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8rpx;
          font-size: 30rpx;
          transition: all 0.2s ease;
          
          &.cancel {
            background-color: #f8f8f8;
            color: #666;
            border: 2rpx solid #eee;
            
            &:active {
              background-color: #f0f0f0;
            }
          }
          
          &.confirm {
            background-color: #ff6b6b;
            color: #fff;
            
            &:active {
              background-color: #ff5252;
              transform: translateY(2rpx);
            }
          }
        }
      }
    }
    
    .version-info {
      padding: 30rpx;
      text-align: center;
      background-color: #fff;
      position: sticky;
      bottom: 0;
      border-top: 2rpx solid #f5f5f5;
      
      // #ifdef H5
      // H5侧边栏版本信息样式
      position: relative !important;
      margin-top: auto !important;
      padding: 20px 0 !important;
      // #endif
      
      text {
        font-size: 24rpx;
        color: #999;
      }
    }
  }
}

@keyframes avatar-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(67, 97, 238, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(67, 97, 238, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(67, 97, 238, 0);
  }
}
</style> 