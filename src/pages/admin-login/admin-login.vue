<template>
	<view class="container">
		<view class="login-container">
			<view class="title-area">
				<text class="title">管理员登录</text>
				<text class="subtitle">后台管理系统，仅限授权人员访问</text>
			</view>
			<form @submit.prevent="handleSubmit">
				<view class="form-area">
					<view class="input-group">
						<text class="input-label">账号</text>
						<view class="input-wrapper">
							<uni-icons type="person" size="20" color="#999"></uni-icons>
							<input 
								type="text" 
								class="input-field" 
								v-model="data.formData.username" 
								placeholder="请输入管理员账号"
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
								placeholder="请输入管理员密码" 
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

					<button class="btn-login" :disabled="data.loading" @click="handleSubmit">
						<text v-if="!data.loading">管理员登录</text>
						<text v-else>登录中...</text>
					</button>

					<view class="return-link">
						<text @click="goToHome" class="return-text">返回博客首页</text>
					</view>
				</view>
			</form>
		</view>
	</view>
</template>

<script setup>
import { reactive } from 'vue';
import { adminLogin } from '@/api/admin/auth.js'; // 导入管理员登录API

// 使用reactive统一管理所有数据
const data = reactive({
	// 表单数据
	formData: {
		username: '',
		password: ''
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

/**
 * 验证用户名
 * @returns {boolean} 验证结果
 */
const validateUsername = () => {
	const value = data.formData.username.trim();
	if (!value) {
		data.errors.username = '请输入账号';
		return false;
	}

	// 简单验证：账号不能包含空格
	if (/\s/.test(value)) {
		data.errors.username = '账号不能包含空格';
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
 * 提交表单
 */
const handleSubmit = () => {
	const usernameValid = validateUsername();
	const passwordValid = validatePassword();

	if (usernameValid && passwordValid) {
		data.loading = true;
		
		// 调用管理员登录API
		adminLogin({
			username: data.formData.username.trim(),
			password: data.formData.password
		}).then(res => {
			if (res.code === 200) {
				// 登录成功，保存token和管理员信息到本地存储
				uni.setStorageSync('admin_token', res.data.token);
				
				// 保存Token中包含的权限信息（如果有）
				if (res.data.permissions && Array.isArray(res.data.permissions)) {
					console.log('保存Token中的权限信息:', res.data.permissions);
					uni.setStorageSync('admin_token_roles', res.data.permissions);
				}
				
				// 保存管理员信息
				if (res.data.userInfo) {
					uni.setStorageSync('admin_info', res.data.userInfo);
				}
				
				// 保存角色信息，并打印调试信息
				const roles = res.data.roles || [];
				console.log('管理员角色信息:', JSON.stringify(roles));
				uni.setStorageSync('admin_roles', roles);
				
				// 检查是否有ADMIN权限
				if (roles.includes('ADMIN')) {
					console.log('当前管理员拥有ADMIN权限');
				} else {
					console.warn('警告: 当前管理员没有ADMIN权限');
				}
				
				// 提示登录成功
				uni.showToast({
					title: '登录成功',
					icon: 'success',
					duration: 2000
				});
				
				// 跳转到管理后台首页
				setTimeout(() => {
					uni.redirectTo({
						url: '/pages/admin/index'
					});
				}, 1000);
			} else {
				// 登录失败，显示错误信息
				console.log('登录失败响应:', res);
				uni.showToast({
					title: res.msg || '账号或密码错误',
					icon: 'none',
					duration: 2000
				});
			}
		}).catch(err => {
			console.error('登录错误:', err);
			
			// 详细记录错误
			console.log('错误详情:', JSON.stringify(err));
			
			// 处理特定状态码
			let errorMsg = '登录失败，请稍后再试';
			if (err.statusCode === 403) {
				errorMsg = '无权限访问，请联系管理员';
			} else if (err.statusCode === 401) {
				errorMsg = '账号或密码错误';
			} else if (err.data && err.data.message) {
				errorMsg = err.data.message;
			}
			
			uni.showToast({
				title: errorMsg,
				icon: 'none',
				duration: 2000
			});
		}).finally(() => {
			data.loading = false;
		});
	}
};

/**
 * 返回首页
 */
const goToHome = () => {
	uni.redirectTo({
		url: '/pages/index/index'
	});
};
</script>

<style>
.container {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100vh;
	background-color: #f8f8f8;
}

.login-container {
	width: 90%;
	max-width: 400px;
	background-color: #fff;
	border-radius: 12px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	padding: 30px 20px;
}

.title-area {
	margin-bottom: 30px;
	text-align: center;
}

.title {
	font-size: 24px;
	font-weight: bold;
	color: #333;
	margin-bottom: 10px;
	display: block;
}

.subtitle {
	font-size: 14px;
	color: #999;
	display: block;
}

.form-area {
	padding: 0 10px;
}

.input-group {
	margin-bottom: 20px;
}

.input-label {
	font-size: 14px;
	color: #666;
	margin-bottom: 8px;
	display: block;
}

.input-wrapper {
	display: flex;
	align-items: center;
	border-bottom: 1px solid #eee;
	padding: 10px 0;
}

.input-field {
	flex: 1;
	height: 40px;
	padding: 0 10px;
	font-size: 16px;
	border: none;
}

.validation-feedback {
	font-size: 12px;
	color: #ff4d4f;
	margin-top: 4px;
	display: none;
}

.show-feedback {
	display: block;
}

.btn-login {
	width: 100%;
	height: 45px;
	background-color: #4361ee;
	color: #fff;
	border: none;
	border-radius: 6px;
	font-size: 16px;
	margin-top: 20px;
	display: flex;
	justify-content: center;
	align-items: center;
}

.btn-login:active {
	background-color: #3a56d4;
}

.btn-login:disabled {
	background-color: #ccc;
	cursor: not-allowed;
}

.return-link {
	margin-top: 20px;
	text-align: center;
}

.return-text {
	font-size: 14px;
	color: #4361ee;
}
</style> 