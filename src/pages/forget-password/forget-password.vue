<template>
	<view class="container">
		<view class="login-container">
			<view class="title-area">
				<text class="title">忘记密码</text>
				<text class="subtitle">请输入注册邮箱以重置密码</text>
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
								placeholder="请输入注册邮箱"
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
						<text class="input-label">验证码</text>
						<view class="input-wrapper code-wrapper">
							<uni-icons type="chat" size="20" color="#999"></uni-icons>
							<input 
								type="text" 
								class="input-field" 
								v-model="data.formData.verificationCode" 
								placeholder="请输入验证码"
								@input="validateVerificationCode" 
							/>
							<uni-icons 
								v-if="data.formData.verificationCode"
								type="clear" 
								size="20" 
								color="#999"
								@click="clearVerificationCode"
							></uni-icons>
							<button class="get-code-btn" @click="getVerificationCode" :disabled="data.codeBtnDisabled">
								{{ data.codeBtnText }}
							</button>
						</view>
						<text 
							v-if="data.errors.verificationCode"
							class="validation-feedback show-feedback"
						>{{ data.errors.verificationCode }}</text>
					</view>

					<view class="input-group">
						<text class="input-label">新密码</text>
						<view class="input-wrapper">
							<uni-icons type="locked" size="20" color="#999"></uni-icons>
							<input 
								:type="data.showPassword ? 'text' : 'password'" 
								class="input-field"
								v-model="data.formData.newPassword" 
								placeholder="请输入新密码" 
								@input="validateNewPassword" 
							/>
							<uni-icons 
								v-if="data.formData.newPassword"
								type="clear" 
								size="20" 
								color="#999"
								@click="clearNewPassword"
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
							v-if="data.errors.newPassword"
							class="validation-feedback show-feedback"
						>{{ data.errors.newPassword }}</text>
					</view>

					<button class="btn-login" :disabled="data.loading" @click="handleSubmit">
						<text v-if="!data.loading">重置密码</text>
						<text v-else>重置中...</text>
					</button>

					<view class="register-link">
						<text>返回</text>
						<text @click="goBack" class="register-text">登录页面</text>
					</view>
				</view>
			</form>
		</view>
	</view>
</template>

<script setup>
import { reactive } from 'vue';
// 导入uni-icons组件
import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';
// 导入API服务
// 从/src/api/auth.js中导入验证码发送和密码重置方法
// 这些方法封装了相关API请求，处理了不同平台的URL适配和统一的错误处理
import { sendVerificationCode, resetPassword } from '@/api/auth.js';

// 使用reactive统一管理所有数据
const data = reactive({
	// 表单数据
	formData: {
		username: '',
		verificationCode: '',
		newPassword: ''
	},
	// 错误信息
	errors: {
		username: '',
		verificationCode: '',
		newPassword: ''
	},
	// 界面状态
	loading: false,
	showPassword: false,
	// 验证码按钮状态
	codeBtnDisabled: false,
	codeBtnText: '获取验证码',
	countdown: 60,
	// 验证码状态
	codeStatus: {
		sent: false,
		error: false,
		message: ''
	}
});

/**
 * 验证用户名（邮箱或手机号）
 * @returns {boolean} 验证结果
 */
const validateUsername = () => {
	const value = data.formData.username.trim();
	if (!value) {
		data.errors.username = '请输入邮箱';
		return false;
	}

	// 验证邮箱格式
	const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
	if (!isEmail) {
		data.errors.username = '请输入有效的邮箱格式';
		return false;
	}

	data.errors.username = '';
	return true;
};

/**
 * 验证验证码
 * @returns {boolean} 验证结果
 */
const validateVerificationCode = () => {
	const value = data.formData.verificationCode.trim();
	if (!value) {
		data.errors.verificationCode = '请输入验证码';
		return false;
	}

	if (value.length !== 6) {
		data.errors.verificationCode = '验证码必须为 6 位';
		return false;
	}

	data.errors.verificationCode = '';
	return true;
};

/**
 * 验证新密码
 * @returns {boolean} 验证结果
 */
const validateNewPassword = () => {
	const value = data.formData.newPassword.trim();
	if (!value) {
		data.errors.newPassword = '请输入新密码';
		return false;
	}

	if (value.length < 6) {
		data.errors.newPassword = '密码至少需要 6 位';
		return false;
	}

	data.errors.newPassword = '';
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
 * 清空验证码输入框
 */
const clearVerificationCode = () => {
	data.formData.verificationCode = '';
	data.errors.verificationCode = '';
};

/**
 * 清空新密码输入框
 */
const clearNewPassword = () => {
	data.formData.newPassword = '';
	data.errors.newPassword = '';
};

/**
 * 获取验证码
 */
const getVerificationCode = () => {
	if (!validateUsername()) {
		uni.showToast({
			title: '请先输入有效的邮箱',
			icon: 'none'
		});
		return;
	}
	
	// 禁用按钮并开始倒计时
	data.codeBtnDisabled = true;
	data.countdown = 60;
	data.codeBtnText = `${data.countdown}秒后重新获取`;
	
	const timer = setInterval(() => {
		data.countdown--;
		data.codeBtnText = `${data.countdown}秒后重新获取`;
		
		if (data.countdown <= 0) {
			clearInterval(timer);
			data.codeBtnDisabled = false;
			data.codeBtnText = '获取验证码';
		}
	}, 1000);
	
	// 调用发送验证码API
	sendVerificationCode({
		email: data.formData.username.trim()
	}).then(res => {
		if (res.code === 200) {
			data.codeStatus.sent = true;
			data.codeStatus.error = false;
			data.codeStatus.message = '';
			
			uni.showToast({
				title: '验证码已发送，有效期10分钟',
				icon: 'success',
				duration: 2000
			});
		} else {
			data.codeStatus.sent = false;
			data.codeStatus.error = true;
			data.codeStatus.message = res.message || '发送失败';
			
			uni.showToast({
				title: res.message || '发送失败',
				icon: 'none'
			});
			// 发送失败，重置按钮状态
			clearInterval(timer);
			data.codeBtnDisabled = false;
			data.codeBtnText = '获取验证码';
		}
	}).catch(err => {
		console.error('发送验证码失败', err);
		data.codeStatus.sent = false;
		data.codeStatus.error = true;
		data.codeStatus.message = '网络错误，请稍后重试';
		
		uni.showToast({
			title: err.message || '发送失败，请检查网络',
			icon: 'none'
		});
		// 发送失败，重置按钮状态
		clearInterval(timer);
		data.codeBtnDisabled = false;
		data.codeBtnText = '获取验证码';
	});
};

/**
 * 提交表单
 */
const handleSubmit = () => {
	const usernameValid = validateUsername();
	const verificationCodeValid = validateVerificationCode();
	const newPasswordValid = validateNewPassword();

	if (usernameValid && verificationCodeValid && newPasswordValid) {
		data.loading = true;

		// 调用重置密码API
		resetPassword({
			email: data.formData.username.trim(),
			email_code: data.formData.verificationCode.trim(),
			new_password: data.formData.newPassword
		}).then(res => {
			if (res.code === 200) {
				uni.showToast({
					title: '密码重置成功',
					icon: 'success',
					duration: 2000
				});
				setTimeout(() => {
					// 跳转到登录页面
					uni.navigateTo({
						url: '/pages/login/login'
					});
				}, 1500);
			}
			data.loading = false;
		}).catch(err => {
			console.error('重置密码失败', err);
			
			// 根据错误码处理不同情况
			if (err.code === 400) {
				// 参数错误或验证码错误
				if (err.message && err.message.includes('验证码')) {
					data.errors.verificationCode = err.message;
				} else if (err.message && err.message.includes('邮箱')) {
					data.errors.username = err.message;
				} else if (err.message && err.message.includes('密码')) {
					data.errors.newPassword = err.message;
				}
			} else if (err.code === 404) {
				// 用户不存在
				data.errors.username = '该邮箱未注册';
			} else if (err.code === 409) {
				// 新密码与原密码相同
				data.errors.newPassword = '新密码不能与原密码相同';
			}
			
			uni.showToast({
				title: err.message || '重置密码失败，请稍后重试',
				icon: 'none',
				duration: 2000
			});
			
			data.loading = false;
		});
	}
};

/**
 * 返回登录页面
 */
const goBack = () => {
	uni.navigateTo({
		url: '/pages/login/login'
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
	
	// 主容器
	.login-container {
		background: rgba(255, 255, 255, 0.95);
		width: 100%;
		max-width: 320px;
		padding: 60rpx 40rpx;
		border-radius: 40rpx;
		box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.1);
		max-height: 90vh; // 限制最大高度
		overflow-y: auto; // 内容超出时显示滚动条
		
		// 标题区域
		.title-area {
			display: flex;
			flex-direction: column;
			align-items: center;
			margin-bottom: 60rpx;
			
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
					width: 100%;
					height: 96rpx;
					background: #f8f8f8;
					border: 1px solid #eee;
					border-radius: 20rpx;
					padding: 0 10rpx;
					transition: all 0.3s ease;
					
					&.code-wrapper {
						padding-right: 0;
					}
					
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
					
					.get-code-btn {
						height: 96rpx;
						background: #4361ee;
						color: white;
						font-size: 24rpx;
						border-radius: 0 20rpx 20rpx 0;
						margin: 0;
						padding: 0 20rpx;
						border: none;
						line-height: 96rpx;
						display: flex;
						align-items: center;
						justify-content: center;
						min-width: 180rpx;
						
						&:disabled {
							background: #999;
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
			
			// 重置密码按钮
			.btn-login {
				width: 100%;
				background: #4361ee;
				color: white;
				border: none;
				border-radius: 20rpx;
				font-size: 32rpx;
				font-weight: 500;
				margin-top: 20rpx;
				transition: all 0.3s ease;
				height: 90rpx;
				line-height: 90rpx;
				
				&:hover {
					background: #3a57d1;
					box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.15);
				}
				
				&:active {
					transform: scale(0.95);
					background: #324cb7;
				}
			}
			
			// 返回登录链接
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