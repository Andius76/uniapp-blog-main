<template>
	<view class="container">
		<view class="login-container">
			<view class="title-area">
				<text class="title">登录</text>
				<text class="subtitle">欢迎回来，请输入您的账号密码</text>
			</view>
			<form @submit.prevent="handleSubmit">
				<view class="form-area">
					<view class="input-group">
						<text class="input-label">邮箱</text>
						<view class="input-wrapper">
							<uni-icons type="person" size="20" color="#999"></uni-icons>
							<input 
								type="text" 
								class="input-field" 
								v-model="data.formData.username" 
								placeholder="请输入邮箱"
								@input="validateUsername" 
							/>
							<uni-icons 
								v-if="data.formData.username"
								type="clear" 
								size="20" 
								color="#999"
								@click="clearUsername"
							></uni-icons>
						</view>
						<text 
							v-if="data.errors.username"
							class="validation-feedback show-feedback"
						>{{ data.errors.username }}</text>
					</view>

					<view class="input-group">
						<text class="input-label">密码</text>
						<view class="input-wrapper">
							<uni-icons type="locked" size="20" color="#999"></uni-icons>
							<input 
								:type="data.showPassword ? 'text' : 'password'" 
								class="input-field"
								v-model="data.formData.password" 
								placeholder="请输入密码" 
								@input="validatePassword" 
							/>
							<uni-icons 
								v-if="data.formData.password"
								type="clear" 
								size="20" 
								color="#999"
								@click="clearPassword"
								style="margin-right: 10rpx;"
							></uni-icons>
							<uni-icons 
								:type="data.showPassword ? 'eye-slash' : 'eye'" 
								size="20" 
								color="#999"
								@click="togglePasswordVisibility"
							></uni-icons>
						</view>
						<text 
							v-if="data.errors.password"
							class="validation-feedback show-feedback"
						>{{ data.errors.password }}</text>
					</view>

					<view class="form-options">
						<view class="remember-me">
							<switch 
								:checked="data.formData.remember"
								@change="handleSwitchChange"
								color="#4361ee"
								style="transform: scale(0.8); margin-right: 5px;"
							/>
							<text>保持登录</text>
						</view>
						<text @click="goToForgotPassword" class="forgot-password">忘记密码</text>
					</view>

					<button class="btn-login" :disabled="data.loading" @click="handleSubmit">
						<text v-if="!data.loading">立即登录</text>
						<text v-else>登录中...</text>
					</button>

					<view class="register-link">
						<text>没有账号？</text>
						<text @click="goToRegister" class="register-text">立即注册</text>
					</view>
				</view>
			</form>
		</view>
	</view>
</template>

<script setup>
import { reactive, onMounted, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app'; // 添加onLoad导入
// 导入uni-icons组件
import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';
// 导入API服务
// 从/src/api/auth.js中导入login方法
// 该方法封装了登录API请求，处理了不同平台的URL适配和统一的错误处理
import { login } from '@/api/auth.js';
import http from '@/utils/request.js';

// 使用reactive统一管理所有数据
const data = reactive({
	// 表单数据
	formData: {
		username: '',
		password: '',
		remember: false
	},
	// 错误信息
	errors: {
		username: '',
		password: ''
	},
	// 界面状态
	loading: false,
	showPassword: false
});

// 保存重定向URL
const redirectUrl = ref('');

// 使用onLoad而不是onMounted来获取页面参数
onLoad((options) => {
	console.log('登录页面参数:', options);
	if (options && options.redirect) {
		redirectUrl.value = decodeURIComponent(options.redirect);
		console.log('重定向URL:', redirectUrl.value);
	}
});

/**
 * 验证用户名（邮箱）
 * @returns {boolean} 验证结果
 */
const validateUsername = () => {
	const value = data.formData.username.trim();
	if (!value) {
		data.errors.username = '请输入邮箱';
		return false;
	}

	// 验证邮箱或手机号格式
	const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
	if (!isEmail) {
		data.errors.username = '请输入有效的邮箱';
		return false;
	}

	data.errors.username = '';
	return true;
};

/**
 * 验证密码
 * @returns {boolean} 验证结果
 */
const validatePassword = () => {
	const value = data.formData.password.trim();
	if (!value) {
		data.errors.password = '请输入密码';
		return false;
	}

	if (value.length < 6) {
		data.errors.password = '密码至少需要6位';
		return false;
	}

	data.errors.password = '';
	return true;
};

/**
 * 切换密码显示/隐藏
 */
const togglePasswordVisibility = () => {
	data.showPassword = !data.showPassword;
};

/**
 * 清空用户名输入框
 */
const clearUsername = () => {
	data.formData.username = '';
	data.errors.username = '';
};

/**
 * 清空密码输入框
 */
const clearPassword = () => {
	data.formData.password = '';
	data.errors.password = '';
};

/**
 * switch开关状态变化处理函数
 */
const handleSwitchChange = (e) => {
	// switch组件的值直接从e.detail.value获取布尔值
	data.formData.remember = e.detail.value;
	console.log('switch值变更为:', data.formData.remember);
};

/**
 * 提交表单
 */
const handleSubmit = () => {
	const usernameValid = validateUsername();
	const passwordValid = validatePassword();

	if (usernameValid && passwordValid) {
		data.loading = true;
		
		// 打印提交前的remember值
		console.log('提交前remember值:', data.formData.remember);

		// 调用登录API
		login({
			email: data.formData.username.trim(),
			password: data.formData.password,
			remember: data.formData.remember
		}).then(res => {
			if (res.code === 200) {
				// 登录成功，保存token到本地存储
				uni.setStorageSync('token', res.data.token);
				// 如果用户信息存在，也保存到本地
				if (res.data.user) {
					uni.setStorageSync('userInfo', res.data.user);
				}
				
				// 提示登录成功
				uni.showToast({
					title: '登录成功',
					icon: 'success',
					duration: 2000
				});
				
				// 根据是否有重定向URL决定跳转位置
				setTimeout(() => {
					if (redirectUrl.value) {
						uni.redirectTo({
							url: redirectUrl.value
						});
					} else {
						// 默认跳转到首页或个人中心
					uni.switchTab({
						url: '/pages/index/index'
					});
					}
				}, 1500);
			}
			data.loading = false;
		}).catch(err => {
			console.error('登录失败:', err);
			
			// 错误处理
			if (err.code === 401) {
				data.errors.password = '账号或密码错误';
			} else if (err.code === 403) {
				data.errors.username = '账号已被禁用';
			}
			
			// 显示错误提示
			uni.showToast({
				title: err.message || '登录失败，请稍后重试',
				icon: 'none',
				duration: 2000
			});
			
			// 添加定时器，3秒后清除错误提示
			setTimeout(() => {
				data.errors.username = '';
				data.errors.password = '';
			}, 3000);
			
			data.loading = false;
		});
	}
};

/**
 * 跳转到忘记密码页面
 */
const goToForgotPassword = () => {
	uni.navigateTo({
		url: '/pages/forget-password/forget-password'
	});
};

/**
 * 跳转到注册页面
 */
const goToRegister = () => {
	uni.navigateTo({
		url: '/pages/register/register'
	});
};
</script>

<style lang="scss">
// 页面基础样式
page {
	background: linear-gradient(135deg, #5c75e0, #3f37c9);
	min-height: 100vh;
	overflow: hidden; // 防止页面滚动
}

// 主容器
.container {
	height: 100vh; // 固定高度
	min-height: 100vh;
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 0 40rpx;
	overflow: hidden; // 防止容器滚动
	
	// 登录容器
	.login-container {
		background: rgba(255, 255, 255, 0.95);
		width: 100%;
		max-width: 320px;
		padding: 60rpx 50rpx;
		border-radius: 40rpx;
		box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.1);
		max-height: 90vh; // 限制最大高度
		overflow-y: auto; // 内容超出时显示滚动条
		
		// 标题区域
		.title-area {
			display: flex;
			flex-direction: column;
			align-items: center;
			margin-bottom: 40rpx;
			
			.title {
				font-size: 48rpx;
				font-weight: bold;
				color: #333;
				margin-bottom: 20rpx;
			}
			
			.subtitle {
				font-size: 28rpx;
				color: #666;
				text-align: center;
			}
		}
		
		// 表单区域
		.form-area {
			margin-bottom: 20rpx;
			
			// 输入框组
			.input-group {
				margin-bottom: 30rpx;
				position: relative;
				
				.input-label {
					display: block;
					font-size: 28rpx;
					color: #666;
					margin-bottom: 16rpx;
					font-weight: 500;
				}
				
				// 输入框包装
				.input-wrapper {
					display: flex;
					align-items: center;
					width: 90%;
					height: 96rpx;
					background: #f8f8f8;
					border: 1px solid #eee;
					border-radius: 10rpx;
					padding: 0 20rpx;
					transition: all 0.3s ease;
					
					.uni-icons {
						margin-right: 10rpx;
					}
					
					.input-field {
						flex: 1;
						height: 90rpx;
						font-size: 30rpx;
						color: #333;
						background: transparent;
						border: none;
						transition: all 0.3s ease;
						
						&:focus {
							background: transparent;
						}
					}
					
					&:focus-within {
						background: #e8e8e8;
						border-color: #4361ee;
					}
				}
				
				// 验证反馈
				.validation-feedback {
					color: #e74c3c;
					font-size: 24rpx;
					margin-top: 12rpx;
					display: none;
					height: 36rpx;
					
					&.show-feedback {
						display: block;
					}
				}
			}
			
			// 表单选项区域
			.form-options {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin: 30rpx 0;
				font-size: 28rpx;
				
				.remember-me {
					display: flex;
					align-items: center;
					color: #666;
				}
				
				.forgot-password {
					color: #4361ee;
					transition: all 0.3s ease;
					
					&:hover {
						transform: scale(1.1);
					}
				}
			}
			
			// 登录按钮
			.btn-login {
				width: 100%;
				background: #4361ee;
				color: white;
				border: none;
				border-radius: 20rpx;
				font-size: 32rpx;
				font-weight: 500;
				margin-top: 20rpx;
				height: 90rpx;
				line-height: 90rpx;
				transition: all 0.3s ease;
				
				&:hover {
					background: #3a57d1;
					box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.15);
				}
				
				&:active {
					transform: scale(0.95);
					background: #324cb7;
				}
			}
			
			// 注册链接
			.register-link {
				text-align: center;
				margin-top: 40rpx;
				color: #666;
				font-size: 28rpx;
				display: flex;
				justify-content: center;
				
				.register-text {
					color: #4361ee;
					margin-left: 10rpx;
					transition: all 0.3s ease;
					
					&:hover {
						transform: scale(1.1);
					}
				}
			}
		}
	}
}
</style>